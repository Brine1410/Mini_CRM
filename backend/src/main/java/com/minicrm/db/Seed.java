package com.minicrm.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Sample records for every table, mirroring src/data/mockData.js one-to-one.
 * Dates are generated relative to "today" so the dashboard always looks fresh.
 *
 * Inserted once, at boot, when the users table is empty — unless disabled
 * with the CRM_SEED=never environment variable (set that when you have
 * deliberately emptied the database and want it to stay empty).
 */
final class Seed {

    /** True unless CRM_SEED is set to never/false/off/none. */
    private static boolean seedingEnabled() {
        String mode = System.getenv("CRM_SEED");
        if (mode == null) return true;
        mode = mode.trim().toLowerCase();
        return !(mode.equals("never") || mode.equals("false")
                || mode.equals("off") || mode.equals("none"));
    }

    // ------------------------------------------------------------- helpers
    /** Timestamp N days from now at the given hour (like daysFromNow in JS). */
    private static LocalDateTime d(int days, int hour) {
        return LocalDateTime.now().plusDays(days).withHour(hour).withMinute(0).withSecond(0).withNano(0);
    }

    /** Date N days from now (like dateFromNow in JS). */
    private static LocalDate day(int days) {
        return LocalDate.now().plusDays(days);
    }

    private static void insert(Connection c, String sql, Object... values) throws SQLException {
        PreparedStatement ps = c.prepareStatement(sql);
        try {
            for (int i = 0; i < values.length; i++) {
                Object v = values[i];
                if (v == null)                         ps.setNull(i + 1, java.sql.Types.VARCHAR);
                else if (v instanceof Integer)         ps.setInt(i + 1, (Integer) v);
                else if (v instanceof Long)            ps.setLong(i + 1, (Long) v);
                else if (v instanceof Double)          ps.setDouble(i + 1, (Double) v);
                else if (v instanceof LocalDateTime)   ps.setTimestamp(i + 1, java.sql.Timestamp.valueOf((LocalDateTime) v));
                else if (v instanceof LocalDate)       ps.setDate(i + 1, java.sql.Date.valueOf((LocalDate) v));
                else                                   ps.setString(i + 1, String.valueOf(v));
            }
            ps.executeUpdate();
        } finally {
            ps.close();
        }
    }

    static void seedIfEmpty(Connection connection) throws SQLException {
        if (!seedingEnabled()) return;
        if (!Database.tableIsEmpty(connection, "users")) return;
        connection.setAutoCommit(false);
        try {
            users(connection);
            leads(connection);
            accounts(connection);
            contacts(connection);
            opportunities(connection);
            tickets(connection);
            activities(connection);
            connection.commit();
        } catch (SQLException e) {
            connection.rollback();
            throw e;
        } finally {
            connection.setAutoCommit(true);
        }
    }

    // ------------------------------------------------------------- users
    private static void users(Connection c) throws SQLException {
        String sql = "insert into users (user_id, full_name, email, role, created_at) values (?,?,?,?,?)";
        insert(c, sql, 1, "Maya Chen",      "maya.chen@minicrm.io",      "Admin",           d(-180, 9));
        insert(c, sql, 2, "Daniel Okafor",  "daniel.okafor@minicrm.io",  "Sales Rep",       d(-150, 9));
        insert(c, sql, 3, "Sofia Rossi",    "sofia.rossi@minicrm.io",    "Account Manager", d(-140, 10));
        insert(c, sql, 4, "Liam Patel",     "liam.patel@minicrm.io",     "Sales Rep",       d(-120, 11));
        insert(c, sql, 5, "Hannah Müller",  "hannah.mueller@minicrm.io", "Support Agent",   d(-100, 9));
        insert(c, sql, 6, "Carlos Mendes",  "carlos.mendes@minicrm.io",  "Support Agent",   d(-90, 14));
    }

