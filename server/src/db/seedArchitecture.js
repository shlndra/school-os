const { getDb } = require('./database');
const db = getDb();

// 1. Create tables if not exists
db.exec(`
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
`);

console.log('✅ Tables created / confirmed');

// 2. Seed Timetables for Grades 1 through 10
const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const subjectsByPeriod = [
  { period: 1, subject: 'Mathematics', teacherId: 'STF-002', start: '08:30 AM', end: '09:15 AM' },
  { period: 2, subject: 'Science', teacherId: 'STF-004', start: '09:15 AM', end: '10:00 AM' },
  { period: 3, subject: 'English', teacherId: 'STF-003', start: '10:00 AM', end: '10:45 AM' },
  { period: 4, subject: 'Social Studies', teacherId: 'STF-006', start: '11:15 AM', end: '12:00 PM' },
  { period: 5, subject: 'Hindi', teacherId: 'STF-005', start: '12:00 PM', end: '12:45 PM' },
  { period: 6, subject: 'Computer & AI', teacherId: 'STF-013', start: '12:45 PM', end: '01:30 PM' }
];

const insertTT = db.prepare(`
  INSERT OR REPLACE INTO timetables (id, grade, section, day_of_week, period_number, subject, teacher_id, start_time, end_time, room_number)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

grades.forEach((g, gIdx) => {
  ['A', 'B'].forEach(sec => {
    days.forEach((day, dIdx) => {
      subjectsByPeriod.forEach(p => {
        // slight rotation per day
        const shiftedP = ((p.period + dIdx) % 6) + 1;
        const subj = subjectsByPeriod[shiftedP - 1];
        const id = `TT-${g.replace(/\s+/g, '')}-${sec}-${day.slice(0, 3)}-P${p.period}`;
        const room = `Room ${100 + gIdx * 10 + (sec === 'A' ? 1 : 2)}`;
        insertTT.run(id, g, sec, day, p.period, subj.subject, subj.teacherId, p.start, p.end, room);
      });
    });
  });
});

console.log('✅ Timetables seeded across all 10 grades (Monday-Friday, 6 periods)');

// 3. Seed Clinic Records
const insertClinic = db.prepare(`
  INSERT OR IGNORE INTO clinic_records (id, student_id, visit_date, visit_time, symptoms, treatment, temperature, pulse, administered_by, parent_notified, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleVisits = [
  ['CLI-001', 'STU-001', '2026-10-01', '09:45 AM', 'High fever & chills, complaining of throat discomfort', 'Paracetamol oral suspension 250mg, hydration, cold sponging', '100.8°F', '82 bpm', 'Kavita Joshi (Nurse)', 1, 'DISCHARGED'],
  ['CLI-002', 'STU-014', '2026-10-01', '11:15 AM', 'Mild right ankle sprain on sports field', 'Ice compression therapy, crepe bandage & topical analgesic spray', '98.6°F', '76 bpm', 'Kavita Joshi (Nurse)', 0, 'DISCHARGED'],
  ['CLI-003', 'STU-005', '2026-09-30', '01:20 PM', 'Acute seasonal allergic rhinitis, watery eyes & sneezing', 'Antihistamine (Cetirizine 5mg) & saline steam', '98.4°F', '78 bpm', 'Kavita Joshi (Nurse)', 1, 'DISCHARGED'],
  ['CLI-004', 'STU-010', '2026-09-29', '10:30 AM', 'Nausea and dizziness during morning assembly', 'ORS electrolytic rehydration, rested in infirmary bed for 40 mins', '98.6°F', '80 bpm', 'Kavita Joshi (Nurse)', 1, 'DISCHARGED']
];

sampleVisits.forEach(v => insertClinic.run(...v));
console.log('✅ Clinic records seeded');

// 4. Seed Circulars & Notices
const insertNotice = db.prepare(`
  INSERT OR IGNORE INTO circulars_notices (id, title, category, target_audience, content, published_date, is_urgent, author)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleNotices = [
  [
    'NOT-001',
    'CBSE Annual Science, Robotics & AI Exhibition 2026',
    'ACADEMIC',
    'ALL',
    'We are proud to announce the Annual STEM & AI Innovation Fair on Saturday, October 17. Students from Grades 5 to 10 are invited to register their working robotics, green energy, and software models with their respective science mentors by October 10.',
    '2026-10-01',
    0,
    'Academic Coordinator'
  ],
  [
    'NOT-002',
    'Weather & Air Quality Advisory for Gurugram Campus',
    'EMERGENCY',
    'PARENTS',
    'In accordance with Haryana Education Directorate guidelines on air quality, morning outdoor sports activities will be conducted in the air-conditioned indoor gymnasium until further notice. All school bus fleet operations remain strictly on schedule.',
    '2026-10-01',
    1,
    'Principal Meera Iyer'
  ],
  [
    'NOT-003',
    'Diwali & Autumn Festive Break Notification',
    'EVENT',
    'ALL',
    'The school will remain closed for Diwali and Bhai Dooj festivities from Monday, 26 October to Friday, 30 October 2026. Normal campus sessions will resume on Monday, 2 November 2026.',
    '2026-09-28',
    0,
    'Campus Administration'
  ],
  [
    'NOT-004',
    'Bus Route 102 (Sohna Road) Minor Route Adjustment',
    'TRANSPORT',
    'PARENTS',
    'Due to civic road resurfacing near Subhash Chowk, Bus Route 102 will embark 8 minutes earlier from Stop 2 (Vipul Greens) and Stop 3 (Tatvam Villas). Please ensure students reach their stops by 07:12 AM.',
    '2026-09-27',
    0,
    'Transport Fleet Manager'
  ]
];

sampleNotices.forEach(n => insertNotice.run(...n));
console.log('✅ Circulars and notices seeded');

// 5. Seed Library Books catalog
db.exec(`
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  category TEXT
);
`);

const insertBook = db.prepare(`
  INSERT OR IGNORE INTO library_books (id, title, author, isbn, total_copies, available_copies, category)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const books = [
  ['LIB-001', 'Wings of Fire: An Autobiography', 'Dr. A.P.J. Abdul Kalam', '978-8173711466', 8, 7, 'Biography'],
  ['LIB-002', 'Malgudi Days', 'R.K. Narayan', '978-8185986173', 12, 10, 'Fiction'],
  ['LIB-003', 'The Blue Umbrella', 'Ruskin Bond', '978-8171673407', 10, 9, 'Literature'],
  ['LIB-004', 'NCERT Exemplar Mathematics (Class 10)', 'NCERT Board', '978-9352920259', 15, 12, 'Academics'],
  ['LIB-005', 'Concepts of Physics (Vol 1 & 2)', 'H.C. Verma', '978-8177091878', 10, 6, 'Science'],
  ['LIB-006', 'Computer Science with Python', 'Sumita Arora', '978-9389278912', 14, 11, 'Technology'],
  ['LIB-007', 'Gitanjali (Song Offerings)', 'Rabindranath Tagore', '978-8129118547', 6, 5, 'Poetry'],
  ['LIB-008', 'The Discovery of India', 'Jawaharlal Nehru', '978-0143031031', 5, 4, 'History']
];

books.forEach(b => insertBook.run(...b));
console.log('✅ Library books catalog populated');

// 6. Seed initial substitute teacher assignment
const insertSub = db.prepare(`
  INSERT OR IGNORE INTO substitute_assignments (id, leave_id, original_teacher_id, substitute_teacher_id, assignment_date, period_number, grade, section, notes, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertSub.run('SUB-001', 'LR-1001', 'STF-003', 'STF-005', '2026-10-05', 3, 'Grade 1', 'A', 'Covering English reader chapter 4 while Sunita Devi is on casual leave', 'ASSIGNED');
console.log('✅ Substitute assignments seeded');
