# School OS: Human-In-The-Loop (HITL) & RBAC Architecture

## 1. The Human-In-The-Loop (HITL) Paradigm: Why vs. How Loops

Modern enterprise software frequently succumbs to hyper-automation, delegating high-stakes decisions to opaque algorithms. In an educational institution, this leads to loss of relational trust, unexamined algorithmic bias, and severe regulatory liability.

The **School OS** enforces a strict architectural boundary between mechanical execution and human judgment:

```
+-------------------------------------------------------------------------------+
|                                THE "WHY LOOP"                                 |
|                       (Human Agency & Executive Judgment)                     |
|                                                                               |
|   * Subjective student evaluation & holistic feedback                         |
|   * CBSE / Board examination moderation & grace mark policies                 |
|   * Approval of financial fee concessions & hardship write-offs              |
|   * Child safeguarding & pastoral care escalations                            |
|   * Final sign-off on public report cards & Transfer Certificates             |
+---------------------------------------+---------------------------------------+
                                        | Explicit Human Signature
                                        | (Authenticated & Logged)
                                        v
+-------------------------------------------------------------------------------+
|                                THE "HOW LOOP"                                 |
|                       (Automated Mechanical Execution)                        |
|                                                                               |
|   * Double-entry ledger balance validation (Debits == Credits)                |
|   * Out-of-bounds boundary validation (0 <= marks <= maxMarks)                |
|   * Transactional outbox event distribution & database consistency            |
|   * PDF compilation of report cards and Transfer Certificates                 |
|   * Exception threshold detection (Attendance < 75%)                          |
+-------------------------------------------------------------------------------+
```

### Architectural HITL Guardrails
1. **No Autonomous AI Decision-Making**: No AI model or algorithm may unilaterally alter student enrollment status, grade a summative paper, assign disciplinary actions, or publish reports.
2. **Formative vs. Summative Boundary**: If natural language processing or spell-check assistance is used, it is restricted to *formative drafting assistance for students*. Final summative evaluation is exclusively human.
3. **Auditability of Judgment**: Every human intervention in the "Why Loop" is cryptographically tied to the user session, recording rationale and timestamp.

---

## 2. Role-Based Access Control (RBAC) Matrix

To enforce the principle of least privilege, the School OS answers four non-negotiable security questions for every interaction:
1. **Who can see the data?**
2. **Who can change the data?**
3. **Who can publish the data to families?**
4. **Who can see the money?**

### The Four Security Questions Matrix

| Role | 1. Who can see the data? | 2. Who can change the data? | 3. Who can publish to families? | 4. Who can see the money? |
| :--- | :--- | :--- | :--- | :--- |
| **Principal / Executive** | Full visibility across all modules & audit logs. | Institutional policies, calendar, capacity limits. | **Yes** (Ultimate sign-off authority for grades, TCs, circulars). | High-level financial summaries & revenue dashboards. |
| **Academic Coordinator** | All classes & sections within their assigned wing/grades. | Assessment definitions, rubrics, moderation adjustments. | No (Prepares and certifies; cannot unilaterally publish). | No access to fees or financial ledgers. |
| **Class / Subject Teacher** | Read-only access to assigned class roster & student academic history. | Enter/edit raw marks for assigned subjects; enter daily attendance. | No access to publish results directly to parents. | No access to financial ledger or fee balances. |
| **Registrar / Admissions** | Full visibility into admissions pipeline & student demographic data. | Verify documents, schedule assessments, finalize enrollment. | Limited to formal admission offer letters. | View fee clearance status only (binary flag: `PAID` / `UNPAID`). |
| **Bursar / Accountant** | Student billing accounts, payment transactions, vendor ledgers. | Fee structures, concessions, manual receipts, journal entries. | Invoices, fee receipts, payment reminders. | **Full Read/Write** to general ledger, bank accounts, POS. |
| **Librarian / Transport / Facilities** | Department-specific records (circulation logs, vehicle routes). | Check in/out books, assign bus stops, record maintenance. | No public publishing authority. | No ledger access; can view book fine / transport fee status. |
| **Parent / Guardian** | Personal student records only (grades, attendance, fees, circulars). | Update emergency contact; grant or withdraw DPDPA consents. | Not applicable. | View personal invoices, payment history, and initiate online fee payment. |
| **Student** | Personal timetable, assignments, published report cards, attendance. | Submit homework files; complete self-assessments. | Not applicable. | View tuition invoices (if permitted by school policy); no write access. |

---

## 3. Calm Technology in Educational Practice

"Calm Technology" (as coined by Mark Weiser and elaborated by Amber Case) dictates that software should inform without demanding continuous visual focus.

```
Traditional School ERP                              Calm School OS
+-----------------------------------+               +-----------------------------------+
| 50 Dashboard Badges & Widgets    |               | "Everything is running smoothly."  |
| 300 Unsorted Green Checkmarks     |   ====>>>     |                                   |
| Intrusive Push Pop-ups            |               | 1 Exception Requiring Attention:  |
| 15 Clicks to take Morning Register|               | > Aarav S. (3 days absent) [View] |
+-----------------------------------+               +-----------------------------------+
```

### Architectural Calm Design Principles

#### A. Exception-Based Reporting
* Teachers and administrators do not need to inspect every child who is performing normally.
* The system analyzes state asynchronously and raises **Ambient Exceptions** only when human intervention is needed:
  * *Attendance Anomaly*: Student attendance falls below 75% over a 14-day rolling window.
  * *Academic Anomaly*: Student misses two consecutive summative assignments or scores > 2 standard deviations below baseline.
  * *Financial Leakage Anomaly*: POS cash drawer variance > ₹50 at end-of-day shift closure.

#### B. Zero-Overhead Data Entry (< 2 Minutes)
* **Attendance Capture**:
  * Default state: All students are pre-marked **PRESENT**.
  * Class teacher taps only the names of absent students.
  * Real-world benchmark: Roster of 40 students marked and submitted in under **90 seconds**.
* **Offline Resilience**:
  * Local caching allows teachers to record attendance or marks in rural/poor-connectivity wings; local state synchronizes automatically upon reconnecting.

#### C. Prohibition of Algorithmic Behavioral Surveillance
* The architecture explicitly **rejects**:
  * Keystroke monitoring or attention tracking.
  * Web-cam emotion analysis or facial sentiment recognition.
  * Algorithmic behavioral profiling or automated disciplinary scoring.
* These prohibitions protect the child's psychological safety and prevent teacher burnout caused by continuous computational surveillance.
