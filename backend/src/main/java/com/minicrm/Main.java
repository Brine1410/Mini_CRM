package com.minicrm;

import com.minicrm.db.Database;
import com.minicrm.web.ApiServlet;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

/**
 * Mini Enterprise CRM — Java Servlet backend.
 *
 * Boots an embedded Jetty server (no application server installation needed),
 * initialises the database from database/mini_crm.sql and serves the REST API
 * under /api/*. The React frontend (Vite dev server) proxies /api to this port.
 *
 * Configuration (environment variables):
 *   CRM_PORT        port to listen on              (default 8080)
 *   CRM_DB_URL      JDBC URL                       (default: embedded H2 file DB)
 *   CRM_DB_USER     database user                  (default: sa for H2)
 *   CRM_DB_PASSWORD database password              (default: empty)
 *   CRM_DATA_DIR    folder for the H2 database     (default backend/data)
 *   CRM_SQL_FILE    path to mini_crm.sql           (default database/mini_crm.sql)
 */
public final class Main {

    public static void main(String[] args) throws Exception {
        String portEnv = (String) System.getenv().getOrDefault("CRM_PORT", "8080");
        int port = Integer.parseInt(portEnv);

        System.out.println("[mini-crm] initialising database...");
        Database.init();
        System.out.println("[mini-crm] database ready: " + Database.description());

        Server server = new Server();
        ServerConnector connector = new ServerConnector(server);
        connector.setHost("0.0.0.0");
        connector.setPort(port);
        server.addConnector(connector);

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        context.addServlet(new ServletHolder(new ApiServlet()), "/api/*");
        server.setHandler(context);

        server.start();
        System.out.println("[mini-crm] API listening on http://0.0.0.0:" + port + "/api");
        System.out.println("[mini-crm] try:  curl http://localhost:" + port + "/api/health");
        server.join();
    }

    private Main() {}
}
