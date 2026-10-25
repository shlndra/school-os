CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('Male','Female','Other')),
  blood_group TEXT,
  grade TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','ALUMNI','SUSPENDED')),
  admission_date TEXT NOT NULL,
  wallet_balance REAL NOT NULL DEFAULT 0.0,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guardians (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS class_sections (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  class_teacher_id TEXT,
  capacity INTEGER NOT NULL DEFAULT 40,
  room_number TEXT,
  UNIQUE(grade, section)
);

-- Admissions Pipeline
CREATE TABLE IF NOT EXISTS admissions (
  id TEXT PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  target_grade TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  status TEXT NOT NULL DEFAULT 'ENQUIRY_RECEIVED' CHECK(status IN (
    'ENQUIRY_RECEIVED','DOCUMENTS_PENDING','DOCUMENTS_VERIFIED',
    'INTERVIEW_SCHEDULED','EVALUATION_COMPLETE',
    'OFFER_EXTENDED','FEES_CLEARED','ENROLLED','REJECTED','WAITLISTED'
  )),
  documents_verified INTEGER NOT NULL DEFAULT 0,
  interview_score REAL,
  interview_notes TEXT,
  fee_paid REAL DEFAULT 0,
  rejection_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Staff / HR
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Principal','Teacher','Accountant','Nurse','Driver','Librarian','Guard','Cleaner')),
  department TEXT,
  subject TEXT,
  phone TEXT,
  email TEXT,
  base_salary REAL NOT NULL DEFAULT 0,
  join_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','ON_LEAVE','RESIGNED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PRESENT' CHECK(status IN ('PRESENT','ABSENT','HALF_DAY','ON_LEAVE')),
  clock_in TEXT,
  clock_out TEXT,
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  UNIQUE(staff_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK(leave_type IN ('SICK','CASUAL','EARNED','MATERNITY','UNPAID')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  approved_by TEXT,
  substitute_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- Student Attendance
CREATE TABLE IF NOT EXISTS student_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PRESENT' CHECK(status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
  marked_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(student_id, date)
);

-- Academics
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  subject TEXT NOT NULL,
  max_marks REAL NOT NULL,
  assessment_type TEXT NOT NULL CHECK(assessment_type IN ('FORMATIVE','SUMMATIVE','UNIT_TEST','MID_TERM','FINAL')),
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','MARKS_ENTRY','REVIEW_PENDING','MODERATED','PUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  raw_marks REAL,
  adjusted_marks REAL,
  grade_letter TEXT,
  remarks TEXT,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(assessment_id, student_id)
);

-- Finance: Chart of Accounts & Double-Entry Ledger
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('ASSET','LIABILITY','REVENUE','EXPENSE','EQUITY')),
  parent_code TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id TEXT NOT NULL,
  account_code TEXT NOT NULL,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (journal_id) REFERENCES journal_entries(id),
  FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code),
  CHECK(debit >= 0 AND credit >= 0),
  CHECK(NOT (debit > 0 AND credit > 0))
);

CREATE TABLE IF NOT EXISTS fee_invoices (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  description TEXT NOT NULL,
  total_amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(status IN ('UNPAID','PARTIAL','PAID','OVERDUE','WAIVED')),
  journal_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- POS / Campus Store
CREATE TABLE IF NOT EXISTS pos_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('FOOD','BEVERAGE','STATIONERY','UNIFORM','BOOK','OTHER')),
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pos_transactions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'WALLET' CHECK(payment_method IN ('WALLET','CASH','CARD')),
  journal_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id),
  FOREIGN KEY (item_id) REFERENCES pos_items(id)
);

-- Transport
CREATE TABLE IF NOT EXISTS bus_routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  driver_id TEXT,
  vehicle_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 40
);

CREATE TABLE IF NOT EXISTS bus_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id TEXT NOT NULL,
  stop_name TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  pickup_time TEXT,
  lat REAL,
  lng REAL,
  FOREIGN KEY (route_id) REFERENCES bus_routes(id)
);

CREATE TABLE IF NOT EXISTS student_transport (
  student_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  stop_id INTEGER NOT NULL,
  PRIMARY KEY (student_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (route_id) REFERENCES bus_routes(id)
);

-- Library
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  category TEXT
);

