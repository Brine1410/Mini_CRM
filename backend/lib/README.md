# backend/lib — vendored runtime libraries

These jars are vendored into the repo so the backend is fully self-contained
(the sandbox has no Maven Central access). Everything here is the unmodified
official binary, as shipped with Apache DolphinScheduler 3.3.1 (which licenses
them under the same terms as their respective projects).

| Jar | Version | License | Used for |
| --- | --- | --- | --- |
| `javax.servlet-api-3.1.0.jar` | 3.1.0 | CDDL / GPL+CE | Servlet API (`javax.servlet.*`) |
| `jetty-server-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | Embedded Jetty HTTP server + servlet container |
| `jetty-servlet-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | `ServletContextHandler`, `ServletHolder` |
| `jetty-http-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | Jetty HTTP parsing |
| `jetty-io-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | Jetty IO |
| `jetty-util-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | Jetty utilities |
| `jetty-util-ajax-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | Jetty async output |
| `jetty-security-9.4.48.v20220622.jar` | 9.4.48 | Apache-2.0 / EPL-1.0 | Jetty security (dependency of jetty-servlet) |
| `h2-2.2.220.jar` | 2.2.220 | EPL-1.0 / MPL-2.0 | Embedded database used in dev/demo (`MODE=MySQL`) |
| `mysql-connector-j-8.0.33.jar` | 8.0.33 | GPL-2.0 with FOSS exception | MySQL JDBC driver (production database) |
| `gson-2.9.1.jar` | 2.9.1 | Apache-2.0 | JSON (de)serialisation |
| `janino-3.1.9.jar` | 3.1.9 | BSD-3-Clause | Self-contained Java compiler used to build the backend when no JDK is available (build-time only) |

Compiled bytecode runs on Java 8+; the server itself runs on Java 11+.
