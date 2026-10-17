# St. Nicolas College — Self-Service Kiosk

**Development of a Self-Service Kiosk for Permit, Promissory Note and Statement of Account Services at St. Nicolas College**

Students use a touch-screen kiosk to check their **Statement of Account (SOA)**, print their **Examination Permit**, and request a **Promissory Note** when they cannot pay before an exam. Accounting staff manage payments, permits, promissory notes, and student records from the **Accounting Portal**. Both screens update in real time.

Same stack and folder pattern as `library_rfid`: React + Vite + Tailwind front end, Express + MySQL back end, served from one port.

---

## Contents

1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Running the system](#running-the-system)
4. [Using a tablet as the kiosk](#using-a-tablet-as-the-kiosk)
5. [Building an Android APK](#building-an-android-apk)
6. [Student kiosk](#student-kiosk)
7. [Accounting portal](#accounting-portal)
8. [How the system works](#how-the-system-works)
9. [Database](#database)
10. [API](#api)
11. [Project structure](#project-structure)
12. [Troubleshooting](#troubleshooting)

---

## Requirements

- **Node.js** 20 or newer
- **XAMPP** (MySQL / MariaDB) — or any MySQL 8 / MariaDB 10.4+ server
- A modern browser (Chrome or Edge) for the kiosk and the portal
- **Android Studio** — only if [building the tablet APK](#building-an-android-apk)

## Installation

1. Start **MySQL** in the XAMPP Control Panel.
2. Install packages:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env`. Set `MYSQL_PASSWORD` if your MySQL `root` has one.
   ```
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DATABASE=kiosk_permit
   PORT=3200
   ```
4. Create the database, tables, and starting data:
   ```
   npm run db:setup
   ```
   Or import `database/schema.sql` and then `database/seed.sql` in phpMyAdmin.

   > ⚠️ Both options **drop and recreate every table** of this system. Do not run them on a database with real records — back it up first.

The starting data contains file maintenance only: one admin account, the current school year, 5 courses, 21 subjects, and 4 sample students with their assessment. It has **no** payments, permits, or promissory notes.

### Upgrading an existing database

If the database was created with an older version, run these once, in order, in phpMyAdmin. They add tables and columns **without deleting data**:

1. `database/migrations/001_file_maintenance.sql`
2. `database/migrations/002_subject_course.sql`
3. `database/migrations/003_subject_course_many.sql`
4. `database/migrations/004_period_dates.sql`

## Running the system

**One-time setup** (first time on a PC, or after a fresh clone):

```
npm install
```
Copy `.env.example` to `.env` and set `MYSQL_*` (see [Installation](#installation)), then:
```
npm run db:setup
```
> ⚠️ Drops and recreates every table — only run this once, or again only if you want to reset to the starting data.

If this PC will also serve tablets on the network, allow the port once — in **PowerShell as Administrator**:
```
npm run firewall:allow
```

**Every time you want the server running:**

```
npm run dev
```

| Screen | Address |
|---|---|
| Student kiosk | http://localhost:3200/kiosk |
| Accounting portal | http://localhost:3200/admin |

Default admin login: **admin / admin123** — change it right away under **Admin Users**.

The server also prints the PC's network address (for example `http://192.168.1.10:3200/kiosk`) for tablets.

Production build:

```
npm run build
npm start
```

## Using a tablet as the kiosk

The PC runs the server and the database. The tablet only opens a web page from it (or the [APK](#building-an-android-apk) below, which is the same page in a native shell).

1. Connect the PC and the tablet to the **same Wi-Fi / network**.
2. Allow port 3200 through Windows Firewall — once per PC:
   1. Open **PowerShell as Administrator** (right-click PowerShell → *Run as administrator*).
   2. `cd` into the project folder, then run:
      ```
      npm run firewall:allow
      ```
   3. This runs `scripts/allow-kiosk-port.ps1`, which:
      - Adds an inbound rule named **"SNC Permit Kiosk Port 3200"** for TCP 3200 on the **Private** network profile (skips it if the rule already exists).
      - Prints the PC's current LAN IP and the ready-to-use addresses, e.g.:
        ```
        Open on the tablet (same Wi-Fi as this PC):
          Kiosk:  http://192.168.1.10:3200/kiosk
          Admin:  http://192.168.1.10:3200/admin
        ```
   4. If it fails with a permissions error, it is not running as Administrator — close PowerShell and reopen it elevated. As a fallback: **Windows Firewall → Allow an app → Node.js → check Private**.
3. Start the server (`npm run dev`) and open the printed address on the tablet, e.g. `http://192.168.1.10:3200/kiosk`. In Chrome use *Add to Home screen* or a fullscreen/kiosk browser app.
4. Give the PC a fixed IP (DHCP reservation on the router) so the tablet's link does not change.

Tap the **System Online** badge on any screen to see which server it is connected to, the server's network addresses, and to switch to another server IP.

## Building an Android APK

The APK does **not** bundle the app offline — it's a [Capacitor](https://capacitorjs.com) WebView shell that opens the kiosk page from the PC on the same Wi-Fi, exactly like opening the URL in a tablet browser above. This avoids keeping a second copy of the app in sync; the tablet always shows whatever is currently running on the PC.

**One-time requirement:** [Android Studio](https://developer.android.com/studio) installed on the machine that builds the APK (it includes the Android SDK and Gradle). The APK does not need to be built on the same PC that runs the kiosk server.

1. **Set the server address.** Open `capacitor.config.ts` and change `server.url` to the kiosk PC's LAN IP (the one from `npm run firewall:allow` / the server's startup output):
   ```ts
   server: {
     url: 'http://192.168.1.10:3200/kiosk',   // ← change this
     cleartext: true,
     allowNavigation: ['*']
   }
   ```
   (This is only the starting address — staff can still switch servers afterward from the **System Online** badge inside the app, same as the browser version.)
2. **Build the web app and sync it into the Android project:**
   ```
   npm run cap:sync
   ```
   This runs `npm run build`, then `npx cap sync android`, which copies the build and `capacitor.config.ts` into `android/`.
3. **Open the Android project in Android Studio:**
   ```
   npm run cap:open
   ```
   (Or open the `android/` folder directly in Android Studio.) Let Gradle finish syncing on first open — this downloads the Android build tools and can take a while/a few GB on a fresh Android Studio install.
4. **Build the APK** — in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. When it finishes, click the **locate** link in the notification, or find it at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
   That's the installable file — copy it to the tablet (USB, email, Drive, etc.) and open it to install (allow "Install from unknown sources" the first time).
5. **Command-line alternative** to steps 2–4, one command from the project root (builds the web app, syncs it, and runs the Gradle debug build):
   ```
   npm run android:debug
   ```
   Same output path as above. (This still needs Android Studio installed for its SDK/Gradle, even though it skips opening the IDE itself.)

### Release build (signed)

The debug APK above is fine for your own tablets. For a **release** build meant for wider distribution:

- **Android Studio (recommended):** **Build → Generate Signed Bundle / APK**, choose *APK*, and follow the wizard to create (or reuse) a signing keystore. The signed file lands in `android/app/build/outputs/apk/release/app-release.apk`.
- **Command line:**
  ```
  npm run android:release
  ```
  This produces `android/app/build/outputs/apk/release/app-release-unsigned.apk` — **unsigned**, so Android will refuse to install it as-is. Without a signing config in `android/app/build.gradle`, use the Android Studio wizard above instead, or sign it by hand with `apksigner` after creating a keystore with `keytool`.

## Student kiosk

1. **Click here to proceed** on the welcome screen. A Quick Guide on the right demonstrates the four steps.
2. **Enter or scan** the Student Number or LRN (or tap the school ID card on a USB reader). A touch keypad is available.
3. **Choose a service:**

| Service | What the student sees |
|---|---|
| Statement of Account | Fees, other fees and discounts, total paid, remaining balance, dues per exam term, payment history (each with a reprint button). Can **pay the balance (cash) right at the kiosk** — posts to the ledger immediately and prints a receipt — or print the SOA. |
| Examination Permit | Permit for each term (Prelim, Midterm, Prefinal, Finals) with subjects and proctor signature lines. Locked terms show the balance, a **Pay Balance (Cash)** option, and a shortcut to a promissory note. |
| Promissory Note | Request form (exam term, amount, payment date, reason, guardian, touch signature) and the status of past requests. Prints a receipt. |

4. **Print the slip** and present it with the school ID. **End Session** returns to the welcome screen.

## Accounting portal

| Section | Page | Purpose |
|---|---|---|
| Overview | Dashboard | Totals, collection rate, permit clearance per term, highest balances, pending notes, recent activity |
| Accounts | Students & SOA | Balances and payment progress; view a student's SOA; record payments; clear or lock permits |
| Accounts | Promissory Notes | Review requests from the kiosk — approve (clears the permit) or decline with a reason |
| File Maintenance | Student List | Add, edit, deactivate, restore students. The course's subjects are enrolled automatically |
| File Maintenance | Assessment | Per-student fees (tuition, lab, misc, previous balance, other fees and discounts) and enrolled subjects |
| File Maintenance | Courses | Programs offered |
| File Maintenance | Subjects | Subjects on the exam permit; each linked to one or more courses (none = all courses, e.g. GE) |
| File Maintenance | School Year & Semester | Academic periods, each with an optional From/To date range. The period whose range covers today becomes current **automatically**; with no date match, use **Set as current** by hand |
| System | Activity Logs | Every kiosk and staff action |
| System | Admin Users | Staff accounts and passwords |

The top bar holds the **exam term switcher** (Prelim / Midterm / Prefinal / Finals), the **notification bell**, and **Record Payment**.

## How the system works

**Permits.** A student's total assessment is split evenly across the four exam terms. When a payment is recorded — by the cashier in the portal, or by the student themselves at the kiosk (**Pay Balance (Cash)**, cash only, posts immediately with its own O.R. number) — every term whose cumulative due is now paid becomes **cleared** automatically. Approving a promissory note marks that term **cleared via promissory note**. Staff can still clear or lock any term by hand.

**Assessment total** = tuition + laboratory + miscellaneous + previous balance + other fees − discounts.

**Subjects and courses.** A subject can belong to several courses. Adding a student, or changing their course, enrolls the course's subjects; general subjects (no course) are added by hand in Assessment.

**Real-time updates.** Every change is written to the activity log, and the server pushes it to every open screen using Server-Sent Events (`/api/events`):
- The kiosk refreshes the signed-in student's balance, permits, and promissory notes when staff make changes.
- The portal reloads its data and shows a **notification** (bell + pop-up) for kiosk activity: sign-ins, new promissory notes, and prints.

**Soft delete.** Students, courses, subjects, school years, and admin users are deactivated, not deleted, and can be restored.

## Database

`database/schema.sql` — 13 tables:

| Table | Holds |
|---|---|
| `user_info` | Admin accounts (bcrypt passwords) |
| `academic_period` | School years / semesters; `IS_CURRENT` marks the active one (auto-set from `START_DATE`/`END_DATE` when today falls in range, else manual), `ACTIVE_TERM` the exam term |
| `course` | Programs |
| `subject` | Subjects |
| `subject_course` | Which courses take each subject (no rows = all courses) |
| `student` | Student records (LRN, student number, optional RFID card) |
| `student_subject` | Enrolled subjects per student per semester |
| `assessment`, `assessment_item` | Fees per student per semester; other fees and discounts |
| `payment` | Payments — cashier-recorded or self-service kiosk cash (unique O.R. number either way) |
| `exam_permit` | Permit status per student, semester, and term |
| `promissory_note` | Requests from the kiosk, with signature and review |
| `audit_log` | Activity trail (also drives real-time updates) |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health`, `/api/ping` | Server / database status |
| GET | `/api/server-info` | Server name and LAN addresses |
| GET | `/api/events` | Real-time event stream (SSE) |
| POST | `/api/auth/login` | Admin sign-in |
| GET / PUT | `/api/period` | Current semester / set exam term |
| GET | `/api/students?lookup=…` | Kiosk sign-in (LRN, student number, or card) |
| GET | `/api/students`, `/api/students/:id` | Student profiles with SOA and permits |
| GET | `/api/students/records` | Student list incl. deactivated, with assessment totals |
| POST / PUT | `/api/students`, `/api/students/:id` | Add / edit student info |
| DELETE / PUT | `/api/students/:id`, `/api/students/:id/restore` | Deactivate / restore |
| GET / PUT | `/api/students/:id/record`, `/api/students/:id/assessment` | Read / save fees and subjects |
| POST | `/api/payments` | Record payment (cashier, requires an O.R. number) |
| POST | `/api/payments/kiosk` | Self-service cash payment from the kiosk (generates its own O.R. number) |
| PUT | `/api/permits` | Clear or lock a permit |
| GET / POST | `/api/promissory-notes` | List / submit from kiosk |
| PUT | `/api/promissory-notes/:id/review` | Approve or decline |
| GET / POST | `/api/logs` | Activity log / kiosk print events |
| GET / POST / PUT / DELETE | `/api/file-maintenance/:type` | `courses`, `subjects`, `periods`, `users` |
| PUT | `/api/file-maintenance/:type/:id/restore` | Restore |
| PUT | `/api/file-maintenance/periods/:id/current` | Set current school year |

## Project structure

```
android/                    tablet APK (Capacitor), see "Building an Android APK"
capacitor.config.ts         APK's server URL and settings
database/
  schema.sql, seed.sql      fresh install
  setup.js                  npm run db:setup
  migrations/               upgrades for existing databases
scripts/
  allow-kiosk-port.ps1      npm run firewall:allow
server/
  config/                   MySQL pool
  routes/                   /api/... route files
  controllers/              validation and business rules
  models/                   SQL queries
  utils/                    helpers, LAN addresses, real-time events
src/
  components/kiosk/         student kiosk screens and modals
  components/admin/         accounting portal pages
  components/admin/maintenance/   file maintenance pages
  components/common/        logo, status badge, avatar
  context/                  AuthContext (admin session), AppContext (data + real-time)
  lib/api.ts                fetch wrapper
  index.css                 St. Nicolas College theme (see .claude/skills/snc-brand)
public/images/uploads/      school logo and campus photo
```

## Troubleshooting

| Problem | Fix |
|---|---|
| **System Offline** on the kiosk | Start MySQL in XAMPP and check `MYSQL_*` in `.env`, then restart `npm run dev`. |
| Tablet cannot open the page | Same Wi-Fi as the PC? Run `npm run firewall:allow` as Administrator. Use the PC's current IP from the server output. |
| "Student Number or LRN not found" | The student must exist and be active in **Student List**. |
| Permit still locked after payment | The payment must cover that term's due (total ÷ 4, cumulative). Or clear it by hand in **Students & SOA**. |
| Changes do not appear on another screen | Both screens must be connected to the same server. After updating the code, restart `npm run dev`. |
| Port 3200 already in use | Another copy of the server is running, or change `PORT` in `.env`. |
| APK installs but shows a blank/error screen | Wrong or unreachable IP in `capacitor.config.ts` → `server.url`. Fix it, then `npm run cap:sync` and rebuild the APK. Confirm the tablet is on the same Wi-Fi and `npm run dev` is running. |
| "App not installed" / blocked on the tablet | Enable **Install unknown apps** for the browser/file manager you used to open the APK (Android Settings → Apps → Special access), then try again. |

---

© St. Nicolas College. Built for the capstone project *Development of a Self-Service Kiosk for Permit, Promissory Note and Statement of Account Services at St. Nicolas College*.