CREATE TABLE IF NOT EXISTS library_loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  checkout_date TEXT NOT NULL DEFAULT (date('now')),
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','RETURNED','OVERDUE')),
  FOREIGN KEY (book_id) REFERENCES library_books(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Transfer Certificates
CREATE TABLE IF NOT EXISTS transfer_certificates (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  request_date TEXT NOT NULL DEFAULT (date('now')),
  reason TEXT,
  finance_cleared INTEGER NOT NULL DEFAULT 0,
  library_cleared INTEGER NOT NULL DEFAULT 0,
  transport_cleared INTEGER NOT NULL DEFAULT 0,
  academic_cleared INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','CLEARANCE_IN_PROGRESS','ALL_CLEARED','SIGNED','ISSUED')),
  signed_by TEXT,
  signed_at TEXT,
  tc_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll_runs (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PROCESSED','APPROVED','PAID')),
  total_amount REAL NOT NULL DEFAULT 0,
  processed_by TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  payroll_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  base_salary REAL NOT NULL,
  working_days INTEGER NOT NULL,
  present_days INTEGER NOT NULL,
  leave_days INTEGER NOT NULL DEFAULT 0,
  unpaid_leave_days INTEGER NOT NULL DEFAULT 0,
  deductions REAL NOT NULL DEFAULT 0,
  allowances REAL NOT NULL DEFAULT 0,
  net_salary REAL NOT NULL,
  FOREIGN KEY (payroll_id) REFERENCES payroll_runs(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- Audit Trail (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_state TEXT,
  new_state TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Timetable Management
CREATE TABLE IF NOT EXISTS timetables (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  period_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  teacher_id TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room_number TEXT,
  FOREIGN KEY (teacher_id) REFERENCES staff(id),
  UNIQUE(grade, section, day_of_week, period_number)
);

-- Substitute Teacher Assignments
CREATE TABLE IF NOT EXISTS substitute_assignments (
  id TEXT PRIMARY KEY,
  leave_id TEXT,
  original_teacher_id TEXT NOT NULL,
  substitute_teacher_id TEXT NOT NULL,
  assignment_date TEXT NOT NULL,
  period_number INTEGER,
  grade TEXT,
  section TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED','COMPLETED','CANCELLED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (leave_id) REFERENCES leave_requests(id),
  FOREIGN KEY (original_teacher_id) REFERENCES staff(id),
  FOREIGN KEY (substitute_teacher_id) REFERENCES staff(id)
);

-- Campus Clinic / Infirmary Records
CREATE TABLE IF NOT EXISTS clinic_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  visit_date TEXT NOT NULL DEFAULT (date('now')),
  visit_time TEXT NOT NULL DEFAULT (time('now')),
  symptoms TEXT NOT NULL,
  treatment TEXT NOT NULL,
  temperature TEXT,
  pulse TEXT,
  administered_by TEXT NOT NULL DEFAULT 'Kavita Joshi (Nurse)',
  parent_notified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DISCHARGED' CHECK(status IN ('UNDER_OBSERVATION','DISCHARGED','SENT_HOME','REFERRED_HOSPITAL')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Parent & Student Circulars / Instant Notices
CREATE TABLE IF NOT EXISTS circulars_notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('ACADEMIC','EVENT','EMERGENCY','TRANSPORT','SPORTS','GENERAL')),
  target_audience TEXT NOT NULL DEFAULT 'ALL' CHECK(target_audience IN ('ALL','PARENTS','STUDENTS','FACULTY')),
  content TEXT NOT NULL,
  published_date TEXT NOT NULL DEFAULT (date('now')),
  is_urgent INTEGER NOT NULL DEFAULT 0,
  author TEXT NOT NULL DEFAULT 'Principal Office',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Search & Performance Expression Indexes (Prefix Optimization)
CREATE INDEX IF NOT EXISTS idx_students_first_name_nocase ON students(first_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_students_last_name_nocase ON students(last_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_students_id_nocase ON students(id COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_students_status_grade ON students(status, grade, section);

CREATE INDEX IF NOT EXISTS idx_staff_first_name_nocase ON staff(first_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_staff_last_name_nocase ON staff(last_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_staff_id_nocase ON staff(id COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_staff_dept_role ON staff(status, department, role);

CREATE INDEX IF NOT EXISTS idx_fee_invoices_student_status ON fee_invoices(student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_id_nocase ON fee_invoices(id COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_admissions_applicant_nocase ON admissions(applicant_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_admissions_id_nocase ON admissions(id COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_pos_items_name_nocase ON pos_items(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_pos_items_active_cat ON pos_items(is_active, category);

