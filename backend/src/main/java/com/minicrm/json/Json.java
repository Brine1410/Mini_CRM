package com.minicrm.json;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/** Small Gson wrapper used by every servlet. */
public final class Json {

    private static final Gson GSON = new GsonBuilder().serializeNulls().create();
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private Json() {}

    public static String stringify(Object value) {
        return GSON.toJson(value);
    }

    /** Parses a JSON object body; returns null for empty bodies, throws on non-objects. */
    public static Map<String, Object> parseObject(String body) {
        if (body == null || body.trim().isEmpty()) return new LinkedHashMap<String, Object>();
        Object parsed = GSON.fromJson(body, Object.class);
        if (!(parsed instanceof Map)) {
            throw new IllegalArgumentException("Request body must be a JSON object");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> map = (Map<String, Object>) parsed;
        return map;
    }

    /**
     * Converts one ResultSet row into a JSON-friendly map:
     * ints stay integers, decimals become doubles, dates "yyyy-MM-dd",
     * timestamps "yyyy-MM-dd'T'HH:mm:ss" (local time, like the JS mock data).
     */
    public static Map<String, Object> row(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        Map<String, Object> row = new LinkedHashMap<String, Object>();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            String name = meta.getColumnLabel(i);
            // H2 already returns lowercase labels (DATABASE_TO_LOWER=TRUE); this
            // is a safety net for drivers that report uppercase labels.
            row.put(lowerCaseIfNeeded(name), value(rs.getObject(i)));
        }
        return row;
    }

    private static String lowerCaseIfNeeded(String name) {
        for (int i = 0; i < name.length(); i++) {
            if (Character.isUpperCase(name.charAt(i))) return name.toLowerCase();
        }
        return name;
    }

    private static Object value(Object jdbcValue) {
        if (jdbcValue == null) return null;
        if (jdbcValue instanceof java.math.BigDecimal) {
            return ((java.math.BigDecimal) jdbcValue).doubleValue();
        }
        if (jdbcValue instanceof java.sql.Date) {
            return jdbcValue.toString(); // yyyy-MM-dd
        }
        if (jdbcValue instanceof Timestamp) {
            LocalDateTime dt = ((Timestamp) jdbcValue).toLocalDateTime();
            return TS_FORMAT.format(dt);
        }
        return jdbcValue;
    }
}
