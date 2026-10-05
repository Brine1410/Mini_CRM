package com.minicrm.model;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Java mirror of database/mini_crm.sql.
 *
 * Every table in the schema is described here once: its primary key, the
 * writable columns (with the same types, varchar limits and enum values as
 * the SQL) and the foreign keys. The servlets use this metadata to validate
 * incoming JSON exactly the way MySQL would reject bad rows.
 */
public final class Table {

    public enum ColumnType {
        STRING, INTEGER, DECIMAL, DATE, TIMESTAMP, ENUM
    }

    /** One writable column (primary keys and created_at are handled separately). */
    public static final class Column {
        public final String name;
        public final ColumnType type;
        public final boolean required;
        public final int maxLength;           // 0 = unlimited (TEXT)
        public final List<String> enumValues; // only for ENUM
        public final String enumDefault;      // SQL DEFAULT for enums
        public final String refTable;         // foreign key target table, or null

        private Column(String name, ColumnType type, boolean required, int maxLength,
                       List<String> enumValues, String enumDefault, String refTable) {
            this.name = name;
            this.type = type;
            this.required = required;
            this.maxLength = maxLength;
            this.enumValues = enumValues;
            this.enumDefault = enumDefault;
            this.refTable = refTable;
        }

        static Column string(String name, boolean required, int maxLength) {
            return new Column(name, ColumnType.STRING, required, maxLength, null, null, null);
        }

        static Column text(String name) {
            return new Column(name, ColumnType.STRING, false, 0, null, null, null);
        }

        static Column integer(String name, boolean required, String refTable) {
            return new Column(name, ColumnType.INTEGER, required, 0, null, null, refTable);
        }

        static Column decimal(String name, boolean required) {
            return new Column(name, ColumnType.DECIMAL, required, 0, null, null, null);
        }

        static Column date(String name) {
            return new Column(name, ColumnType.DATE, false, 0, null, null, null);
        }

        static Column timestamp(String name) {
            return new Column(name, ColumnType.TIMESTAMP, false, 0, null, null, null);
        }

        static Column enumerated(String name, boolean required, String defaultValue, String... values) {
            return new Column(name, ColumnType.ENUM, required, 150,
                    Arrays.asList(values), defaultValue, null);
        }
    }

    public final String name;
    public final String pk;
    public final List<Column> columns;
    /** FK columns only: {column -> referenced table}, mirrors the SQL. */
    public final Map<String, String> foreignKeys = new LinkedHashMap<String, String>();

    private Table(String name, String pk, List<Column> columns) {
        this.name = name;
        this.pk = pk;
        this.columns = columns;
        for (Column column : columns) {
            if (column.refTable != null) foreignKeys.put(column.name, column.refTable);
        }
    }

    public Column column(String columnName) {
        for (Column column : columns) {
            if (column.name.equals(columnName)) return column;
        }
        return null;
    }

    // -------------------------------------------------------------------
    // Registry — same declaration order as database/mini_crm.sql
    // -------------------------------------------------------------------
    public static final Map<String, Table> ALL = new LinkedHashMap<String, Table>();

    private static Table register(Table table) {
        ALL.put(table.name, table);
        return table;
    }

    static {
        register(new Table("users", "user_id", Arrays.asList(
                Column.string("full_name", true, 100),
                Column.string("email", true, 150),
                Column.enumerated("role", false, "Sales Rep",
                        "Sales Rep", "Account Manager", "Support Agent", "Admin")
        )));

        register(new Table("leads", "lead_id", Arrays.asList(
                Column.string("first_name", true, 50),
                Column.string("last_name", true, 50),
                Column.string("company_name", false, 100),
                Column.string("email", true, 150),
                Column.string("phone", false, 20),
                Column.enumerated("status", false, "New",
                        "New", "Contacted", "Qualified", "Unqualified", "Converted"),
                Column.integer("assigned_user_id", false, "users")
        )));

        register(new Table("accounts", "account_id", Arrays.asList(
                Column.string("account_name", true, 100),
                Column.string("industry", false, 50),
                Column.string("website", false, 150),
                Column.decimal("annual_revenue", false),
                Column.integer("owner_user_id", false, "users")
        )));

        register(new Table("contacts", "contact_id", Arrays.asList(
                Column.integer("account_id", false, "accounts"),
                Column.string("first_name", true, 50),
                Column.string("last_name", true, 50),
                Column.string("email", true, 150),
                Column.string("phone", false, 20),
                Column.string("job_title", false, 100),
                Column.integer("owner_user_id", false, "users")
        )));

        register(new Table("opportunities", "opportunity_id", Arrays.asList(
                Column.integer("account_id", true, "accounts"),
                Column.integer("primary_contact_id", false, "contacts"),
                Column.string("title", true, 150),
                Column.decimal("amount", false),
                Column.enumerated("stage", false, "Prospecting",
                        "Prospecting", "Qualification", "Proposal", "Negotiation",
                        "Closed Won", "Closed Lost"),
                Column.date("close_date"),
                Column.integer("owner_user_id", false, "users")
        )));

        register(new Table("tickets", "ticket_id", Arrays.asList(
                Column.integer("account_id", false, "accounts"),
                Column.integer("contact_id", true, "contacts"),
                Column.integer("assigned_user_id", false, "users"),
                Column.string("subject", true, 200),
                Column.enumerated("priority", false, "Medium", "Low", "Medium", "High", "Urgent"),
                Column.enumerated("status", false, "Open",
                        "Open", "In Progress", "Waiting on Customer", "Resolved", "Closed")
        )));

        register(new Table("activities", "activity_id", Arrays.asList(
                Column.enumerated("type", true, null, "Call", "Meeting", "Email", "Task", "Note"),
                Column.string("subject", true, 150),
                Column.text("description"),
                Column.timestamp("due_date"),
                Column.enumerated("status", false, "Pending", "Pending", "Completed", "Cancelled"),
                Column.integer("performed_by_user_id", true, "users"),
                Column.integer("lead_id", false, "leads"),
                Column.integer("contact_id", false, "contacts"),
                Column.integer("opportunity_id", false, "opportunities"),
                Column.integer("ticket_id", false, "tickets")
        )));
    }

    private Table() {
        throw new AssertionError("no instances");
    }

    /** Every column a SELECT * may return (pk + writable + created_at). */
    public List<String> allColumnNames() {
        List<String> names = new ArrayList<String>();
        names.add(pk);
        for (Column column : columns) names.add(column.name);
        names.add("created_at");
        return names;
    }
}
