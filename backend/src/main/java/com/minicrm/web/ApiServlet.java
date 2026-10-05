package com.minicrm.web;

import com.minicrm.dao.CrudDao;
import com.minicrm.dao.CrudDao.ValidationException;
import com.minicrm.db.Database;
import com.minicrm.json.Json;
import com.minicrm.model.Table;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Front controller for the whole REST API:
 *
 *   GET    /api/health                  -> service + database status
 *   GET    /api/{table}                 -> all rows, ordered by id
 *   GET    /api/{table}/{id}            -> one row (404 if missing)
 *   POST   /api/{table}                 -> insert (201 + the new row)
 *   PUT    /api/{table}/{id}            -> partial update (the updated row)
 *   DELETE /api/{table}/{id}            -> delete (204); FK cascade rules apply
 *   POST   /api/leads/{id}/convert      -> lead -> account + contact (transaction)
 *
 * Answers are always JSON; problems come back as {"error": "..."} with a
 * matching status code.
 */
public class ApiServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handle(req, res, "GET");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handle(req, res, "POST");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handle(req, res, "PUT");
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handle(req, res, "DELETE");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res) {
        setCors(res);
        res.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private void handle(HttpServletRequest req, HttpServletResponse res, String method) throws IOException {
        setCors(res);
        res.setContentType("application/json; charset=utf-8");

        String path = req.getPathInfo() == null ? "/" : req.getPathInfo();
        String[] parts = path.startsWith("/") ? path.substring(1).split("/") : path.split("/");

        try {
            if (parts.length == 1 && parts[0].equals("health")) {
                health(res);
                return;
            }

            Table table = (Table) Table.ALL.get(parts[0]);
            if (table == null) {
                send(res, HttpServletResponse.SC_NOT_FOUND,
                        error("Unknown resource '/api/" + parts[0] + "'"));
                return;
            }

            Integer id = null;
            if (parts.length >= 2 && !parts[1].isEmpty()) {
                try {
                    id = Integer.valueOf(parts[1]);
                } catch (NumberFormatException e) {
                    send(res, HttpServletResponse.SC_BAD_REQUEST,
                            error("Invalid id '" + parts[1] + "'"));
                    return;
                }
            }

            String action = parts.length >= 3 ? parts[2] : null;
            if (parts.length > 3) {
                send(res, HttpServletResponse.SC_NOT_FOUND, error("Unknown path " + path));
                return;
            }

            Connection connection = Database.getConnection();
            try {
                Object response = route(connection, req, method, table, id, action, res);
                if (response != NO_BODY) send(res, statusFor(method), response);
            } finally {
                connection.close();
            }
        } catch (ValidationException e) {
            send(res, 422, error(e.getMessage()));
        } catch (SQLException e) {
            if (e.getSQLState() != null && e.getSQLState().startsWith("23")) {
                send(res, HttpServletResponse.SC_CONFLICT,
                        error("This value conflicts with an existing record (" + e.getMessage() + ")"));
            } else {
                e.printStackTrace();
                send(res, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                        error("Database error: " + e.getMessage()));
            }
        } catch (IllegalArgumentException e) {
            send(res, HttpServletResponse.SC_BAD_REQUEST, error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            send(res, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, error("Server error: " + e));
        }
    }

    private static final Object NO_BODY = new Object();

    private Object route(Connection c, HttpServletRequest req, String method,
                         Table table, Integer id, String action, HttpServletResponse res)
            throws Exception {

        // ---- /api/leads/{id}/convert ------------------------------------
        if (action != null) {
            if (table.name.equals("leads") && action.equals("convert") && method.equals("POST") && id != null) {
                Map<String, Object> result = CrudDao.convertLead(c, id.intValue());
                if (result == null) return notFound(res, table, id.intValue());
                return result;
            }
            return notFoundRoute(res, action);
        }

        // ---- /api/{table} -------------------------------------------------
        if (id == null) {
            if (method.equals("GET")) {
                List<Map<String, Object>> rows = CrudDao.list(c, table);
                return rows;
            }
            if (method.equals("POST")) {
                Map<String, Object> body = Json.parseObject(body(req));
                return CrudDao.insert(c, table, body);
            }
            return methodNotAllowed(res, method);
        }

        // ---- /api/{table}/{id} --------------------------------------------
        switch (method) {
            case "GET": {
                Map<String, Object> row = CrudDao.find(c, table, id.intValue());
                if (row == null) return notFound(res, table, id.intValue());
                return row;
            }
            case "PUT": {
                Map<String, Object> body = Json.parseObject(body(req));
                Map<String, Object> row = CrudDao.update(c, table, id.intValue(), body);
                if (row == null) return notFound(res, table, id.intValue());
                return row;
            }
            case "DELETE": {
                boolean deleted = CrudDao.delete(c, table, id.intValue());
                if (!deleted) return notFound(res, table, id.intValue());
                res.setStatus(HttpServletResponse.SC_NO_CONTENT);
                return NO_BODY;
            }
            default:
                return methodNotAllowed(res, method);
        }
    }

    // ------------------------------------------------------------- helpers
    private Object notFound(HttpServletResponse res, Table table, int id) {
        res.setStatus(HttpServletResponse.SC_NOT_FOUND);
        res.setContentType("application/json; charset=utf-8");
        try {
            res.getWriter().write(Json.stringify(error(
                    "No " + table.name + " record with " + table.pk + "=" + id)));
        } catch (IOException ignored) { }
        return NO_BODY;
    }

    private Object notFoundRoute(HttpServletResponse res, String action) {
        res.setStatus(HttpServletResponse.SC_NOT_FOUND);
        try {
            res.getWriter().write(Json.stringify(error("Unknown action '" + action + "'")));
        } catch (IOException ignored) { }
        return NO_BODY;
    }

    private Object methodNotAllowed(HttpServletResponse res, String method) {
        res.setStatus(405);
        try {
            res.getWriter().write(Json.stringify(error("Method " + method + " is not supported here")));
        } catch (IOException ignored) { }
        return NO_BODY;
    }

    private void health(HttpServletResponse res) throws IOException {
        Map<String, Object> status = new LinkedHashMap<String, Object>();
        status.put("status", "ok");
        status.put("database", Database.description());
        status.put("tables", Table.ALL.keySet());
        send(res, HttpServletResponse.SC_OK, status);
    }

    private static Map<String, Object> error(String message) {
        Map<String, Object> body = new LinkedHashMap<String, Object>();
        body.put("error", message);
        return body;
    }

    private static int statusFor(String method) {
        return method.equals("POST") ? HttpServletResponse.SC_CREATED : HttpServletResponse.SC_OK;
    }

    private static void send(HttpServletResponse res, int status, Object body) throws IOException {
        res.setStatus(status);
        res.getWriter().write(Json.stringify(body));
    }

    private static void setCors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static String body(HttpServletRequest req) throws IOException {
        java.io.InputStream in = req.getInputStream();
        java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int read;
        while ((read = in.read(chunk)) != -1) {
            buffer.write(chunk, 0, read);
        }
        return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
    }
}
