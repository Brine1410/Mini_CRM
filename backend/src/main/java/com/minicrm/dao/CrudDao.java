package com.minicrm.dao;

import com.minicrm.json.Json;
import com.minicrm.model.Table;
import com.minicrm.model.Table.Column;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Generic CRUD against the tables described in {@link Table}.
 * All SQL is generated from the metadata and parameterised with
 * PreparedStatements, so there is no string-concatenated user input.
 *
 * (Written in "classic" Java style — no try-with-resources or multi-catch —
 * so it also compiles with lightweight compilers like Janino.)
 */
public final class CrudDao {

    /** Thrown when the client sends invalid data (maps to HTTP 422). */
    public static class ValidationException extends Exception {
        public ValidationException(String message) { super(message); }
    }

    // ---------------------------------------------------------------- list
    public static List<Map<String, Object>> list(Connection c, Table table) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
        PreparedStatement ps = c.prepareStatement(
                "select * from " + table.name + " order by " + table.pk);
        try {
            ResultSet rs = ps.executeQuery();
            try {
                while (rs.next()) rows.add(Json.row(rs));
            } finally {
                rs.close();
            }
        } finally {
            ps.close();
        }
        return rows;
    }

    // ---------------------------------------------------------------- find
    public static Map<String, Object> find(Connection c, Table table, int id) throws SQLException {
        PreparedStatement ps = c.prepareStatement(
                "select * from " + table.name + " where " + table.pk + " = ?");
        try {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            try {
                return rs.next() ? Json.row(rs) : null;
            } finally {
                rs.close();
            }
        } finally {
            ps.close();
        }
    }

    // -------------------------------------------------------------- insert
    public static Map<String, Object> insert(Connection c, Table table, Map<String, Object> raw)
            throws SQLException, ValidationException {
        Map<Column, Object> values = validate(c, table, raw, true);

        StringBuilder columns = new StringBuilder();
        StringBuilder marks = new StringBuilder();
        List<Object> params = new ArrayList<Object>();
        for (Map.Entry<Column, Object> entry : values.entrySet()) {
            Column column = (Column) entry.getKey();
            if (columns.length() > 0) { columns.append(", "); marks.append(", "); }
            columns.append(column.name);
            marks.append('?');
            params.add(entry.getValue());
        }

        String sql = "insert into " + table.name + " (" + columns + ") values (" + marks + ")";
        long id;
        PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        try {
            bind(ps, params);
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            try {
                keys.next();
                id = keys.getLong(1);
            } finally {
                keys.close();
            }
        } finally {
            ps.close();
        }
        return find(c, table, (int) id);
    }

    // -------------------------------------------------------------- update
    public static Map<String, Object> update(Connection c, Table table, int id, Map<String, Object> raw)
            throws SQLException, ValidationException {
        if (find(c, table, id) == null) return null;
        Map<Column, Object> values = validate(c, table, raw, false);
        if (values.isEmpty()) return find(c, table, id);

        StringBuilder assignments = new StringBuilder();
        List<Object> params = new ArrayList<Object>();
        for (Map.Entry<Column, Object> entry : values.entrySet()) {
            Column column = (Column) entry.getKey();
            if (assignments.length() > 0) assignments.append(", ");
            assignments.append(column.name).append(" = ?");
            params.add(entry.getValue());
        }
        params.add(Integer.valueOf(id));

        PreparedStatement ps = c.prepareStatement(
                "update " + table.name + " set " + assignments + " where " + table.pk + " = ?");
        try {
            bind(ps, params);
            ps.executeUpdate();
        } finally {
            ps.close();
        }
        return find(c, table, id);
    }

    // -------------------------------------------------------------- delete
    public static boolean delete(Connection c, Table table, int id) throws SQLException {
        // The database itself applies ON DELETE CASCADE / ON DELETE SET NULL.
        PreparedStatement ps = c.prepareStatement(
                "delete from " + table.name + " where " + table.pk + " = ?");
        try {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } finally {
            ps.close();
        }
    }

    // ------------------------------------------------------- convert lead
    /**
     * POST /api/leads/{id}/convert — one transaction:
     * create an account from the lead's company, create a contact for the lead
     * itself, mark the lead as Converted. Mirrors CONVERT_LEAD in the original
     * in-memory reducer.
     */
    public static Map<String, Object> convertLead(Connection c, int leadId)
            throws SQLException, ValidationException {
        c.setAutoCommit(false);
        try {
            Map<String, Object> lead = find(c, (Table) Table.ALL.get("leads"), leadId);
            if (lead == null) {
                c.rollback();
                return null;
            }
            if ("Converted".equals(lead.get("status"))) {
                c.rollback();
                throw new ValidationException("This lead has already been converted");
            }

            String company = asString(lead.get("company_name"));
            if (company == null || company.trim().isEmpty()) {
                company = asString(lead.get("first_name")) + " " + asString(lead.get("last_name"));
            }
            Object owner = lead.get("assigned_user_id");

            Map<String, Object> accountValues = new LinkedHashMap<String, Object>();
            accountValues.put("account_name", company);
            accountValues.put("industry", null);
            accountValues.put("website", null);
            accountValues.put("annual_revenue", null);
            accountValues.put("owner_user_id", owner);
            Map<String, Object> account = insert(c, (Table) Table.ALL.get("accounts"), accountValues);

            Map<String, Object> contactValues = new LinkedHashMap<String, Object>();
            contactValues.put("account_id", account.get("account_id"));
            contactValues.put("first_name", lead.get("first_name"));
            contactValues.put("last_name", lead.get("last_name"));
            contactValues.put("email", lead.get("email"));
            contactValues.put("phone", lead.get("phone"));
            contactValues.put("job_title", null);
            contactValues.put("owner_user_id", owner);
            Map<String, Object> contact = insert(c, (Table) Table.ALL.get("contacts"), contactValues);

            Map<String, Object> statusUpdate = new LinkedHashMap<String, Object>();
            statusUpdate.put("status", "Converted");
            Map<String, Object> updatedLead =
                    update(c, (Table) Table.ALL.get("leads"), leadId, statusUpdate);

            c.commit();
            Map<String, Object> result = new LinkedHashMap<String, Object>();
            result.put("lead", updatedLead);
            result.put("account", account);
            result.put("contact", contact);
            return result;
        } catch (ValidationException e) {
            c.rollback();
            throw e;
        } catch (SQLException e) {
            c.rollback();
            throw e;
        } finally {
            c.setAutoCommit(true);
        }
    }

    // ---------------------------------------------------------- validation
    /**
     * Validates + coerces a raw JSON map against the table metadata.
     * Unknown keys are rejected; primary keys and created_at are not writable.
     */
    private static Map<Column, Object> validate(Connection c, Table table, Map<String, Object> raw,
                                                boolean creating)
            throws SQLException, ValidationException {
        Map<Column, Object> values = new LinkedHashMap<Column, Object>();

        for (String key : raw.keySet()) {
            if (key.equals(table.pk) || key.equals("created_at")) {
                throw new ValidationException("Field '" + key + "' is read-only");
            }
            if (table.column(key) == null) {
                throw new ValidationException("Unknown field '" + key + "' for " + table.name);
            }
        }

        for (Column column : table.columns) {
            boolean provided = raw.containsKey(column.name);
            Object rawValue = raw.get(column.name);

            if (!provided) {
                if (creating && column.required) {
                    throw new ValidationException("Field '" + column.name + "' is required");
                }
                continue;
            }

            Object value = coerce(column, rawValue);
            if (value == null && column.required) {
                throw new ValidationException("Field '" + column.name + "' is required");
            }
            if (value != null && column.refTable != null
                    && !exists(c, (Table) Table.ALL.get(column.refTable), ((Number) value).intValue())) {
                throw new ValidationException(
                        "Invalid " + column.name + ": no such " + column.refTable + " record");
            }
            values.put(column, value);
        }
        return values;
    }

    private static boolean exists(Connection c, Table refTable, int id) throws SQLException {
        return find(c, refTable, id) != null;
    }

    private static Object coerce(Column column, Object raw) throws ValidationException {
        if (raw == null) return null;

        switch (column.type) {
            case STRING: {
                String text = raw.toString();
                if (column.maxLength > 0 && text.length() > column.maxLength) {
                    throw new ValidationException(
                            "Field '" + column.name + "' is too long (max " + column.maxLength + " characters)");
                }
                // Blank input becomes NULL (required columns fail on the
                // required-check in validate(), optional columns store NULL).
                return text.trim().isEmpty() ? null : text;
            }
            case ENUM: {
                String text = raw.toString();
                if (!column.enumValues.contains(text)) {
                    throw new ValidationException("Field '" + column.name + "' must be one of "
                            + column.enumValues);
                }
                return text;
            }
            case INTEGER: {
                Number number = number(column, raw);
                return number == null ? null : Integer.valueOf(number.intValue());
            }
            case DECIMAL: {
                return number(column, raw);
            }
            case DATE: {
                try {
                    return LocalDate.parse(raw.toString().trim());
                } catch (Exception e) {
                    throw new ValidationException(
                            "Field '" + column.name + "' must be a date like 2026-12-31");
                }
            }
            case TIMESTAMP: {
                return parseTimestamp(column, raw.toString().trim());
            }
            default:
                throw new ValidationException("Unsupported column type for " + column.name);
        }
    }

    private static Number number(Column column, Object raw) throws ValidationException {
        if (raw instanceof Number) return (Number) raw;
        String text = raw.toString().trim();
        if (text.isEmpty()) return null;
        try {
            return Double.valueOf(text);
        } catch (NumberFormatException e) {
            throw new ValidationException("Field '" + column.name + "' must be a number");
        }
    }

    private static LocalDateTime parseTimestamp(Column column, String text) throws ValidationException {
        try {
            return LocalDateTime.parse(text);
        } catch (Exception ignored) { /* fall through */ }
        try {
            // ISO strings with a zone (e.g. the JS client sends "...Z")
            return LocalDateTime.ofInstant(Instant.parse(text), ZoneId.systemDefault());
        } catch (Exception ignored) { /* fall through */ }
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (Exception e) {
            throw new ValidationException(
                    "Field '" + column.name + "' must be an ISO date-time");
        }
    }

    // -------------------------------------------------------------- binder
    private static void bind(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object value = params.get(i);
            if (value == null) {
                ps.setNull(i + 1, java.sql.Types.VARCHAR);
            } else if (value instanceof Integer) {
                ps.setInt(i + 1, ((Integer) value).intValue());
            } else if (value instanceof Number) {
                ps.setBigDecimal(i + 1, new java.math.BigDecimal(value.toString()));
            } else if (value instanceof LocalDateTime) {
                ps.setTimestamp(i + 1, java.sql.Timestamp.valueOf((LocalDateTime) value));
            } else if (value instanceof LocalDate) {
                ps.setDate(i + 1, java.sql.Date.valueOf((LocalDate) value));
            } else {
                ps.setString(i + 1, value.toString());
            }
        }
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
