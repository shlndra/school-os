# School OS: Domain Events Catalog & Asynchronous Architecture

## 1. Tactical Design: Domain Events Overview

In Domain-Driven Design (DDD), communication between autonomous **Bounded Contexts** must be strictly decoupled to prevent the "Big Ball of Mud" anti-pattern. Instead of direct foreign-key relationships across context boundaries or synchronous cascading remote procedure calls, the School OS communicates state changes using immutable **Domain Events**.

```
+---------------------------+                      +---------------------------+
| Admissions Context        |                      | Finance Context           |
|                           |                      |                           |
| [Enrollment Aggregate]    |                      | [StudentLedger Aggregate] |
|            |              |                      |            ^              |
|            v              |                      |            |              |
| 1. Commit DB Transaction  |                      | 3. Consume Event          |
|    + Write Outbox Entry   |                      |    & Create Ledger        |
+------------+--------------+                      +------------+--------------+
             |                                                  ^
             v                                                  |
   +--------------------+     Domain Event Stream     +--------------------+
   | Transactional      |============================>| Consumer Handler   |
   | Outbox Relay       |  "StudentEnrolledEvent"     | (Idempotent)       |
   +--------------------+                             +--------------------+
```

---

## 2. Guaranteed Delivery: The Transactional Outbox Pattern

To prevent dual-write anomalies (where a database commit succeeds but message bus publishing fails, or vice versa), every Bounded Context relies on the **Transactional Outbox Pattern**:

1. When an aggregate commits a state change, a `DomainEventRecord` is written into an `outbox` table within the **same ACID relational transaction**.
2. An asynchronous background relay worker polls the `outbox` table (or tails PostgreSQL Write-Ahead Logs via CDC/Debezium).
3. The relay delivers the event to the centralized message broker (e.g., RabbitMQ, Apache Kafka, or NATS).
4. Each consumer context maintains an `idempotency_log` table storing processed `event_id` keys to ensure strict deduplication.

### Outbox Table Schema (PostgreSQL DDL)

```sql
CREATE TABLE outbox_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED'))
);

CREATE INDEX idx_outbox_pending ON outbox_events(status, occurred_at) WHERE status = 'PENDING';
```

---

## 3. Comprehensive Domain Events Catalog

### A. Admissions & Enrollment Context

#### 1. `StudentEnrolledEvent`
* **Trigger**: Registrar verifies verifiable parental consent and marks student admission as final.
* **Payload Structure**:
```json
{
  "eventId": "c7a8b9f0-281b-4bfe-9e01-8e0b62e49c71",
  "eventType": "Admissions.StudentEnrolled",
  "aggregateId": "APP-2026-08912",
  "occurredAt": "2026-09-30T10:15:30Z",
  "data": {
    "studentId": "STU-2026-0412",
    "applicationId": "APP-2026-08912",
    "personalDetails": {
      "firstName": "Aarav",
      "lastName": "Sharma",
      "dateOfBirth": "2018-05-14",
      "gender": "MALE",
      "bloodGroup": "O_POSITIVE"
    },
    "academicPlacement": {
      "academicYear": "2026-2027",
      "gradeLevel": "GRADE_3",
      "curriculumStream": "CBSE"
    },
    "guardianContacts": [
      {
        "guardianId": "GUR-9021",
        "relation": "MOTHER",
        "name": "Priyanka Sharma",
        "email": "priyanka.s@example.com",
        "phone": "+919876543210",
        "isPrimaryContact": true
      }
    ],
    "consentReferenceId": "CONSENT-DPDPA-2026-99128"
  }
}
```
* **Downstream Subscriptions**:
  * `Finance Bounded Context`: Autonomously instantiates `StudentLedger`, links standard Grade 3 fee schedule, and issues Term 1 invoice.
  * `Academic Bounded Context`: Adds student to target grade pool for class section assignment; creates baseline academic transcript.
  * `Operations Bounded Context`: Emits provisional badge request; evaluates transport route capacity if bus service was selected.
  * `Identity & Access Context`: Provisions role-scoped user entities for student and verified guardians.

---

### B. Academic & Pedagogy Context

#### 2. `MarksSubmittedEvent`
* **Trigger**: Subject teacher submits completed class roster marks.
* **Payload Structure**:
```json
{
  "eventId": "fa12c98d-73e4-4d89-9a84-0a37db9112ab",
  "eventType": "Academic.MarksSubmitted",
  "aggregateId": "ASSESS-2026-TERM1-MATH3A",
  "occurredAt": "2026-09-30T14:22:00Z",
  "data": {
    "assessmentId": "ASSESS-2026-TERM1-MATH3A",
    "classSectionId": "CLS-G3-A",
    "subjectCode": "MATH-03",
    "submittedByTeacherId": "EMP-TCH-104",
    "totalStudents": 32,
    "maxMarks": 50,
    "submissionHash": "sha256:4b227777d4da1ff2b8..."
  }
}
```
* **Downstream Subscriptions**:
  * `Academic Analytics Service`: Computes distribution curve, flags standard deviation anomalies or out-of-boundary outliers for the Academic Coordinator review.

