# Mini Enterprise CRM

A complete, working mini CRM: **React + Vite frontend**, **Java Servlet backend**
(embedded Jetty, no Spring), and a SQL database built from
[`database/mini_crm.sql`](database/mini_crm.sql) — 7 tables: `users`, `leads`,
`accounts`, `contacts`, `opportunities`, `tickets`, `activities`.

The backend is a plain Java servlet application (javax.servlet 3.1 on embedded
Jetty 9.4). It talks to the database with plain JDBC — an embedded
[H2](https://h2database.com) database in MySQL-compatibility mode for
development (zero installation), and real MySQL in production (the
`mysql-connector-j` driver is included).

```
┌────────────────┐   /api/* (JSON)    ┌────────────────────┐   JDBC   ┌──────────────┐
│ React frontend │ ─────────────────▶ │ Java servlet API    │ ──────▶ │ H2 (dev) /   │
│ (Vite, :5173)  │ ◀───────────────── │ (embedded Jetty,    │ ◀────── │ MySQL (prod) │
│                │   proxied by Vite  │  :8080)             │         │              │
└────────────────┘                    └────────────────────┘         └──────────────┘
```

## What's included

- **`database/mini_crm.sql`** — the provided schema, unchanged. It is the single
  source of truth for the DDL: the backend executes it at startup (adapting the
  MySQL-only bits on the fly when running on H2).
- **Java Servlet REST API** (`backend/src/main/java/com/minicrm/`)
  - `Main.java` — boots embedded Jetty, initialises the database (schema + seed
    data), serves the API on port 8080.
  - `web/ApiServlet.java` — one front-controller servlet mapping `@ /api/*` with
    `doGet/doPost/doPut/doDelete`.
  - `dao/CrudDao.java` — generic, metadata-driven CRUD with server-side
    validation (required fields, varchar limits, enum values, foreign-key
    existence, unique e-mail) that mirrors what MySQL would reject.
  - `model/Table.java` — Java mirror of the SQL schema (columns, types, enums,
    FK references).
  - `db/SchemaLoader.java` / `db/Seed.java` — runs `mini_crm.sql` and inserts
    sample rows (a 1:1 port of `src/data/mockData.js`).
- **Seed data** — inserted once into an empty database: 6 users, 12 leads,
  8 accounts, 14 contacts, 12 opportunities, 10 tickets, 18 activities. Dates
  are relative to "today", so the dashboard always looks alive.
- **Full React UI** covering every table: Dashboard (pipeline, tickets, leads,
  activities), Leads (with one-click *convert to account + contact*), Accounts +
  account detail tabs, Contacts, Opportunities (drag-and-drop pipeline board),
  Tickets, Activities, and Team. All of it now reads/writes through the REST
  API — `src/context/CrmContext.jsx` is the single data gateway, backed by
  `src/api/client.js`.

## API

Base URL: `/api` (the Vite dev server proxies it to the backend on port 8080).

| Method & path | Description |
| --- | --- |
| `GET /api/health` | service + database status |
| `GET /api/{table}` | all rows (ordered by id) |
| `GET /api/{table}/{id}` | one row (`404` JSON when missing) |
| `POST /api/{table}` | create (`201` + the created row) |
| `PUT /api/{table}/{id}` | partial update (`200` + the updated row) |
| `DELETE /api/{table}/{id}` | delete (`204`); the DB applies `ON DELETE CASCADE` / `SET NULL` |
| `POST /api/leads/{id}/convert` | convert a lead: creates its account + contact and marks it `Converted` (single transaction) |

`{table}` is one of `users`, `leads`, `accounts`, `contacts`, `opportunities`,
`tickets`, `activities`. Errors are JSON: `{"error": "..."}` with a matching
status (`400/404/405/409/422/500`).

Example:

```bash
curl http://localhost:8080/api/leads/3
curl -X POST http://localhost:8080/api/accounts \
  -H 'Content-Type: application/json' \
  -d '{"account_name":"Acme Corp","industry":"Manufacturing","owner_user_id":2}'
curl -X POST http://localhost:8080/api/leads/2/convert
```

## Requirements

- [Node.js](https://nodejs.org/) 18+ (frontend)
- A Java runtime, **JRE 11+** is enough (no JDK needed — the build uses the
  vendored [Janino](https://janino-compiler.github.io/janino/) compiler).
  Set `JAVA_HOME` if `java` is not on the `PATH`.

## Getting started

Two terminals:

```bash
# 1) the servlet backend (compiles on first run), http://localhost:8080
npm run backend

# 2) the frontend, http://localhost:5173 (proxies /api to the backend)
npm install
npm run dev
```

Open http://localhost:5173 — the CRM loads with the seeded sample data.
`npm run backend:build` only recompiles the Java sources.

### Running from VS Code

1. Install **Node 18+** and a **Java 11+ runtime** (`java -version` must work).
2. `File → Open Folder…` → this repo.
3. (Recommended) install the *Extension Pack for Java* — the repo ships
   `.vscode/settings.json` and `.vscode/launch.json`, so Java tooling finds
   `backend/lib` automatically and **F5 runs/debugs the backend**
   ("Mini CRM API").
4. Open the integrated terminal (`` Ctrl+` ``), run `npm run backend`
   (skip this if you used F5) and `npm install && npm run dev` in a second
   terminal, then open http://localhost:5173.

## Connecting a real MySQL server

`database/mini_crm.sql` runs on MySQL unchanged. Point the backend at the
server with environment variables (note: leave the database name out of the
URL — the script creates `mini_crm` and switches to it):

```bash
CRM_DB_URL="jdbc:mysql://localhost:3306/?serverTimezone=UTC" \
CRM_DB_USER="crm" \
CRM_DB_PASSWORD="secret" \
npm run backend
```

The MySQL driver jar is already in `backend/lib` — nothing else to install.

### Configuration reference (environment variables)

| Variable | Default | Meaning |
| --- | --- | --- |
| `CRM_PORT` | `8080` | port the API listens on |
| `CRM_DB_URL` | embedded H2 | JDBC URL; any `jdbc:mysql://...` URL enables MySQL |
| `CRM_DB_USER` / `CRM_DB_PASSWORD` | `sa` / *(empty)* | database credentials |
| `CRM_DATA_DIR` | `backend/data` | where the embedded H2 file lives |
| `CRM_SQL_FILE` | `database/mini_crm.sql` | override path to the DDL |
| `CRM_SEED` | *(seed on empty)* | set to `never` to stop the sample data from being inserted |
| `VITE_API_BASE` | `/api` | frontend override if the API is hosted elsewhere |
| `CRM_API_TARGET` | `http://localhost:8080` | Vite proxy target override |

### Resetting / emptying the database

The sample data ("dummy data") is inserted only when the `users` table is
empty **and** seeding is enabled. So to get a completely empty CRM:

```bash
# stop the backend first, then delete the database files:
rm -rf backend/data            # PowerShell: Remove-Item -Recurse -Force backend/data

# start the backend with seeding disabled — the schema is created, nothing else:
CRM_SEED=never npm run backend           # Windows PowerShell:
# $env:CRM_SEED = 'never'; npm run backend:win
```

All 7 tables now exist but stay empty across restarts (as long as `CRM_SEED`
remains `never`). Add your own users/leads/etc. through the UI or the API.
To go back to the demo data, stop the backend, delete `backend/data` again and
start normally (without `CRM_SEED`).

On real MySQL the equivalent is:

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE activities; TRUNCATE TABLE tickets; TRUNCATE TABLE opportunities;
TRUNCATE TABLE contacts;  TRUNCATE TABLE accounts; TRUNCATE TABLE leads;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

## Project structure

```
database/
  mini_crm.sql              the provided schema (unchanged, single source of truth)
backend/
  src/main/java/com/minicrm/
    Main.java                embedded Jetty bootstrap
    web/ApiServlet.java      REST front controller (HttpServlet)
    dao/CrudDao.java         generic JDBC CRUD + validation + lead conversion
    model/Table.java         Java mirror of the SQL tables/columns/enums
    db/Database.java         connections + env config + init
    db/SchemaLoader.java     applies mini_crm.sql (adapting it for H2)
    db/Seed.java             sample data (port of src/data/mockData.js)
    json/Json.java           Gson helpers (JDBC row -> JSON)
  tools/Build.java           build driver (compiles with Janino, no javac needed)
  scripts/build.sh, run.sh   build & launch scripts
  lib/                       vendored jars (see lib/README.md)
src/
  api/client.js              fetch wrapper for every endpoint
  context/CrmContext.jsx     the only data gateway for the UI (now API-backed)
  config/                    schema/form/tone configs (mirror the SQL)
  components/, pages/        shared UI + one page per area
  data/mockData.js           seed-data description (mirrored by db/Seed.java)
```

## Notes

- Deleting a record shows exactly what else MySQL will remove/unlink (the
  confirm dialog mimics the `ON DELETE` rules), and the database then enforces
  them for real.
- `backend/lib` vendors its jars (see `backend/lib/README.md` for provenance:
  they come from unmodified Apache DolphinScheduler 3.3.1 / Apache Spark 3.5.5
  distributions, Apache-2.0/EPL/BSD/GPL+FOSS-exception) so the project builds
  and runs without Maven Central access.
- Compiled classes run on Java 8+; the embedded server runs on Java 11+.
- `npm run build` produces the static frontend in `dist/`; it works against the
  same servlet API from any static host/CDN (set `VITE_API_BASE` if needed).
