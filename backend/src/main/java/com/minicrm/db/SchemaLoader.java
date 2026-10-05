package com.minicrm.db;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Loads database/mini_crm.sql and applies it to the current database.
 *
 * The SQL file is written for MySQL and stays untouched. When the runtime
 * database is H2 (MySQL compatibility mode) the statements are adapted on
 * the fly:
 *   - "create database"/"use" lines are dropped (we connect to an embedded DB),
 *   - the trailing "engine=innodb" is removed,
 *   - enum('A', 'B') columns become  varchar(N) check (<col> in ('A', 'B')).
 * Tables are created with IF NOT EXISTS so restarts are safe.
 */
public final class SchemaLoader {

    private static final Pattern ENUM_PATTERN =
            Pattern.compile("(?i)(\\w+)\\s+enum\\s*\\(([^)]*)\\)(\\s+default\\s+('[^']*'))?");

    public void ensureSchema(Connection connection) throws SQLException {
        String sql = readSqlFile();
        List<String> statements = adapt(splitStatements(sql), Database.isH2());
        Statement statement = connection.createStatement();
        try {
            for (String ddl : statements) {
                statement.execute(ddl);
            }
        } finally {
            statement.close();
        }
    }

    private static String readSqlFile() {
        String override = System.getenv("CRM_SQL_FILE");
        List<Path> candidates = new ArrayList<Path>();
        if (override != null && !override.trim().isEmpty()) candidates.add(Paths.get(override));
        candidates.add(Paths.get("database/mini_crm.sql"));
        candidates.add(Paths.get("../database/mini_crm.sql"));
        for (Path path : candidates) {
            if (Files.isRegularFile(path)) {
                try {
                    return new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
                } catch (IOException e) {
                    throw new IllegalStateException("Cannot read " + path, e);
                }
            }
        }
        throw new IllegalStateException(
                "database/mini_crm.sql not found (set CRM_SQL_FILE to its absolute path)");
    }

    /** Splits on ';' at the end of a line — the schema has no semicolons inside values. */
    private static List<String> splitStatements(String sql) {
        List<String> statements = new ArrayList<String>();
        StringBuilder current = new StringBuilder();
        for (String line : sql.split("\n")) {
            String trimmed = line.trim();
            boolean endsStatement = trimmed.endsWith(";");
            if (endsStatement) trimmed = trimmed.substring(0, trimmed.length() - 1);
            current.append(trimmed).append('\n');
            if (endsStatement) {
                String statement = current.toString().trim();
                if (!statement.isEmpty()) statements.add(statement);
                current.setLength(0);
            }
        }
        String rest = current.toString().trim();
        if (!rest.isEmpty()) statements.add(rest);
        return statements;
    }

    private static List<String> adapt(List<String> statements, boolean forH2) {
        List<String> adapted = new ArrayList<String>();
        for (String statement : statements) {
            String lower = statement.toLowerCase();
            if (forH2 && (lower.startsWith("create database") || lower.startsWith("use "))) {
                continue; // the embedded database already exists
            }
            if (forH2) {
                statement = statement.replaceAll("(?i)\\)\\s*engine\\s*=\\s*innodb", ")");
                statement = rewriteEnums(statement);
            }
            if (lower.startsWith("create table") && !lower.startsWith("create table if not exists")) {
                statement = statement.replaceFirst("(?i)create\\s+table", "create table if not exists");
            }
            if (lower.startsWith("create index") || lower.startsWith("create unique index")) {
                if (!lower.contains(" if not exists ")) {
                    statement = statement.replaceFirst("(?i)create\\s+(unique\\s+)?index",
                            "create $1index if not exists");
                }
            }
            adapted.add(statement);
        }
        return adapted;
    }

    /**
     * enum('A', 'B') default 'A' -> varchar(150) default 'A' check (<col> in ('A', 'B'))
     * (H2 accepts CHECK constraints, and DEFAULT must come before CHECK.)
     */
    private static String rewriteEnums(String statement) {
        Matcher matcher = ENUM_PATTERN.matcher(statement);
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String column = matcher.group(1);
            String values = matcher.group(2);
            String defaultClause = matcher.group(3) == null ? "" : matcher.group(3);
            matcher.appendReplacement(result, Matcher.quoteReplacement(
                    column + " varchar(150)" + defaultClause
                            + " check (" + column + " in (" + values + "))"));
        }
        matcher.appendTail(result);
        return result.toString();
    }
}
