# Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Java 25.0.2, Node.js/npm, browser |
| Backend | Spring Boot 4.0.6, Spring Security, Spring Data JPA, Hibernate 7.2 |
| API | Spring MVC, Bean Validation, JWT, OpenAPI |
| Database | PostgreSQL/Supabase production, MySQL alternative, H2 tests |
| Frontend | Angular 21, TypeScript, RxJS |
| Build | Maven Wrapper 3.9.16, Angular CLI/build |
| Quality | Maven Surefire, integration tests, Angular build, component-size check |

Known operational dependencies include Supabase PostgreSQL, SMTP, map/QR assets and Mercado Pago. The payment integration is currently simulated and must not be treated as a live gateway.
