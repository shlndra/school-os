# School OS: End-to-End Workflow Specifications

This document outlines the detailed step-by-step trace routes, data payloads, validation checks, and rollback strategies for the core operational workflows in the School OS.

---

## Workflow 1: Admissions to Active Classroom Integration

```
+--------+       +-----------+       +-----------+       +---------+       +------------+       +---------+
| Parent |       | Registrar |       | Assessor  |       |Principal|       |   Bursar   |       | Classroom|
+----+---+       +-----+-----+       +-----+-----+       +----+----+       +-----+------+       +----+----+
     |                 |                   |                  |                  |               |
     | 1. Submit Form  |                   |                  |                  |               |
     +---------------->|                   |                  |                  |               |
     |                 | 2. Verify Docs    |                  |                  |               |
     |                 |    (Pass Age Chk) |                  |                  |               |
     |                 +--------+          |                  |                  |               |
     |                 |        |          |                  |                  |               |
     |                 | 3. Schedule Eval  |                  |                  |               |
     |                 +------------------>|                  |                  |               |
     |                 |                   | 4. Input Rubric  |                  |               |
     |                 |                   +--------+         |                  |               |
     |                 |                            |         |                  |               |
     |                 | 5. Review & Capacity Check |         |                  |               |
     |                 +------------------------------------->|                  |               |
     |                 |                                      | 6. Approve Offer |               |
     | 7. Offer Letter |<-------------------------------------+                  |               |
     |<----------------+                                                         |               |
     |                 |                                                         |               |
     | 8. Pay Fee via Gateway                                                    |               |
     +-------------------------------------------------------------------------->|               |
     |                                                                           | 9. Confirm Tx |
     |                                                                           +-------+       |
     | 10. Sign DPDPA Consent Form                                                       |       |
     +---------------------------------------------------------------------------------->|       |
     |                                                                                           |
     |                 11. StudentEnrolledEvent Triggered                                        |
     |                 - Academic Context: Allocate Class Section & Roster --------------------->|
     |                 - Finance Context: Initialize StudentLedger & Term 1 Invoice              |
     |                 - Operations Context: Issue Smart ID Badge / Bus Route                    |
```

### Detailed Trace Steps:
1. **Submission**: Parent submits online application; uploaded files stored directly to private encrypted S3 blob store via ephemeral pre-signed URL.
2. **Document Gate**: Registrar verifies birth certificate against target grade minimum age requirement.
3. **Assessment Gate**: Evaluator enters subjective interview scores into the portal. *Invariant*: System blocks any algorithmic auto-scoring of creative or behavioral fit.
4. **Approval Gate**: Admissions committee reviews pool. Principal executes cryptographic approval; engine asserts invariant: `ActiveEnrolled + OutstandingOffers < GradeCapacityCeiling`.
5. **Fee Payment & Consent**: Parent settles admission deposit via gateway. Gateway webhook triggers payment verification.
6. **Parental Consent Signature**: Parent executes affirmative, purpose-specific DPDPA consent (core academic, medical, emergency).
7. **Enrollment Finalization**: Registrar confirms all gates are green. System transitions state to `ENROLLED_ACTIVE` and publishes `StudentEnrolledEvent`.
8. **Asynchronous Projections**:
   - `Academic Context` places child on class roster for Section A.
   - `Finance Context` creates `StudentLedger` with opening balance and posts first-term fee schedule invoice.
   - `Operations Context` reserves transport seat on Route 14.

---

## Workflow 2: Academic Assessment, Moderation & Publishing

```
Subject Teacher                Academic Coordinator                 Principal / Board Head
      |                                  |                                     |
      | 1. Enter Marks (0 <= X <= Max)   |                                     |
      +---------------+                  |                                     |
      | Real-time bounds validation      |                                     |
      |                                  |                                     |
      | 2. Submit Final Roster Marks     |                                     |
      +--------------------------------->|                                     |
                                         | 3. System computes bell curve       |
                                         |    and anomaly metrics              |
                                         +------------------+                  |
                                         |                  |                  |
                                         | 4. Applies Moderation Policy        |
                                         |    (Immutable audit trail logged)   |
                                         +------------------+                  |
                                         |                                     |
                                         | 5. Certifies Grade Roster           |
                                         +------------------------------------>|
                                                                               | 6. Principal Sign-Off
                                                                               |    (Publishing Gate)
                                                                               +----------+
                                                                                          |
                                                                               7. ResultsPublishedEvent
                                                                                  - Parent Portal Unlocks
                                                                                  - Ambient Notifications Sent
```

### Detailed Trace Steps:
1. **Marks Window Activation**: System scheduler initiates the assessment window based on the academic calendar.
2. **Teacher Input**: Class teacher enters marks. Real-time boundary guards immediately reject values `< 0` or `> maxMarks`.
3. **Teacher Submission**: Teacher digitally submits completed roster. Roster state transitions to `MARKS_SUBMITTED`.
4. **Automated Anomaly Scan**: Background worker computes class mean, standard deviation, and failure rate. If variance from historical baseline exceeds 15%, the system tags the submission for coordinator review.
5. **Moderation Gate (HITL)**:
   - Academic Coordinator inspects distribution curves.
   - If an errata occurred in an exam question, Coordinator applies a structured moderation rule (e.g., "+2 marks to all students who attempted Q4").
   - System updates the moderated score while keeping raw submitted marks immutable in the audit record.
6. **Executive Publishing Gate (HITL)**:
   - Publishing results to parents is an explicit executive action.
   - Principal signs the batch, changing report status from `UNPUBLISHED` to `PUBLISHED`.