    // ------------------------------------------------------------- leads
    private static void leads(Connection c) throws SQLException {
        String sql = "insert into leads (lead_id, first_name, last_name, company_name, email, phone,"
                + " status, assigned_user_id, created_at) values (?,?,?,?,?,?,?,?,?)";
        insert(c, sql, 1,  "Elena",  "Petrova",   "Northwind Logistics",      "elena.petrova@northwindlog.com", "+1 415 555 0142",    "Converted",   3,    d(-95, 10));
        insert(c, sql, 2,  "Marcus", "Bell",      "BrightPath Learning",      "marcus.bell@brightpath.com",     "+1 212 555 0177",    "New",         4,    d(-2, 9));
        insert(c, sql, 3,  "Aisha",  "Rahman",    "Kestrel Health",           "aisha.rahman@kestrelhealth.com", "+1 312 555 0119",    "Contacted",   2,    d(-9, 15));
        insert(c, sql, 4,  "Tom",    "Jensen",    "Fjord Foods",              "tom.jensen@fjordfoods.com",      "+47 22 55 01 88",    "New",         4,    d(-1, 13));
        insert(c, sql, 5,  "Priya",  "Nair",      "Lumen Retail",             "priya.nair@lumenretail.com",     "+1 646 555 0163",    "Converted",   3,    d(-70, 10));
        insert(c, sql, 6,  "Stefan", "Keller",    "Alpine Robotics",          "stefan.keller@alpinerobotics.com","+41 44 555 01 28",  "Qualified",   2,    d(-21, 11));
        insert(c, sql, 7,  "Grace",  "Liu",       "Harborview Systems",       "grace.liu@harborview.io",        "+1 206 555 0134",    "Contacted",   4,    d(-6, 16));
        insert(c, sql, 8,  "Omar",   "Haddad",    "Sahara Solar",             "omar.haddad@saharasolar.com",    null,                 "Unqualified", 2,    d(-33, 12));
        insert(c, sql, 9,  "Diego",  "Alvarez",   null,                       "diego.alvarez@example.com",      "+34 91 555 01 17",   "New",         null, d(0, 8));
        insert(c, sql, 10, "Nora",   "Whitfield", "Ironbridge Insurance",     "nora.whitfield@ironbridge.com",  "+44 20 5550 0166",   "Contacted",   4,    d(-12, 9));
        insert(c, sql, 11, "Hiro",   "Sato",      "Sakura Analytics",         "hiro.sato@sakura-analytics.jp",  "+81 3 5550 0158",    "Qualified",   3,    d(-16, 10));
        insert(c, sql, 12, "Rafael", "Costa",     "Costa & Filhos Imports",   "rafael@costaimports.com",        "+351 21 555 0102",   "Unqualified", 2,    d(-44, 14));
    }

    // ---------------------------------------------------------- accounts
    private static void accounts(Connection c) throws SQLException {
        String sql = "insert into accounts (account_id, account_name, industry, website, annual_revenue,"
                + " owner_user_id, created_at) values (?,?,?,?,?,?,?)";
        insert(c, sql, 1, "Northwind Logistics",   "Logistics",          "https://northwindlog.com",       48000000.0,   3, d(-90, 10));
        insert(c, sql, 2, "Lumen Retail",          "Retail",             "https://lumenretail.com",        120000000.0,  3, d(-68, 11));
        insert(c, sql, 3, "Kestrel Health",        "Healthcare",         "https://kestrelhealth.com",      76500000.0,   2, d(-55, 9));
        insert(c, sql, 4, "Alpine Robotics",       "Manufacturing",      "https://alpinerobotics.com",     32000000.0,   2, d(-40, 13));
        insert(c, sql, 5, "Fjord Foods",           "Food & Beverage",    "https://fjordfoods.com",         58250000.0,   4, d(-38, 10));
        insert(c, sql, 6, "Sakura Analytics",      "Technology",         "https://sakura-analytics.jp",    18900000.0,   3, d(-25, 15));
        insert(c, sql, 7, "Ironbridge Insurance",  "Financial Services", "https://ironbridge.com",         210000000.0,  4, d(-20, 9));
        insert(c, sql, 8, "Verde Studio",          "Media",              null,                             4200000.0,    1, d(-4, 11));
    }

