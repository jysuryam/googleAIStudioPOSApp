# SmartPOS — Responsive Point of Sale & Inventory Management System

Production-oriented POS Billing and Inventory Management System built with **Java 21**, **Spring Boot 3.x**, **Maven**, **PostgreSQL**, and **JasperReports**.

---

## 1. System Requirements & Port Configuration

- **Java**: JDK 21+
- **Build Tool**: Apache Maven 3.9+ or Maven Wrapper (`./mvnw`)
- **Database**: PostgreSQL 15+
- **Application Port**: `9090` (Embedded Tomcat)
- **Database Port**: `5432`

---

## 2. PostgreSQL Setup & Flyway Migration

### Option A: Using Docker Compose (Fastest)

```bash
docker run -d --name smartpos-postgres \
  -e POSTGRES_DB=smartpos \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### Option B: Local PostgreSQL Installation

```sql
CREATE DATABASE smartpos;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE smartpos TO postgres;
```

*Note: You do NOT need to create tables manually.* Flyway automatically executes:
- `V1__init_schema.sql` (Creates all 32 relational tables, constraints, indexes)
- `V2__seed_data.sql` (Inserts initial roles, supermarket catalog, units, inventory)

---

## 3. Build & Run Instructions

### Linux & macOS

```bash
# Make wrapper executable
chmod +x ./mvnw

# Compile and run unit tests
./mvnw clean test

# Run Spring Boot Application on port 9090
./mvnw spring-boot:run
```

### Windows (PowerShell or Command Prompt)

```cmd
:: Build and test
mvnw.cmd clean test

:: Start application on http://localhost:9090
mvnw.cmd spring-boot:run
```

Access the application in any web browser at:
**`http://localhost:9090`**

---

## 4. Hardware Thermal Printer Configuration (58mm / 80mm)

1. Connect your 58mm or 80mm thermal receipt printer via USB, Ethernet, or Bluetooth.
2. In the POS System Settings, set **Default Receipt Width** to either:
   - `80mm` (Default for standard retail counter printers: EPSON TM-T88, Star Micronics, Citizen)
   - `58mm` (Default for compact handheld/mobile Bluetooth printers: Sunmi, Zjiang, POS-58)
3. When clicking **Print Receipt**:
   - The browser print dialog opens with `@media print` CSS enforcing exact thermal roll dimensions.
   - Set **Paper Size** to your printer's driver width (`80mm` or `58mm`).
   - Set **Margins** to **None** or **Minimum**.
   - Uncheck **Headers and Footers** to prevent the browser from printing URLs and page numbers.
