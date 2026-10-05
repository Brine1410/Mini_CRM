package com.minicrm.db;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Connection factory + startup initialisation.
 *
 * Two supported setups, picked by environment variables (both use plain JDBC):
 *
 *   1. Development / demo (default) — an embedded H2 database in MySQL
 *      compatibility mode, stored under backend/data/. No server to install.
 *   2. Production — a real MySQL server running database/mini_crm.sql:
 *         CRM_DB_URL=jdbc:mysql://localhost:3306/mini_crm
 *         CRM_DB_USER=crm  CRM_DB_PASSWORD=secret
 *
 * The DDL always comes from database/mini_crm.sql (single source of truth).
 * For H2 the script is adapted on the fly (enum -> varchar + CHECK, engine
 * clause dropped); for MySQL it runs untouched.
 */
public final class Database {

    private static String url;
    private static String user;
    private static String password;

    private Database() {}

    /** True when the app talks to the embedded H2 database. */
    public static boolean isH2() {
        return url.startsWith("jdbc:h2:");
    }

    /** Reads configuration and makes sure schema + seed data exist. */
    public static void init() {
        url = getenv("CRM_DB_URL", defaultH2Url());
        user = getenv("CRM_DB_USER", isH2() ? "sa" : "root");
        password = getenv("CRM_DB_PASSWORD", "");

        try {
            // Embedded H2 ships on the classpath; the MySQL driver only needs
            // registering when a MySQL URL is configured.
            if (!isH2()) Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException("JDBC driver missing from the classpath", e);
        }

        Connection connection = null;
        try {
            connection = getConnection();
            new SchemaLoader().ensureSchema(connection);
            Seed.seedIfEmpty(connection);
        } catch (SQLException e) {
            throw new IllegalStateException("Could not initialise the database: " + e.getMessage(), e);
        } finally {
            closeQuietly(connection);
        }
    }

    private static void closeQuietly(Connection connection) {
        if (connection == null) return;
        try {
            connection.close();
        } catch (SQLException ignored) {
            // nothing sensible to do during shutdown init
        }
    }

    /** A fresh connection per request — JDBC connections are not thread-safe. */
    public static Connection getConnection() throws SQLException {
        Connection connection = DriverManager.getConnection(url, user, password);
        connection.setAutoCommit(true);
        return connection;
    }

    private static String defaultH2Url() {
        String dataDir = getenv("CRM_DATA_DIR", "backend/data");
        Path dir = Paths.get(dataDir).toAbsolutePath();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create data directory " + dir, e);
        }
        // MODE=MySQL makes H2 understand the mini_crm.sql dialect
        // (AUTO_INCREMENT, backticks, TIMESTAMP defaults, ...).
        return "jdbc:h2:file:" + dir.resolve("mini_crm")
                + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE";
    }

    public static String description() {
        return isH2() ? "embedded H2 (MySQL mode) at " + url.substring("jdbc:h2:file:".length(), url.indexOf(';'))
                      : "MySQL at " + url;
    }

    static String getenv(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    /** Helper used by the DAO to turn a ResultSet row into typed Java values. */
    public static boolean tableIsEmpty(Connection connection, String table) throws SQLException {
        Statement statement = connection.createStatement();
        try {
            ResultSet rs = statement.executeQuery("select count(*) from " + table);
            try {
                rs.next();
                return rs.getLong(1) == 0;
            } finally {
                rs.close();
            }
        } finally {
            statement.close();
        }
    }
}