    // ----------------------------------------------------------- contacts
    private static void contacts(Connection c) throws SQLException {
        String sql = "insert into contacts (contact_id, account_id, first_name, last_name, email, phone,"
                + " job_title, owner_user_id, created_at) values (?,?,?,?,?,?,?,?,?)";
        insert(c, sql, 1,  1,    "Elena",    "Petrova",  "elena.petrova@northwindlog.com",  "+1 415 555 0142",    "VP Operations",               3, d(-88, 10));
        insert(c, sql, 2,  1,    "Jonas",    "Weber",    "jonas.weber@northwindlog.com",    "+1 415 555 0150",    "Procurement Manager",         3, d(-85, 14));
        insert(c, sql, 3,  2,    "Priya",    "Nair",     "priya.nair@lumenretail.com",      "+1 646 555 0163",    "Head of Digital",             3, d(-66, 10));
        insert(c, sql, 4,  2,    "Leo",      "Fernandez","leo.fernandez@lumenretail.com",   "+1 646 555 0171",    "CFO",                         3, d(-64, 12));
        insert(c, sql, 5,  3,    "Amara",    "Okoye",    "amara.okoye@kestrelhealth.com",   "+1 312 555 0128",    "Chief Medical Officer",       2, d(-54, 9));
        insert(c, sql, 6,  3,    "Peter",    "Lang",     "peter.lang@kestrelhealth.com",    "+1 312 555 0133",    "IT Director",                 2, d(-52, 11));
        insert(c, sql, 7,  4,    "Noah",     "Fischer",  "noah.fischer@alpinerobotics.com", "+41 44 555 01 20",   "CTO",                         2, d(-39, 10));
        insert(c, sql, 8,  5,    "Ingrid",   "Solberg",  "ingrid.solberg@fjordfoods.com",   "+47 22 55 01 91",    "Operations Director",         4, d(-37, 9));
        insert(c, sql, 9,  5,    "Henrik",   "Dahl",     "henrik.dahl@fjordfoods.com",      null,                 "Buyer",                       4, d(-36, 15));
        insert(c, sql, 10, 6,    "Yuki",     "Tanaka",   "yuki.tanaka@sakura-analytics.jp", "+81 3 5550 0146",    "Data Lead",                   3, d(-24, 10));
        insert(c, sql, 11, 7,    "Victoria", "Hale",     "victoria.hale@ironbridge.com",    "+44 20 5550 0192",   "Chief Risk Officer",          4, d(-19, 9));
        insert(c, sql, 12, 7,    "Ben",      "Carter",   "ben.carter@ironbridge.com",       "+44 20 5550 0181",   "Head of Claims Technology",   4, d(-18, 13));
        insert(c, sql, 13, 8,    "Chloe",    "Martin",   "chloe.martin@verdestudio.com",    "+33 1 55 01 22 90",  "Creative Director",           1, d(-3, 10));
        insert(c, sql, 14, null, "Ravi",     "Shankar",  "ravi@shankarconsulting.com",      "+91 22 5550 0144",   "Independent consultant",      2, d(-8, 16));
    }

