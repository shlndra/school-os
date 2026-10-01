const { v4: uuid } = require('uuid');

function seed(db) {
  // ------ Chart of Accounts (Double-Entry Accounting) ------
  const accounts = [
    ['1000', 'Cash & Bank', 'ASSET', null],
    ['1100', 'Accounts Receivable - Students', 'ASSET', null],
    ['1200', 'POS Cash Drawer', 'ASSET', null],
    ['2000', 'Accounts Payable', 'LIABILITY', null],
    ['2100', 'Salaries Payable', 'LIABILITY', null],
    ['3000', 'School Equity', 'EQUITY', null],
    ['4000', 'Tuition Fee Revenue', 'REVENUE', null],
    ['4100', 'Transport Fee Revenue', 'REVENUE', null],
    ['4200', 'Lab Fee Revenue', 'REVENUE', null],
    ['4300', 'Cafeteria Revenue', 'REVENUE', null],
    ['4400', 'Bookstore Revenue', 'REVENUE', null],
    ['4500', 'Uniform Revenue', 'REVENUE', null],
    ['4600', 'Admission Fee Revenue', 'REVENUE', null],
    ['5000', 'Salary Expense', 'EXPENSE', null],
    ['5100', 'Concession Expense', 'EXPENSE', null],
  ];
  const insertAccount = db.prepare('INSERT OR IGNORE INTO chart_of_accounts (code, name, type, parent_code) VALUES (?,?,?,?)');
  accounts.forEach(a => insertAccount.run(...a));

  // ------ Class Sections ------
  const sections = [
    ['CLS-1A', 'Grade 1', 'A', null, 35, 'Room 101'],
    ['CLS-1B', 'Grade 1', 'B', null, 35, 'Room 102'],
    ['CLS-5A', 'Grade 5', 'A', null, 40, 'Room 201'],
    ['CLS-5B', 'Grade 5', 'B', null, 40, 'Room 202'],
    ['CLS-9A', 'Grade 9', 'A', null, 40, 'Room 301'],
    ['CLS-9B', 'Grade 9', 'B', null, 40, 'Room 302'],
  ];
  const insertSection = db.prepare('INSERT OR IGNORE INTO class_sections (id, grade, section, class_teacher_id, capacity, room_number) VALUES (?,?,?,?,?,?)');
  sections.forEach(s => insertSection.run(...s));

  // ------ Staff ------
  const staffMembers = [
    ['STF-001', 'Meera', 'Iyer', 'Principal', 'Administration', null, '9876500001', 'meera@school.edu', 120000, '2015-06-01'],
    ['STF-002', 'Rajesh', 'Kumar', 'Teacher', 'Academics', 'Mathematics', '9876500002', 'rajesh@school.edu', 55000, '2018-07-15'],
    ['STF-003', 'Sunita', 'Devi', 'Teacher', 'Academics', 'English', '9876500003', 'sunita@school.edu', 52000, '2019-04-01'],
    ['STF-004', 'Arjun', 'Singh', 'Teacher', 'Academics', 'Science', '9876500004', 'arjun@school.edu', 54000, '2020-01-10'],
    ['STF-005', 'Priya', 'Nair', 'Teacher', 'Academics', 'Hindi', '9876500005', 'priya@school.edu', 50000, '2021-06-01'],
    ['STF-006', 'Vikram', 'Patel', 'Teacher', 'Academics', 'Social Studies', '9876500006', 'vikram@school.edu', 51000, '2019-08-20'],
    ['STF-007', 'Anita', 'Sharma', 'Accountant', 'Finance', null, '9876500007', 'anita@school.edu', 45000, '2017-03-01'],
    ['STF-008', 'Ramesh', 'Yadav', 'Driver', 'Transport', null, '9876500008', null, 28000, '2020-05-15'],
    ['STF-009', 'Lakshmi', 'Reddy', 'Driver', 'Transport', null, '9876500009', null, 28000, '2021-01-10'],
    ['STF-010', 'Kavita', 'Joshi', 'Nurse', 'Health', null, '9876500010', 'kavita@school.edu', 35000, '2019-09-01'],
    ['STF-011', 'Deepak', 'Gupta', 'Librarian', 'Library', null, '9876500011', 'deepak@school.edu', 32000, '2020-04-01'],
    ['STF-012', 'Suresh', 'Bhat', 'Guard', 'Security', null, '9876500012', null, 22000, '2018-01-01'],
  ];
  const insertStaff = db.prepare('INSERT OR IGNORE INTO staff (id, first_name, last_name, role, department, subject, phone, email, base_salary, join_date) VALUES (?,?,?,?,?,?,?,?,?,?)');
  staffMembers.forEach(s => insertStaff.run(...s));

  // Link class teachers
  db.prepare("UPDATE class_sections SET class_teacher_id = 'STF-002' WHERE id = 'CLS-5A'").run();
  db.prepare("UPDATE class_sections SET class_teacher_id = 'STF-003' WHERE id = 'CLS-1A'").run();
  db.prepare("UPDATE class_sections SET class_teacher_id = 'STF-004' WHERE id = 'CLS-9A'").run();
  db.prepare("UPDATE class_sections SET class_teacher_id = 'STF-005' WHERE id = 'CLS-1B'").run();
  db.prepare("UPDATE class_sections SET class_teacher_id = 'STF-006' WHERE id = 'CLS-5B'").run();

  // ------ Students ------
  const studentData = [
    // Grade 1A
    ['STU-001','Aarav','Sharma','2019-03-14','Male','O+','Grade 1','A', 2500],
    ['STU-002','Diya','Patel','2019-07-22','Female','A+','Grade 1','A', 1800],
    ['STU-003','Vihaan','Reddy','2019-01-05','Male','B+','Grade 1','A', 3000],
    ['STU-004','Ananya','Kumar','2019-11-30','Female','AB+','Grade 1','A', 500],
    ['STU-005','Reyansh','Gupta','2019-06-18','Male','O-','Grade 1','A', 2200],
    // Grade 5A
    ['STU-006','Ishaan','Nair','2015-04-10','Male','A-','Grade 5','A', 1500],
    ['STU-007','Aanya','Singh','2015-08-25','Female','B+','Grade 5','A', 3200],
    ['STU-008','Kabir','Joshi','2015-02-14','Male','O+','Grade 5','A', 0],
    ['STU-009','Myra','Iyer','2015-12-01','Female','A+','Grade 5','A', 2700],
    ['STU-010','Arjun','Desai','2015-05-20','Male','B-','Grade 5','A', 1000],
    ['STU-011','Saanvi','Mehta','2015-09-11','Female','AB-','Grade 5','A', 4000],
    ['STU-012','Dhruv','Kapoor','2015-03-30','Male','O+','Grade 5','A', 800],
    // Grade 9A
    ['STU-013','Aditya','Verma','2011-06-15','Male','A+','Grade 9','A', 1200],
    ['STU-014','Kiara','Bhat','2011-10-08','Female','B+','Grade 9','A', 5000],
    ['STU-015','Rohan','Choudhury','2011-01-22','Male','O-','Grade 9','A', 600],
    ['STU-016','Navya','Saxena','2011-04-17','Female','A-','Grade 9','A', 2000],
    ['STU-017','Vivaan','Tiwari','2011-08-03','Male','AB+','Grade 9','A', 3500],
    ['STU-018','Riya','Banerjee','2011-12-25','Female','O+','Grade 9','A', 1500],
  ];
  const insertStudent = db.prepare('INSERT OR IGNORE INTO students (id, first_name, last_name, date_of_birth, gender, blood_group, grade, section, admission_date, wallet_balance) VALUES (?,?,?,?,?,?,?,?,?,?)');
  studentData.forEach(s => {
    insertStudent.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], '2026-04-01', s[8]);
  });

  // ------ Guardians ------
  const guardians = [
    ['GUR-001','STU-001','Priyanka Sharma','Mother','9876501001','priyanka@email.com',1],
    ['GUR-002','STU-002','Rahul Patel','Father','9876501002','rahul.p@email.com',1],
    ['GUR-003','STU-006','Deepa Nair','Mother','9876501006','deepa.n@email.com',1],
    ['GUR-004','STU-007','Harpreet Singh','Father','9876501007','harpreet@email.com',1],
    ['GUR-005','STU-013','Sanjay Verma','Father','9876501013','sanjay.v@email.com',1],
    ['GUR-006','STU-014','Neeta Bhat','Mother','9876501014','neeta.b@email.com',1],
  ];
  const insertGuardian = db.prepare('INSERT OR IGNORE INTO guardians (id, student_id, name, relation, phone, email, is_primary) VALUES (?,?,?,?,?,?,?)');
  guardians.forEach(g => insertGuardian.run(...g));

  // ------ POS Items (Cafeteria & Store) ------
  // ------ POS Items (Cafeteria & Store) ------
  const posItems = [
    // FOOD & MEALS
    ['POS-001', 'Lunch Meal (Thali)', 'FOOD', 60, 200],
    ['POS-002', 'Veg Sandwich', 'FOOD', 35, 150],
    ['POS-003', 'Samosa (2 pcs)', 'FOOD', 20, 300],
    ['POS-004', 'Fresh Fruit Bowl', 'FOOD', 30, 100],
    ['POS-015', 'Idli & Sambar (2 pcs)', 'FOOD', 30, 150],
    ['POS-016', 'Paneer Kathi Roll', 'FOOD', 50, 120],
    ['POS-017', 'Veg Biryani Box', 'FOOD', 70, 100],
    ['POS-018', 'Poha with Sev', 'FOOD', 25, 140],
    ['POS-019', 'Biscuits & Cookies Pack', 'FOOD', 15, 250],
    ['POS-020', 'Cheese Toast', 'FOOD', 40, 100],

    // DRINKS & BEVERAGES
    ['POS-005', 'Fruit Juice Box', 'BEVERAGE', 25, 200],
    ['POS-006', 'Mineral Water (500ml)', 'BEVERAGE', 15, 500],
    ['POS-007', 'Milk (200ml)', 'BEVERAGE', 20, 150],
    ['POS-021', 'Fresh Mango Lassi', 'BEVERAGE', 35, 120],
    ['POS-022', 'Fresh Lemonade / Shikanji', 'BEVERAGE', 20, 150],
    ['POS-023', 'Tender Coconut Water', 'BEVERAGE', 40, 80],
    ['POS-024', 'Chocolate Milk Bottle', 'BEVERAGE', 30, 120],

    // STATIONERY
    ['POS-008', 'Ruled Notebook (200pg)', 'STATIONERY', 45, 300],
    ['POS-009', 'Gel Pen Set (5 pcs)', 'STATIONERY', 60, 200],
    ['POS-010', 'Mathematical Geometry Box', 'STATIONERY', 120, 100],
    ['POS-025', 'Art Drawing Sketchbook', 'STATIONERY', 80, 120],
    ['POS-026', '12-Color Pencil Set', 'STATIONERY', 90, 100],
    ['POS-027', 'Eraser & Sharpener Combo', 'STATIONERY', 15, 300],
    ['POS-028', 'Scientific Calculator', 'STATIONERY', 350, 50],
    ['POS-029', 'Graph Sheet Bundle (50pg)', 'STATIONERY', 25, 150],
    ['POS-030', 'Clear Exam Clipboard', 'STATIONERY', 65, 100],

    // UNIFORMS
    ['POS-011', 'Official School Tie', 'UNIFORM', 250, 80],
    ['POS-012', 'Sports House T-Shirt', 'UNIFORM', 350, 60],
    ['POS-031', 'School Blazer / Jacket', 'UNIFORM', 1200, 40],
    ['POS-032', 'School Socks (Pair of 2)', 'UNIFORM', 120, 150],
    ['POS-033', 'Sports Track Pants', 'UNIFORM', 450, 70],
    ['POS-034', 'Leather School Belt', 'UNIFORM', 180, 90],
    ['POS-035', 'Sun Cap / Sports Hat', 'UNIFORM', 150, 80],

    // BOOKS
    ['POS-013', 'Science Lab Workbook', 'BOOK', 180, 100],
    ['POS-014', 'Hindi Literature Reader', 'BOOK', 150, 100],
    ['POS-036', 'English Grammar & Composition', 'BOOK', 220, 90],
    ['POS-037', 'Math Olympiad Practice Book', 'BOOK', 190, 80],
    ['POS-038', 'Social Science Map Atlas', 'BOOK', 160, 100],
    ['POS-039', 'Computer Coding for Kids', 'BOOK', 240, 75],
  ];
  const insertPosItem = db.prepare('INSERT OR IGNORE INTO pos_items (id, name, category, price, stock) VALUES (?,?,?,?,?)');
  posItems.forEach(p => insertPosItem.run(...p));

  // ------ Bus Routes & Stops (Gurgaon & Delhi NCR) ------
  const routes = [
    ['BUS-R1', 'Route 101 — Gurgaon Golf Course & Cyber City', 'STF-008', 'HR-26-EA-4521', 45],
    ['BUS-R2', 'Route 102 — Sohna Road & Subhash Chowk', 'STF-009', 'HR-26-DK-8910', 38],
    ['BUS-R3', 'Route 103 — Dwarka & West Delhi NCR Express', 'STF-012', 'DL-1C-AA-9082', 42],
    ['BUS-R4', 'Route 104 — South Delhi & Vasant Kunj Corridor', 'STF-004', 'DL-1P-CB-3341', 35],
  ];
  const insertRoute = db.prepare('INSERT OR IGNORE INTO bus_routes (id, route_name, driver_id, vehicle_number, capacity) VALUES (?,?,?,?,?)');
  routes.forEach(r => insertRoute.run(...r));

  const stops = [
    // Route 101 - Golf Course & Cyber City, Gurgaon
    ['BUS-R1', 'Sector 56 HUDA Market, Golf Course Ext Rd, Gurgaon', 1, '06:35 AM', 28.4232, 77.0984],
    ['BUS-R1', 'Sector 54 Rapid Metro / DLF Phase 5, Gurgaon', 2, '06:50 AM', 28.4418, 77.1082],
    ['BUS-R1', 'Genpact Chowk, Golf Course Road, DLF Phase 1', 3, '07:05 AM', 28.4721, 77.0987],
    ['BUS-R1', 'Sikanderpur Metro Interchange / MG Road Gurgaon', 4, '07:18 AM', 28.4812, 77.0935],
    ['BUS-R1', 'DLF Cyber City (Building 10 Gate), Gurgaon', 5, '07:32 AM', 28.4950, 77.0892],
    ['BUS-R1', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 6, '07:50 AM', 28.4250, 77.0390],

    // Route 102 - Sohna Road & Subhash Chowk, Gurgaon
    ['BUS-R2', 'Vatika City / Badshahpur Chowk, Sohna Road, Gurgaon', 1, '06:45 AM', 28.3970, 77.0490],
    ['BUS-R2', 'Subhash Chowk (Opp. Omaxe Mall), Sector 47, Gurgaon', 2, '07:00 AM', 28.4320, 77.0420],
    ['BUS-R2', 'Rajiv Chowk / Civil Lines, Old Gurgaon', 3, '07:15 AM', 28.4550, 77.0320],
    ['BUS-R2', 'Millennium City Centre Metro (HUDA City Centre), Gurgaon', 4, '07:30 AM', 28.4595, 77.0725],
    ['BUS-R2', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 5, '07:50 AM', 28.4250, 77.0390],

    // Route 103 - Dwarka & West Delhi NCR Link
    ['BUS-R3', 'Dwarka Sector 21 Metro Interchange, New Delhi', 1, '06:30 AM', 28.5520, 77.0580],
    ['BUS-R3', 'Dwarka Expressway Toll / Bajghera Chowk, Gurgaon Border', 2, '06:48 AM', 28.5190, 77.0180],
    ['BUS-R3', 'Palam Vihar Vyapar Kendra, Sector 2, Gurgaon', 3, '07:05 AM', 28.5080, 77.0380],
    ['BUS-R3', 'Sector 14 HUDA Market, Old Gurgaon', 4, '07:22 AM', 28.4750, 77.0450],
    ['BUS-R3', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 5, '07:48 AM', 28.4250, 77.0390],

    // Route 104 - South Delhi & Vasant Kunj Corridor
    ['BUS-R4', 'Vasant Kunj Promenade, Nelson Mandela Marg, New Delhi', 1, '06:35 AM', 28.5410, 77.1550],
    ['BUS-R4', 'Mahipalpur Aerocity Junction, Delhi NCR', 2, '06:50 AM', 28.5480, 77.1230],
    ['BUS-R4', 'Ambience Mall / Shankar Chowk, NH-48 Border, Gurgaon', 3, '07:10 AM', 28.5030, 77.0970],
    ['BUS-R4', 'IFFCO Chowk Metro Station, Gurgaon', 4, '07:28 AM', 28.4720, 77.0710],
    ['BUS-R4', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 5, '07:50 AM', 28.4250, 77.0390],
  ];
  const insertStop = db.prepare('INSERT OR IGNORE INTO bus_stops (route_id, stop_name, stop_order, pickup_time, lat, lng) VALUES (?,?,?,?,?,?)');
  stops.forEach(s => insertStop.run(...s));

  // Assign students to transport
  const assignTransport = db.prepare('INSERT OR IGNORE INTO student_transport (student_id, route_id, stop_id) VALUES (?,?,?)');
  assignTransport.run('STU-001', 'BUS-R1', 2);
  assignTransport.run('STU-002', 'BUS-R1', 3);
  assignTransport.run('STU-003', 'BUS-R1', 4);
  assignTransport.run('STU-006', 'BUS-R2', 2);
  assignTransport.run('STU-007', 'BUS-R2', 3);
  assignTransport.run('STU-009', 'BUS-R2', 4);
  assignTransport.run('STU-013', 'BUS-R3', 2);
  assignTransport.run('STU-014', 'BUS-R3', 3);
  assignTransport.run('STU-016', 'BUS-R4', 2);
  assignTransport.run('STU-017', 'BUS-R4', 3);

  // ------ Library Books ------
  const books = [
    ['LIB-001', 'The Jungle Book', 'Rudyard Kipling', '978-0141325296', 5, 5, 'Fiction'],
    ['LIB-002', 'Wings of Fire', 'A.P.J. Abdul Kalam', '978-8173711466', 3, 3, 'Biography'],
    ['LIB-003', 'NCERT Mathematics Gr 5', 'NCERT', '978-8174505071', 10, 10, 'Textbook'],
    ['LIB-004', 'NCERT Science Gr 9', 'NCERT', '978-8174506535', 10, 10, 'Textbook'],
    ['LIB-005', 'Harry Potter & the Philosopher\'s Stone', 'J.K. Rowling', '978-0747532743', 4, 4, 'Fiction'],
    ['LIB-006', 'Panchatantra Tales', 'Vishnu Sharma', '978-8176210218', 6, 6, 'Stories'],
    ['LIB-007', 'Discovery of India', 'Jawaharlal Nehru', '978-0143031031', 2, 2, 'History'],
  ];
  const insertBook = db.prepare('INSERT OR IGNORE INTO library_books (id, title, author, isbn, total_copies, available_copies, category) VALUES (?,?,?,?,?,?,?)');
  books.forEach(b => insertBook.run(...b));

  // Active library loans (1 overdue for testing TC clearance)
  db.prepare(`INSERT OR IGNORE INTO library_loans (book_id, student_id, checkout_date, due_date, status) VALUES ('LIB-005','STU-008','2026-09-01','2026-09-15','OVERDUE')`).run();
  db.prepare(`INSERT OR IGNORE INTO library_loans (book_id, student_id, checkout_date, due_date, status) VALUES ('LIB-001','STU-014','2026-09-20','2026-10-04','ACTIVE')`).run();
  // Update available copies
  db.prepare("UPDATE library_books SET available_copies = available_copies - 1 WHERE id IN ('LIB-005','LIB-001')").run();

  // ------ Fee Invoices (some paid, some unpaid) ------
  const invoices = [
    ['INV-001','STU-001','Term 1 Tuition + Transport (2026-27)', 43000, 43000, '2026-07-15', 'PAID'],
    ['INV-002','STU-002','Term 1 Tuition + Transport (2026-27)', 43000, 20000, '2026-07-15', 'PARTIAL'],
    ['INV-003','STU-006','Term 1 Tuition + Lab (2026-27)', 47000, 47000, '2026-07-15', 'PAID'],
    ['INV-004','STU-007','Term 1 Tuition + Lab (2026-27)', 47000, 0, '2026-07-15', 'UNPAID'],
    ['INV-005','STU-008','Term 1 Tuition + Lab (2026-27)', 47000, 47000, '2026-07-15', 'PAID'],
    ['INV-006','STU-013','Term 1 Tuition + Lab (2026-27)', 52000, 52000, '2026-07-15', 'PAID'],
    ['INV-007','STU-014','Term 1 Tuition + Lab (2026-27)', 52000, 52000, '2026-07-15', 'PAID'],
  ];
  const insertInvoice = db.prepare('INSERT OR IGNORE INTO fee_invoices (id, student_id, description, total_amount, paid_amount, due_date, status) VALUES (?,?,?,?,?,?,?)');
  invoices.forEach(inv => insertInvoice.run(...inv));

  // ------ Admissions Pipeline Samples ------
  const admissions = [
    ['ADM-001', 'Rithvik Menon', '2020-02-18', 'Grade 1', 'Asha Menon', '9876590001', 'asha@email.com', 'ENQUIRY_RECEIVED'],
    ['ADM-002', 'Siya Kapoor', '2016-05-10', 'Grade 5', 'Pooja Kapoor', '9876590002', 'pooja@email.com', 'DOCUMENTS_VERIFIED'],
    ['ADM-003', 'Arnav Reddy', '2012-09-30', 'Grade 9', 'Suresh Reddy', '9876590003', 'suresh.r@email.com', 'INTERVIEW_SCHEDULED'],
    ['ADM-004', 'Tara Bansal', '2020-08-12', 'Grade 1', 'Neha Bansal', '9876590004', 'neha.b@email.com', 'OFFER_EXTENDED'],
  ];
  const insertAdmission = db.prepare('INSERT OR IGNORE INTO admissions (id, applicant_name, date_of_birth, target_grade, guardian_name, guardian_phone, guardian_email, status) VALUES (?,?,?,?,?,?,?,?)');
  admissions.forEach(a => insertAdmission.run(...a));

  // ------ Sample Assessments ------
  const assessments = [
    ['EXAM-001', 'Mid-Term Mathematics', 'Grade 5', 'A', 'Mathematics', 100, 'MID_TERM', '2026-09-15', 'PUBLISHED'],
    ['EXAM-002', 'Unit Test - English', 'Grade 5', 'A', 'English', 50, 'UNIT_TEST', '2026-09-20', 'MARKS_ENTRY'],
    ['EXAM-003', 'Mid-Term Science', 'Grade 9', 'A', 'Science', 100, 'MID_TERM', '2026-09-18', 'PUBLISHED'],
  ];
  const insertAssessment = db.prepare('INSERT OR IGNORE INTO assessments (id, name, grade, section, subject, max_marks, assessment_type, date, status) VALUES (?,?,?,?,?,?,?,?,?)');
  assessments.forEach(a => insertAssessment.run(...a));

  // Marks for EXAM-001 (Grade 5A Math — published)
  const marksMath5 = [
    ['EXAM-001', 'STU-006', 85, 85, 'A'], ['EXAM-001', 'STU-007', 92, 92, 'A+'],
    ['EXAM-001', 'STU-008', 67, 67, 'B'], ['EXAM-001', 'STU-009', 78, 78, 'B+'],
    ['EXAM-001', 'STU-010', 55, 55, 'C+'], ['EXAM-001', 'STU-011', 94, 94, 'A+'],
    ['EXAM-001', 'STU-012', 71, 71, 'B'],
  ];
  const insertMarks = db.prepare('INSERT OR IGNORE INTO marks (assessment_id, student_id, raw_marks, adjusted_marks, grade_letter) VALUES (?,?,?,?,?)');
  marksMath5.forEach(m => insertMarks.run(...m));

  // Marks for EXAM-003 (Grade 9A Science — published)
  const marksSci9 = [
    ['EXAM-003', 'STU-013', 72, 72, 'B+'], ['EXAM-003', 'STU-014', 88, 88, 'A'],
    ['EXAM-003', 'STU-015', 45, 45, 'C'], ['EXAM-003', 'STU-016', 91, 91, 'A+'],
    ['EXAM-003', 'STU-017', 63, 63, 'B'], ['EXAM-003', 'STU-018', 79, 79, 'B+'],
  ];
  marksSci9.forEach(m => insertMarks.run(...m));

  // ------ Staff Attendance for September 2026 (partial) ------
  const sept2026Days = [];
  for (let d = 1; d <= 30; d++) {
    const day = String(d).padStart(2, '0');
    const dateStr = `2026-09-${day}`;
    const dow = new Date(dateStr).getDay();
    if (dow !== 0) sept2026Days.push(dateStr); // skip Sundays
  }
  
  const insertStaffAttendance = db.prepare('INSERT OR IGNORE INTO staff_attendance (staff_id, date, status, clock_in, clock_out) VALUES (?,?,?,?,?)');
  staffMembers.forEach(staff => {
    sept2026Days.forEach(date => {
      // Give some staff a few absences
      let status = 'PRESENT';
      if (staff[0] === 'STF-003' && (date === '2026-09-10' || date === '2026-09-11' || date === '2026-09-12')) {
        status = 'ON_LEAVE';
      } else if (staff[0] === 'STF-005' && date === '2026-09-22') {
        status = 'ABSENT';
      }
      const clockIn = status === 'PRESENT' ? '08:00' : null;
      const clockOut = status === 'PRESENT' ? '15:30' : null;
      insertStaffAttendance.run(staff[0], date, status, clockIn, clockOut);
    });
  });

  console.log('  ✅ Seed data loaded successfully');
}

module.exports = { seed };
