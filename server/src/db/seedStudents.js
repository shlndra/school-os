const { getDb } = require('./database');
const db = getDb();

// 1. Add class sections for Grade 1 through 10 (A and B)
const grades = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
];

const insertSection = db.prepare('INSERT OR IGNORE INTO class_sections (id, grade, section, capacity, room_number) VALUES (?,?,?,?,?)');
grades.forEach((g, idx) => {
  const num = idx + 1;
  insertSection.run('CLS-' + num + 'A', g, 'A', 35, 'Room ' + (100 + num));
  insertSection.run('CLS-' + num + 'B', g, 'B', 35, 'Room ' + (200 + num));
});

// 2. Realistic student names
const firstNamesBoy = [
  'Aarav', 'Vivaan', 'Reyansh', 'Aditya', 'Vihaan', 'Arjun', 'Kabir', 'Rohan',
  'Ishaan', 'Dhruv', 'Siddharth', 'Pranav', 'Dev', 'Shaurya', 'Aayush', 'Harsh',
  'Krishna', 'Advait', 'Atharv', 'Shiv', 'Aryan', 'Samar', 'Tanish', 'Karan',
  'Rudra', 'Manan', 'Yash', 'Ansh', 'Parth', 'Nirvaan', 'Ranveer', 'Neil',
  'Hridaan', 'Ayush', 'Rishi', 'Darsh', 'Madhav', 'Kavish', 'Varun', 'Vedant'
];