    // ------------------------------------------------------ opportunities
    private static void opportunities(Connection c) throws SQLException {
        String sql = "insert into opportunities (opportunity_id, account_id, primary_contact_id, title, amount,"
                + " stage, close_date, owner_user_id, created_at) values (?,?,?,?,?,?,?,?,?)";
        insert(c, sql, 1,  1, 1,  "Fleet tracking platform rollout",    185000.0, "Negotiation",   day(21),  3, d(-60, 10));
        insert(c, sql, 2,  1, 2,  "Warehouse analytics add-on",         42000.0,  "Proposal",      day(35),  3, d(-30, 11));
        insert(c, sql, 3,  2, 3,  "Omnichannel storefront integration", 240000.0, "Proposal",      day(28),  3, d(-34, 9));
        insert(c, sql, 4,  2, 4,  "Annual premium support plan",        36000.0,  "Closed Won",    day(-12), 3, d(-50, 14));
        insert(c, sql, 5,  3, 5,  "Patient portal modernization",       310000.0, "Qualification", day(60),  2, d(-22, 10));
        insert(c, sql, 6,  3, 6,  "Security audit and compliance",      68000.0,  "Prospecting",   day(75),  2, d(-10, 15));
        insert(c, sql, 7,  4, 7,  "Robotics fleet dashboard",           128000.0, "Negotiation",   day(14),  2, d(-27, 9));
        insert(c, sql, 8,  5, 8,  "Supply chain visibility suite",      96000.0,  "Closed Won",    day(-30), 4, d(-58, 12));
        insert(c, sql, 9,  5, 9,  "Cold-storage monitoring pilot",      27500.0,  "Closed Lost",   day(-8),  4, d(-41, 10));
        insert(c, sql, 10, 6, 10, "Analytics workspace licenses",       54000.0,  "Qualification", day(40),  3, d(-15, 11));
        insert(c, sql, 11, 7, 11, "Claims automation program",          420000.0, "Proposal",      day(50),  4, d(-17, 9));
        insert(c, sql, 12, 7, 12, "Fraud signals integration",          150000.0, "Prospecting",   day(90),  4, d(-5, 14));
    }

    // ------------------------------------------------------------ tickets
    private static void tickets(Connection c) throws SQLException {
        String sql = "insert into tickets (ticket_id, account_id, contact_id, assigned_user_id, subject,"
                + " priority, status, created_at) values (?,?,?,?,?,?,?,?)";
        insert(c, sql, 1,  2,    3,  5,    "Checkout page returns error 500 when a coupon is applied", "High",   "Open",                d(-1, 9));
        insert(c, sql, 2,  2,    4,  6,    "Invoice PDF is missing the tax breakdown",                 "Medium", "In Progress",         d(-3, 11));
        insert(c, sql, 3,  1,    2,  5,    "Add 25 new user seats to the workspace",                   "Low",    "Waiting on Customer", d(-6, 10));
        insert(c, sql, 4,  1,    1,  6,    "GPS sync delay on older tracker models",                   "Urgent", "In Progress",         d(-2, 14));
        insert(c, sql, 5,  3,    6,  5,    "SSO login loop for newly onboarded staff",                 "High",   "Open",                d(-4, 9));
        insert(c, sql, 6,  4,    7,  6,    "Dashboard CSV export truncates long reports",              "Medium", "Resolved",            d(-9, 13));
        insert(c, sql, 7,  5,    8,  5,    "Change the billing contact on the account",                "Low",    "Closed",              d(-20, 10));
        insert(c, sql, 8,  6,    10, null, "Workspace invitation emails are not arriving",             "Medium", "Open",                d(-1, 16));
        insert(c, sql, 9,  7,    11, 6,    "Question about audit log retention period",                "Low",    "Waiting on Customer", d(-5, 12));
        insert(c, sql, 10, null, 14, 5,    "Request to extend the trial period by two weeks",          "Medium", "Open",                d(-2, 9));
    }