#### 3. `ModerationAppliedEvent`
* **Trigger**: Academic Coordinator applies a board-compliant moderation rule to an assessment.
* **Payload Structure**:
```json
{
  "eventId": "ee411a09-90b1-47c1-84e9-ffb21c4391aa",
  "eventType": "Academic.ModerationApplied",
  "aggregateId": "ASSESS-2026-TERM1-MATH3A",
  "occurredAt": "2026-09-30T16:00:15Z",
  "data": {
    "assessmentId": "ASSESS-2026-TERM1-MATH3A",
    "moderatedByUserId": "EMP-COORD-004",
    "moderationPolicy": "CBSE_QUESTION_ERRATA_RULE",
    "adjustmentType": "FLAT_GRACE",
    "adjustmentValue": 2.0,
    "targetClassSectionId": "CLS-G3-A",
    "justification": "Grace awarded for ambiguous Question #4 on paper 3A as approved by Subject Committee.",
    "auditRecordId": "AUDIT-MOD-2026-004"
  }
}
```

#### 4. `ResultsPublishedEvent`
* **Trigger**: Principal provides digital sign-off to publish final report cards.
* **Downstream Subscriptions**:
  * `Communication Engine`: Dispatches batch transactional alerts (ambient notification: "Term 1 Report Card is now available in portal").
  * `Parent Portal Gateway`: Clears `UNPUBLISHED` visibility flag, making verified report cards accessible to students and parents.

---

### C. Finance & Billing Context

#### 5. `InvoiceGeneratedEvent`
* **Trigger**: Fee calculation service generates recurring or pro-rata invoice.
* **Payload Structure**:
```json
{
  "eventId": "189f72b2-3c32-4740-9a2d-45f8ef83921b",
  "eventType": "Finance.InvoiceGenerated",
  "aggregateId": "INV-2026-004921",
  "occurredAt": "2026-09-30T00:01:00Z",
  "data": {
    "invoiceId": "INV-2026-004921",
    "studentId": "STU-2026-0412",
    "totalAmount": 45000.00,
    "currency": "INR",
    "dueDate": "2026-10-15",
    "journalEntryId": "JRN-2026-88121",
    "lineItems": [
      { "component": "TUITION_FEE", "amount": 35000.00, "creditAccount": "REV_TUITION" },
      { "component": "TRANSPORT_FEE", "amount": 8000.00, "creditAccount": "REV_TRANSPORT" },
      { "component": "LAB_FEE", "amount": 2000.00, "creditAccount": "REV_LAB" }
    ]
  }
}
```

#### 6. `PaymentReceivedEvent`
* **Trigger**: Gateway webhook verified or physical POS counter receipt logged.
* **Downstream Subscriptions**:
  * `Finance Ledger Service`: Posts Journal Entry (Debit `CASH_BANK` / Credit `ACCOUNTS_RECEIVABLE`).
  * `Clearance Service`: If pending TC clearance was waiting on dues, re-evaluates outstanding balance check automatically.

---

### D. Multi-Department Clearance & Transfer Certificate (TC)

#### 7. `TCRequestedEvent`
* **Trigger**: Parent submits formal withdrawal request.
* **Payload Structure**:
```json
{
  "eventId": "88a10123-55bc-42b1-91ea-cb9287391100",
  "eventType": "Operations.TCRequested",
  "aggregateId": "TC-REQ-2026-019",
  "occurredAt": "2026-09-30T11:00:00Z",
  "data": {
    "requestId": "TC-REQ-2026-019",
    "studentId": "STU-2026-0412",
    "effectiveDate": "2026-10-31",
    "withdrawalReason": "Parent relocating to another city"
  }
}
```
* **Downstream Subscriptions**:
  * Pings `Finance Context`, `Library Context`, `Transport Context`, and `Academic Context` to initiate automated pre-checks and human sign-off gates.

#### 8. `TCClearanceCompleteEvent`
* **Trigger**: All department clearance checks are verified.
* **Downstream Subscriptions**:
  * Unlocks the `Sign and Issue TC` button on the Principal's executive dashboard.

---

## 4. Anti-Corruption Layer (ACL) Integration

When communicating with external or legacy non-DDD systems, the School OS places an **Anti-Corruption Layer (ACL)** between the domain model and the external interface.

```
+------------------------------------+
| School OS Core Domain              |
| (Admissions, Academic, Finance)    |
+-----------------+------------------+
                  ^
                  | Pure Domain Objects
                  v
+-----------------+------------------+
| Anti-Corruption Layer (ACL)        |
| - Bi-directional Data Mapping      |
| - Protocol Adaptation              |
| - Data Sanitization & Minimization |
+-----------------+------------------+
                  ^
                  | Foreign DTOs / Legacy Schemas
                  v
+-----------------+------------------+
| External Systems:                  |
| - UDISE+ / Ed-Fi Statutory APIs    |
| - Legacy SIS State Databases       |
| - Payment Gateways (Stripe/Razor)  |
+------------------------------------+
```

### ACL Functional Rules:
1. **No External Bleed**: External status codes (e.g., UDISE student status codes or payment provider specific error strings) are mapped to ubiquitous domain status enums.
2. **Data Minimization Filter**: Only fields statutorily required by the external API are forwarded; internal sensitive metadata (e.g., pastoral notes or guardian PAN details) are stripped out by the ACL before network transmission.
