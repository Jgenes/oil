# Moshi Co-operative University (MoCU)
## Fleet Fuel and Vehicle Management System

An institutional, enterprise-grade, secure, modern web-based Fleet Fuel and Vehicle Management System developed specifically for **Moshi Co-operative University (MoCU)**, located on Sokoine Road, Moshi, Kilimanjaro, Tanzania.

---

## 1. System Overview

The MoCU Fleet Fuel and Vehicle Management System digitalizes and governs university fleet operations, replacing manual paper requisitions (such as **MoCU Fuel Requisition Form No. 3143**) with a transparent, role-based, end-to-end multi-level approval and monitoring workflow.

### Primary Operational Objectives:
- **Financial Control & Transparency:** Enforce strict budget controls on fuel allocations across university departments.
- **Strict Odometer Auditing:** Automatically compute travel distance (`Distance Covered = Ending Odometer - Starting Odometer`) and prevent invalid rollback readings where ending odometer is lower than starting odometer.
- **Intelligent Fuel Consumption Monitoring:** Distinguish between **Fuel Allocated/Issued**, **Fuel Actually Consumed**, and **Fuel Remaining in Tank**.
- **Automated Anomaly Detection:** Dynamically calculate efficiency ($KM/L$) and cost per kilometre ($TZS/KM$) against vehicle baselines, automatically flagging trips that exceed thresholds by $>25\%$.
- **Voucher Reconciliation:** Reconcile approved quantities against actual issued volumes at contracted stations (Puma, TotalEnergies, Oryx, Lake Oil).
- **Statutory Compliance & Audit Trail:** Maintain an immutable audit trail with before/after diffs, IP logging, and supervisor overrides.

---

## 2. Institutional Visual Design & Form Digitalization

The system incorporates official MoCU visual identity elements:
- **Official Header:** Features the **Coat of Arms of the United Republic of Tanzania** and the **Moshi Co-operative University (MoCU) Seal**.
- **Official Requisition Slip (Digital Replica):** Exactly replicates the physical paper requisition form (**Fuel Requisition Form No: 3143**):
  - Requisition Officer Name & Department/Section
  - Type of Fuel (Diesel / Petrol)
  - Purpose & Supply Destination
  - Last Request Kilometer & Present Request Kilometer
  - Six-row Vehicle Number, Quantity, Unit Price, and Total Value table
  - Official Signatures: Requisition Officer, Head Driver / Transport Officer, Head of Department
  - Authorization Statement: *"I authorize / do not authorize the above mentioned fuel to be supplied"* with Head of Procurement Management Unit (HPMU) endorsement.
- **Print & PDF Generation:** Built-in 1-click printable letterhead and downloadable PDF documents.

---

## 3. Implemented Modules

| Module | Core Capabilities |
|---|---|
| **A. Dashboard & Analytics** | 13 core KPIs (Vehicles registered, active, on trip, maintenance, requisitions, pending, approved, distance, fuel consumed, fuel expenditure in TZS), interactive monthly charts, department budget utilization, and real-time alert widgets. |
| **B. Vehicle Fleet Registry** | Complete registration number, make/model, category, fuel type, engine cc, assigned department & driver, current odometer, tank capacity, insurance & inspection expiry warnings, and authorized odometer adjustment records. |
| **C. Fuel Requisition Workflow** | Multi-level approval pipeline: Submitter &rarr; HOD Review &rarr; Transport Verification &rarr; HPMU Authorization &rarr; Finance Vote Recording &rarr; Fuel Station Issuance. |
| **D. Trip & Distance Monitor** | Trip logging, departure/return tracking, start/end odometer verification, negative distance prevention, fuel consumed vs remaining separation. |
| **E. Intelligent Consumption & Anomalies** | Live efficiency calculations ($KM/L$, $TZS/KM$), comparison against vehicle standard baselines, automated anomaly flagging, and formal investigation resolution tracking. |
| **F. Fuel Issuance & Station Reconciliation** | Station fuel vouchers, contracted fuel stations, approved vs issued quantity variance reconciliation, price tariff audit, receipt tracking. |
| **G. Driver Management** | Driver employee records, licence numbers, classes, licence expiry countdown alerts, assigned vehicles, trip histories, and efficiency scores. |
| **H. Department Management** | Department fuel votes, annual budget allocations, actual expenditures, budget utilization percentages, and assigned vehicle scopes. |
| **I. Fuel Suppliers & Stations** | Contracted station profiles (Puma Sokoine, Total Mawenzi, Oryx Boma, Lake Oil), diesel and petrol tariff management, transaction histories. |
| **J. Vehicle Maintenance & Servicing** | Service history logs, workshop providers (MoCU Central Workshop, Toyota Tanzania Moshi), parts used, costs, next service date/mileage countdown reminders. |
| **K. Institutional Reports & Exports** | 8 comprehensive analytical reports with date/vehicle/department filters, 1-click **Export to Excel (.xlsx)**, and printable PDF format. |
| **L. Compliance Audit Trail** | Tamper-evident ledger recording user ID, role, action, old values, new values, timestamp, IP address, and supervisor justification. |

---

## 4. Role-Based Access Control (RBAC) & Test Accounts