    // ---------------------------------------------------------- activities
    private static void activities(Connection c) throws SQLException {
        String sql = "insert into activities (activity_id, type, subject, description, due_date, status,"
                + " performed_by_user_id, lead_id, contact_id, opportunity_id, ticket_id, created_at)"
                + " values (?,?,?,?,?,?,?,?,?,?,?,?)";
        insert(c, sql, 1,  "Call",    "Intro call with Elena Petrova",
                "Covered current fleet setup and reporting pain points.",                    d(-10, 11), "Completed", 2, 1,    null, null, null, d(-12, 9));
        insert(c, sql, 2,  "Email",   "Send product deck to Marcus Bell",
                "Include the education case studies.",                                       d(1, 10),   "Pending",   4, 2,    null, null, null, d(-1, 15));
        insert(c, sql, 3,  "Meeting", "Discovery workshop with Kestrel Health",
                "On-site session with clinical and IT leads.",                               d(-5, 14),  "Completed", 2, null, 5,    5,    null, d(-9, 10));
        insert(c, sql, 4,  "Task",    "Prepare proposal for the Lumen storefront project",
                null,                                                                         d(2, 17),   "Pending",   3, null, null, 3,    null, d(-3, 11));
        insert(c, sql, 5,  "Call",    "Pricing negotiation for fleet tracking",
                "Elena wants a three-year discount option.",                                  d(1, 15),   "Pending",   3, null, 1,    1,    null, d(-2, 9));
        insert(c, sql, 6,  "Note",    "Budget approved for Q4",
                "Elena confirmed the budget was approved by finance.",                       null,        "Completed", 3, null, 1,    1,    null, d(-3, 16));
        insert(c, sql, 7,  "Task",    "Follow up on the security questionnaire",
                "Kestrel is waiting on our completed compliance answers.",                   d(-2, 12),  "Pending",   2, null, null, 6,    null, d(-7, 10));
        insert(c, sql, 8,  "Meeting", "Quarterly business review with Lumen Retail",
                null,                                                                         d(6, 11),   "Pending",   3, null, 4,    null, null, d(-4, 13));
        insert(c, sql, 9,  "Email",   "Confirm SSO fix rollout with Peter Lang",
                null,                                                                         d(1, 9),    "Pending",   5, null, 6,    null, 5,    d(-1, 10));
        insert(c, sql, 10, "Call",    "Callback about the coupon error",
                "Customer confirmed it only happens with percentage coupons.",               d(-1, 15),  "Completed", 5, null, 3,    null, 1,    d(-1, 12));
        insert(c, sql, 11, "Note",    "Likely cause: coupon service timeout",
                "Timeouts start when more than 3 coupons are stacked.",                      null,        "Completed", 5, null, null, null, 1,    d(-1, 17));
        insert(c, sql, 12, "Task",    "Escalate GPS sync issue to engineering",
                "Attach the device logs from the customer.",                                 d(-1, 10),  "Pending",   6, null, null, null, 4,    d(-2, 15));
        insert(c, sql, 13, "Meeting", "Demo of the robotics fleet dashboard",
                "Noah has asked for the live telemetry view.",                                d(3, 14),   "Pending",   2, null, 7,    7,    null, d(-5, 9));
        insert(c, sql, 14, "Email",   "Send revised quote to Ironbridge",
                null,                                                                         d(4, 12),   "Pending",   4, null, null, 11,   null, d(-2, 14));
        insert(c, sql, 15, "Call",    "Qualify interest from Sakura Analytics",
                "Team of 40 analysts, wants a pilot next quarter.",                          d(-7, 10),  "Completed", 3, 11,   null, null, null, d(-9, 11));
        insert(c, sql, 16, "Task",    "Update CRM notes after the Fjord pilot review",
                "No longer needed, the pilot was closed.",                                   d(-6, 16),  "Cancelled", 4, null, null, 9,    null, d(-10, 10));
        insert(c, sql, 17, "Meeting", "Kick-off call with Verde Studio",
                null,                                                                         d(5, 10),   "Pending",   1, null, 13,   null, null, d(-3, 12));
        insert(c, sql, 18, "Email",   "Welcome message to Priya Nair",
                "Sent after the lead was converted.",                                       d(-15, 9),  "Completed", 3, 5,    3,    null, null, d(-16, 10));
    }
}