7. **Notification**: System publishes `ResultsPublishedEvent`; parents receive an ambient notification that reports are viewable.

---

## Workflow 3: Multi-Department Transfer Certificate (TC) Clearance

```
Parent / Guardian         Operations (Transport & Library)         Finance (Bursar)         Principal
        |                                |                                 |                    |
        | 1. Submit TC Request           |                                 |                    |
        +------------------------------->|                                 |                    |
        |                                |                                 |                    |
        |                                | 2. Library Check (0 books)      |                    |
        |                                +----------------+                |                    |
        |                                | 3. Transport Check (Seat freed) |                    |
        |                                +----------------+                |                    |
        |                                                                  | 4. Dues Check      |
        |                                                                  |    (Ledger <= 0)   |
        |                                                                  +---------+          |
        |                                                                            |          |
        |                                5. All Clearances Completed                 |          |
        |                                +-------------------------------------------+          |
        |                                |                                                      |
        |                                | 6. TCClearanceCompleteEvent                          |
        |                                +----------------------------------------------------->|
        |                                                                                       | 7. Digital Signature
        |                                                                                       |    & PDF Generation
        |                                8. TC Issued & Record Archived to ALUMNI <-------------+
        |<--------------------------------------------------------------------------------------+
```

### Detailed Trace Steps:
1. **TC Initiation**: Parent or registrar initiates withdrawal in the portal. State set to `TC_REQUESTED`.
2. **Concurrent Department Clearances**:
   - `Finance Clearance`: Automated check verifies if `StudentLedger.outstandingBalance <= 0`. If dues remain, Bursar is alerted to collect fee or record authorized concession.
   - `Library Clearance`: Automated check verifies active loans. If books are overdue, librarian assesses condition.
   - `Transport Clearance`: Releases reserved seat on the route for waitlisted students.
   - `Academic Clearance`: Class teacher confirms finalized attendance and conduct rating.
3. **Barrier Synchronization**: The workflow engine waits until `FinanceStatus == CLEARED`, `LibraryStatus == CLEARED`, `TransportStatus == CLEARED`, and `AcademicStatus == CLEARED`.
4. **Principal Authorization Gate**: Once all clearances are verified, the Principal dashboard unlocks the `Sign TC` action.
5. **Artifact Generation & Archiving**:
   - Engine generates an immutable, tamper-evident PDF embedded with a cryptographic SHA-256 verification QR code.
   - Student state is transitioned to `ARCHIVED_ALUMNI`.
   - Access credentials for daily portals are revoked; read-only access to historic transcripts is maintained.

---

## Workflow 4: Double-Entry Revenue Lifecycle & POS Protection

```
Student Ledger (AR)               Revenue Accounts                Cash / Bank                Campus POS Terminal
        |                                |                             |                              |
        | 1. Invoice Generated           |                             |                              |
        |    Debit: AR (+50,000)         |                             |                              |
        |    Credit: Tuition (+40,000) --+                             |                              |
        |    Credit: Lab (+10,000) ------+                             |                              |
        +--------------------------------+                             |                              |
        |                                                              |                              |
        | 2. Parent Pays Online / POS                                  |                              |
        |    Debit: Cash/Bank (+50,000) -------------------------------+                              |
        |    Credit: AR (-50,000)                                      |                              |
        +--------------------------------------------------------------+                              |
        |                                                                                             |
        | 3. On-Campus Bookstore / Cafeteria Transaction                                              |
        |    (Student taps badge at POS)                                                              |
        |<--------------------------------------------------------------------------------------------+
        |    Debit: Student Meal Plan Ledger                                                          |
        |    Credit: Cafeteria Food Revenue                                                           |
        |    Invariant: Transaction logged immediately in unified journal; no offline cash leakage   |
```

### Double-Entry Integrity Rules:
1. Every monetary transaction must create balanced debit and credit entries.
2. In campus stores (bookstore, cafeteria, uniform center), transactions are processed through POS terminals directly connected to the centralized ledger.
3. Cash registers require daily physical reconciliation:
   - Cashier enters count at shift close.
   - Any discrepancy $> \text{₹}50$ triggers an immediate audit exception alert to the Bursar.

---

## Workflow 5: Zero-Overhead Morning Attendance (< 2 Minutes)

```
Class Teacher                     School OS App                         Pastoral Care Head
      |                                  |                                       |
      | 1. Open Attendance Tab           |                                       |
      |    (Roster loads pre-populated   |                                       |
      |     with all students "PRESENT") |                                       |
      |<---------------------------------+                                       |
      |                                  |                                       |
      | 2. Tap 2 absent students (90 sec)|                                       |
      +--------------------------------->|                                       |
      |                                  |                                       |
      | 3. Tap "Submit Morning Register" |                                       |
      +--------------------------------->| 4. System evaluates exception rules   |
                                         +------------------+                    |
                                         |                  |                    |
                                         | 5. Consecutive Absence Flag Raised    |
                                         |    (e.g., Absent 3 consecutive days)  |
                                         +-------------------------------------->| 6. Pastoral Care alerted
                                                                                   for welfare follow-up
```

### Calm UX Principles:
1. **Optimistic Defaults**: Teachers do not mark 40 checkboxes individually. The UI defaults to 100% attendance; the teacher touches only the anomalies.
2. **Speed Target**: Total time spent taking attendance is under 90 seconds per class.
3. **Automated Pastoral Escalation**: If an absence marks the 3rd consecutive day of unexcused absence, an ambient notification is routed to the Pastoral Care coordinator to check on student welfare.