All accounts use the standard test password: `mocu@2026`

| Role | Name | Email | Designation & Responsibilities |
|---|---|---|---|
| **System Administrator** | Eng. Godfrey Tarimo | `admin@mocu.ac.tz` | Full system configuration, vehicles, users, audit logs, system reset. |
| **Transport Officer** | Capt. Michael Shirima | `transport@mocu.ac.tz` | Fleet operations, vehicle inspection, odometer verification, trip dispatch, fuel allocation. |
| **Head of Department (HOD)** | Dr. Prosper Mrosso | `hod.estate@mocu.ac.tz` | Head of Estates & Works; reviews and recommends departmental fuel requests. |
| **Approving Officer (HPMU)** | Ms. Beatrice Swai | `hpmu@mocu.ac.tz` | Head of Procurement Management Unit; authorizes or rejects fuel supply requests. |
| **Finance Officer** | CPA Daniel Kimaro | `finance@mocu.ac.tz` | Principal Accountant; commits expenditure vote codes and monitors budget ceilings. |
| **Driver** | Juma Shabani Mushi | `driver@mocu.ac.tz` | Senior University Chauffeur; views assigned trips, logs return odometer readings. |
| **Internal Auditor** | CPA Frank Moshi | `auditor@mocu.ac.tz` | Chief Internal Auditor; inspects transactions, variances, anomalies, and audit trail. |
| **Management** | Prof. Alfred S. Sife | `vc@mocu.ac.tz` | Vice Chancellor; executive dashboard, institutional KPIs, consolidated reports. |

> **Quick Switcher:** The system includes a 1-click **Role Switcher** in the top navigation bar, allowing immediate testing of any user role without re-entering passwords.

---

## 5. Technology Stack & Architecture

- **Backend:** Node.js Express RESTful API with SQLite relational database (`better-sqlite3`), WAL mode, foreign key enforcement, and bcrypt password hashing.
- **Frontend:** React 18 / Vite SPA with Bootstrap 5, Bootstrap Icons, Lucide React, Chart.js (`react-chartjs-2`), SheetJS (`xlsx`) for Excel export, and `jspdf` for printable reports.
- **Database Architecture:**
  - `departments`, `users`, `vehicles`, `drivers`, `fuel_suppliers`, `fuel_requests`, `fuel_request_items`, `fuel_issuances`, `trips`, `maintenance_records`, `audit_logs`, `notifications`, `odometer_adjustments`.

---

## 6. How to Run & Deploy

### Prerequisites
- Node.js v18+ (tested on Node v22.22.3)
- npm v9+

### Quick Start
```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Build the React frontend
cd ../client && npm run build

# 3. Start the application
cd .. && npm start
```

The system will be accessible at:
```
http://localhost:3000
```

### Reset Demo Database
To restore the pristine demo dataset (including Requisition No. 3143 and sample fleet data):
```bash
node server/db/seed.js
```
Or click the **"Reset Demo"** button directly in the application navbar.

---

## 7. Official Contact Details

---

## 5. MongoDB Database Configuration & Deployment

The MoCU Fleet Management System includes complete **MongoDB & Mongoose** support with dedicated schemas, connection management, and automated database seeders.

### Environment Configuration (`.env`)
```bash
PORT=3000
MONGODB_USERNAME="josephgenes1999_db_user"
MONGODB_PASSWORD="8jEn3gNUD4bTpuU7"
MONGODB_URI="mongodb+srv://josephgenes1999_db_user:8jEn3gNUD4bTpuU7@<your-cluster>.mongodb.net/mocu_fleet?retryWrites=true&w=majority"
JWT_SECRET="mocu-fleet-secure-secret-key-2026"
```

### Mongoose Models Implemented:
- `User`: Roles, credentials, signatures, department assignments
- `Department`: Budgets, HOD info, expenditure tracking
- `Vehicle`: Tanzanian registrations, engine specs, category, baseline KM/L, inspection dates
- `Driver`: Licence classes, expiry dates, trip mileage
- `FuelSupplier`: Contracted stations, petrol & diesel tariffs
- `FuelRequest`: Multi-stage approvals, Slip 3143 fields, HPMU declarations
- `FuelIssuance`: Pump vouchers, variance reconciliation, invoice tracking
- `Trip`: Start/end odometers, fuel allocated/consumed/remaining, anomaly flags
- `MaintenanceRecord`: Garage repairs, spare parts, scheduled servicing
- `AuditLog`: Immutable compliance ledger with diff tracking
- `Notification`: Actionable alerts for each user role
- `OdometerAdjustment`: Authorized odometer maintenance records

### Database Seeding Command
To populate MongoDB Atlas with initial university data (including Requisition Form No. 3143):
```bash
npm run seed:mongo
```

---

## 6. Institutional Contact Information

**Moshi Co-operative University (MoCU)**  
06 Sokoine Road, 25121 Mfumuni, P. O. Box 474, Moshi, Kilimanjaro, Tanzania  
- **Telephone:** +255 27 275 1833  
- **Email:** `vc@mocu.ac.tz` / `info@mocu.ac.tz`  
- **Website:** [www.mocu.ac.tz](https://www.mocu.ac.tz)
