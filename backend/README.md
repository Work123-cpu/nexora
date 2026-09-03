# Nexora Backend — Spring Boot + MySQL

Real REST API backend for Nexora, replacing the frontend's in-memory mock data layer.
Runs entirely locally, at zero cost.

## Prerequisites (already installed on this machine)

- **JDK 17** — Eclipse Temurin, installed via `winget install EclipseAdoptium.Temurin.17.JDK`
- **Apache Maven 3.9.9** — extracted locally to `../.tools/apache-maven-3.9.9` (not a
  system install, so it doesn't require admin rights or touch system PATH)
- **MySQL Community Server 8.4** — installed via `winget install Oracle.MySQL`

## One-time database setup (already done)

```sql
CREATE DATABASE nexora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexora_app'@'localhost' IDENTIFIED BY 'nexora_dev_pw';
GRANT ALL PRIVILEGES ON nexora.* TO 'nexora_app'@'localhost';
```

Tables are created automatically by Hibernate (`spring.jpa.hibernate.ddl-auto: update`)
the first time the app starts — no manual schema/migration step needed.

## Starting MySQL

The Windows service (`MySQL80`) could not be registered in this environment (needs
admin rights this session doesn't have), so MySQL runs as a plain background process
instead — functionally identical for local development:

```bash
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.4\my.ini" --console
```

Leave that running in its own terminal. To stop it, close that terminal or `Ctrl+C`.

(If you have admin rights, you can instead run `sc start MySQL80` once, or open
Services and start "MySQL80" — after first fixing its registration with
`mysqld --install MySQL80 --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"`
from an elevated prompt.)

## Starting the backend

```bash
cd backend
JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot" \
  ../.tools/apache-maven-3.9.9/bin/mvn.cmd spring-boot:run
```

Runs on **http://localhost:8081**. CORS is pre-configured for the frontend at
`http://localhost:5173`.

## Trying it

```bash
# Register a new company + admin user
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Acme Co","name":"Jane Doe","email":"jane@acme.com","password":"secret123"}'

# Use the returned token for any authenticated request
curl http://localhost:8081/api/products -H "Authorization: Bearer <token>"
```

## Connecting the frontend

As long as this backend and MySQL are running, `npm run dev` in `frontend/` talks to
them automatically for every module — auth, Products, Raw Materials, Vendors,
Warehouses, BOM, Inventory, Purchase Orders, Billing, Notifications, Business Calendar,
Team Members, and Market Intelligence. Register a real account via the app's "Create
one" link on the login page, or via `curl` as shown above.

**Known limitation**: a couple of forms (`BomForm`, `PurchaseOrderCreatePage`) still
populate their dropdown *options* (which product/vendor/material to pick from) by
reading the mock seed arrays directly rather than through the now-real services —
a pre-existing pattern from the original build. In real-backend mode you'll see
bakery demo names in those dropdowns, but whatever you submit is correctly saved
under your own company.

## What's implemented

- **Entities**: Company, User, TeamMember, Product, RawMaterial, BillOfMaterials,
  Warehouse, Vendor, InventoryItem, PurchaseOrder, Bill/BillLineItem, CalendarEvent,
  Notification, RawMaterialIntelligence/MaterialPriceSnapshot — every row scoped by
  `company_id`.
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login` — BCrypt password
  hashing, JWT issuance (`jjwt`), validated on every request by `JwtAuthFilter`.
- **CRUD REST APIs**: `/api/products`, `/api/raw-materials`, `/api/vendors`,
  `/api/warehouses`, `/api/bom`, `/api/inventory`, `/api/purchase-orders` (plus
  `POST /api/purchase-orders/{id}/advance-status`), `/api/bills`, `/api/calendar-events`,
  `/api/notifications`, `/api/team`, `/api/company`, and `/api/market-intelligence`
  (plus `POST /api/market-intelligence/refresh`).
- **Role-based authorization**: enforced server-side via `@PreAuthorize` on every
  mutating endpoint (not just hidden in the frontend) — e.g. only Admins can manage
  Team Members; Admin/Procurement/Warehouse/Production managers can write to most
  other modules, Vendor/Viewer roles are read-only. Matches the role matrix in
  `frontend/src/shared/lib/permissions.ts`.
- **Multi-tenancy**: every query is scoped to the authenticated user's `companyId`
  from their JWT — verified that a second registered company sees zero rows from the
  first company's data.

## What's not implemented yet

- Refresh tokens / token expiry handling in the frontend (a 401 from an expired token
  isn't currently caught and turned into a re-login prompt).
- A couple of forms' dropdown *options* still come from the mock seed arrays instead
  of the real services (see "Known limitation" above) — cosmetic, not a data bug.
- Receiving a purchase order doesn't automatically update Inventory, and selling a
  product doesn't automatically deduct its BOM's raw materials — both currently
  require a separate manual adjustment.
