# School OS: Structural Architecture Visualization (C4 Model)

The School OS architecture is documented using the **C4 Model** (Context, Containers, Components, and Code) created by Simon Brown. It uses clear, directional relationships labeled with explicit action verbs.

---

## Level 1: System Context Diagram

The System Context diagram illustrates the School OS as a central system, its primary human actors, and external system integrations.

```mermaid
flowchart TD
    subgraph School_Community [Human Actors]
        Parent["Parent / Guardian\n[Data Principal Representative]\nViews progress, signs DPDPA consents, pays fees"]
        Teacher["Teacher\n[Pedagogical Authority]\nMarks attendance, inputs grades, provides feedback"]
        Bursar["Bursar / Accountant\n[Financial Authority]\nManages ledgers, fee structures & reconciliations"]
        Registrar["Registrar\n[Admissions & Records Authority]\nVerifies documents, processes enrollments & TCs"]
        Principal["Principal / Head of School\n[Executive Authority]\nSigns off grades, moderations, TCs & school policies"]
    end

    SchoolOS["School Operating System (School OS)\n[Core Enterprise Software]\nOrchestrates pedagogical delivery, finance, operations, and compliance with zero autonomous AI"]

    subgraph External_Systems [External Integrations]
        PaymentGateway["Payment Gateways (PCI-DSS)\n[Stripe / Razorpay]\nProcesses card, UPI, and netbanking transactions"]
        StateAPIs["State Reporting APIs\n[UDISE+ / Ed-Fi]\nStatutory academic compliance reporting via ACL"]
        SMS_Email["Transactional Comms Provider\n[Email / SMS Relay]\nDispatches ambient alerts & one-time passwords"]
        LocalHardware["Local Hardware Integrations\n[RFID Turnstiles & Bus GPS]\nSends low-level physical telemetry via local bridge"]
    end

    Parent -->|"Signs consents, views reports, pays fees via HTTPS"| SchoolOS
    Teacher -->|"Records attendance (<2 min), enters marks via HTTPS"| SchoolOS
    Bursar -->|"Maintains double-entry ledgers, manages POS via HTTPS"| SchoolOS
    Registrar -->|"Validates documents, manages admissions via HTTPS"| SchoolOS
    Principal -->|"Approves moderations, signs TCs, views insights via HTTPS"| SchoolOS

    SchoolOS -->|"Initiates payment requests, receives webhooks"| PaymentGateway
    SchoolOS -->|"Transmits sanitized statutory reports through ACL"| StateAPIs
    SchoolOS -->|"Dispatches transactional notifications"| SMS_Email
    LocalHardware -->|"Pushes badge scan timestamps to local gateway"| SchoolOS
```

---

## Level 2: Container Diagram

The Container diagram shows the high-level deployable units, separation of concerns, and data storage solutions.

```mermaid
flowchart TD
    subgraph Clients [Client Layer]
        SPA["Admin & Teacher Web Client\n[Single-Page App: React / TypeScript]\nPrimary interface for staff; calm UX design"]
        MobileApp["Parent & Student Mobile Portal\n[Progressive Web App / Flutter]\nRead-mostly portal for grades, fees & consent management"]
    end

    Gateway["API Gateway & Reverse Proxy\n[Envoy / NGINX]\nSSL termination (TLS 1.3), rate limiting, JWT RBAC verification"]

    subgraph Backend_Services [Application Layer]
        CoreAPI["Core OS Microservices / Modular Monolith\n[Go / Kotlin / Node.js]\nExecutes domain logic across Bounded Contexts with HITL approval gates"]
        BackgroundWorker["Background Job Worker\n[Async Processing Engine]\nCompiles report card PDFs, reconciles bank batches, runs outbox publisher"]
        MsgBroker["Message Broker & Event Bus\n[RabbitMQ / NATS]\nAsynchronous delivery of strongly typed Domain Events"]
    end

    subgraph Data_Storage [Data & Document Storage Layer]
        PrimaryDB[("Primary Relational Database\n[PostgreSQL 16 Enterprise]\nStores ACID double-entry ledgers, state machines, and relational schemas")]
        DocumentStore[("Secure Encrypted Document Store\n[Private S3-Compatible / MinIO]\nStores scanned IDs, medical records & photos; AES-256 encrypted")]
        AuditStore[("Immutable Audit Trail Store\n[Append-Only Partitioned PostgreSQL / WORM]\nStores unalterable historical logs for statutory audits")]
    end

    SPA -->|"HTTPS / JSON REST / GraphQL"| Gateway
    MobileApp -->|"HTTPS / JSON REST / GraphQL"| Gateway

    Gateway -->|"Internal gRPC / REST"| CoreAPI
    
    CoreAPI -->|"Writes transactional outbox & reads data (SQL)"| PrimaryDB
    CoreAPI -->|"Generates ephemeral pre-signed upload/download URLs"| DocumentStore
    CoreAPI -->|"Appends immutable audit logs"| AuditStore
    CoreAPI -->|"Publishes events to queue"| MsgBroker

    MsgBroker -->|"Consumes domain events"| BackgroundWorker
    BackgroundWorker -->|"Reads/updates job state"| PrimaryDB
    BackgroundWorker -->|"Persists generated PDFs & report archives"| DocumentStore
    BackgroundWorker -->|"Writes execution logs"| AuditStore
```

---

## Level 3: Component Diagram (Finance & Billing Subsystem)

The Component diagram decomposes the `Finance API Container` into its internal domain components.

```mermaid
flowchart TD
    subgraph Finance_API [Finance Container Components]
        FinanceController["Finance REST Controller\nHandles incoming HTTP requests from staff and parent portal"]
        
        FeeCalculationService["Fee Calculation Domain Service\nComputes pro-rata fees, sibling concessions & installment schedules"]
        
        JournalEntryService["Double-Entry Journal Service\nEnforces invariant: Sum(Debits) == Sum(Credits) across all transactions"]
        
        PaymentReconciliationService["Payment Reconciliation Service\nMatches payment gateway webhooks and POS cash drawer summaries"]
        
        ConcessionApprovalGate["HITL Concession Gate\nEnforces Bursar cryptographic authorization for fee waivers"]
        
        LedgerRepository["Student Ledger Repository\nProvides persistence abstraction for invoices, receipts, and balances"]
        
        FinanceOutboxRelay["Transactional Outbox Writer\nPersists InvoiceGenerated & PaymentReceived events in atomic DB commit"]
    end

    FinanceController --> FeeCalculationService
    FinanceController --> PaymentReconciliationService
    FinanceController --> ConcessionApprovalGate

    FeeCalculationService --> JournalEntryService
    PaymentReconciliationService --> JournalEntryService
    ConcessionApprovalGate --> JournalEntryService

    JournalEntryService --> LedgerRepository
    JournalEntryService --> FinanceOutboxRelay

    LedgerRepository --> PrimaryDB[("PostgreSQL: finance schema")]
    FinanceOutboxRelay --> OutboxTable[("PostgreSQL: outbox_events")]
```

---

## Architectural Rationale: Simon Brown Principles

1. **Clear Directional Arrows**: Every arrow specifies the direction of data flow and protocol.
2. **Explicit Technology Tags**: Databases, protocols, and architectural layers are concretely annotated.
3. **Strict Isolation**: External entities cannot directly access data stores; all traffic flows through authenticated API Gateways and Domain Repositories.