const firstNamesGirl = [
  'Ananya', 'Diya', 'Saanvi', 'Aanya', 'Myra', 'Kiara', 'Navya', 'Riya',
  'Anika', 'Tara', 'Siya', 'Isha', 'Ishita', 'Tanvi', 'Meera', 'Bhavya',
  'Kritika', 'Avani', 'Nisha', 'Sneha', 'Pari', 'Prisha', 'Aditi', 'Trisha',
  'Rhea', 'Anvi', 'Anaya', 'Shanaya', 'Sara', 'Ahana', 'Charvi', 'Dia',
  'Gia', 'Naveli', 'Samaira', 'Zoya', 'Nandini', 'Veda', 'Kavya', 'Palak'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Nair',
  'Joshi', 'Mehta', 'Bansal', 'Agarwal', 'Choudhury', 'Banerjee', 'Kapoor',
  'Malhotra', 'Bhat', 'Saxena', 'Desai', 'Tiwari', 'Bhatia', 'Mishra',
  'Dubey', 'Chopra', 'Gill', 'Khurana', 'Dhawan', 'Soni', 'Seth', 'Rao'
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Check current student count
const currentCount = db.prepare('SELECT count(*) as c FROM students').get().c;
console.log('Current student count in DB:', currentCount);

const targetNew = Math.max(210, 230 - currentCount);

const insertStudent = db.prepare(`
  INSERT INTO students (id, first_name, last_name, date_of_birth, gender, blood_group, grade, section, admission_date, wallet_balance, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
`);

const insertGuardian = db.prepare(`
  INSERT INTO guardians (id, student_id, name, relation, phone, email, is_primary)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

let created = 0;
const startIdx = currentCount + 10;

for (let i = 0; i < targetNew; i++) {
  const isBoy = (i % 2 === 0);
  const firstName = isBoy 
    ? firstNamesBoy[i % firstNamesBoy.length]
    : firstNamesGirl[i % firstNamesGirl.length];
  const lastName = lastNames[(i * 3 + Math.floor(i / 7)) % lastNames.length];
  
  const idNum = startIdx + i;
  const studentId = 'STU-' + String(idNum).padStart(3, '0');
  
  // Grade distribution across Grade 1 to 10
  const gradeIdx = i % grades.length;
  const grade = grades[gradeIdx];
  const section = (i % 4 < 2) ? 'A' : 'B';
  
  // Realistic age based on grade
  const birthYear = 2020 - gradeIdx;
  const birthMonth = String((i % 12) + 1).padStart(2, '0');
  const birthDay = String((i % 28) + 1).padStart(2, '0');
  const dob = `${birthYear}-${birthMonth}-${birthDay}`;
  
  const gender = isBoy ? 'Male' : 'Female';
  const blood = bloodGroups[i % bloodGroups.length];
  const wallet = 500 + ((i * 75) % 3500);
  
  insertStudent.run(
    studentId, firstName, lastName, dob, gender, blood, grade, section, '2026-04-01', wallet
  );
  
  // Guardian
  const guardianRelation = (i % 3 === 0) ? 'Mother' : 'Father';
  const guardianTitle = (guardianRelation === 'Mother') ? 'Mrs. ' : 'Mr. ';
  const guardianName = guardianTitle + (guardianRelation === 'Mother' ? firstNamesGirl[(i + 5) % firstNamesGirl.length] : firstNamesBoy[(i + 3) % firstNamesBoy.length]) + ' ' + lastName;
  const phone = '98' + String(10000000 + ((i * 3719) % 89999999));
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@parent.school.edu`;
  
  insertGuardian.run(
    'GRD-' + studentId, studentId, guardianName, guardianRelation, phone, email
  );
  
  created++;
}

console.log('Seeded new students:', created);
const totalNow = db.prepare("SELECT count(*) as c FROM students WHERE status='ACTIVE'").get().c;
console.log('Total ACTIVE students now:', totalNow);

// 3. Seed today attendance for all active students (94% present)
const today = new Date().toISOString().split('T')[0];
const allStudents = db.prepare("SELECT id FROM students WHERE status='ACTIVE'").all();
const insertAttendance = db.prepare(`
  INSERT OR REPLACE INTO student_attendance (student_id, date, status, marked_by)
  VALUES (?, ?, ?, 'Teacher')
`);

allStudents.forEach((s, idx) => {
  const status = (idx % 23 === 0) ? 'ABSENT' : (idx % 17 === 0) ? 'LATE' : 'PRESENT';
  insertAttendance.run(s.id, today, status);
});

console.log('Marked attendance for today:', allStudents.length, 'students');

// 4. Seed bus transport assignments across routes
const routes = db.prepare('SELECT id FROM bus_routes').all();
const stops = db.prepare('SELECT id, route_id FROM bus_stops').all();
const insertTransport = db.prepare('INSERT OR REPLACE INTO student_transport (student_id, route_id, stop_id) VALUES (?,?,?)');

allStudents.slice(0, 120).forEach((s, idx) => {
  const route = routes[idx % routes.length];
  const routeStops = stops.filter(st => st.route_id === route.id);
  const stop = routeStops[idx % routeStops.length] || routeStops[0];
  if (stop) {
    insertTransport.run(s.id, route.id, stop.id);
  }
});
console.log('Assigned 120 students to Gurgaon / NCR bus routes');

// 5. Seed diverse admissions pipeline entries
const pendingAdmissions = [
  ['ADM-201', 'Reyansh Malhotra', '2020-05-12', 'Grade 1', 'Siddharth Malhotra', '9811223344', 'siddharth@example.com', 'ENQUIRY_RECEIVED'],
  ['ADM-202', 'Navya Saxena', '2018-09-22', 'Grade 3', 'Gaurav Saxena', '9811334455', 'gaurav@example.com', 'DOCUMENTS_PENDING'],
  ['ADM-203', 'Aditi Singhania', '2016-11-04', 'Grade 5', 'Pooja Singhania', '9811445566', 'pooja@example.com', 'DOCUMENTS_VERIFIED'],
  ['ADM-204', 'Aryan Deshmukh', '2014-03-18', 'Grade 7', 'Rohit Deshmukh', '9811556677', 'rohit@example.com', 'INTERVIEW_SCHEDULED'],
  ['ADM-205', 'Samaira Chawla', '2012-07-29', 'Grade 9', 'Anand Chawla', '9811667788', 'anand@example.com', 'OFFER_EXTENDED']
];

const insertAdm = db.prepare(`
  INSERT OR IGNORE INTO admissions (id, applicant_name, date_of_birth, target_grade, guardian_name, guardian_phone, guardian_email, status)
  VALUES (?,?,?,?,?,?,?,?)
`);
pendingAdmissions.forEach(a => insertAdm.run(...a));
console.log('Seeded pending admissions pipeline');
