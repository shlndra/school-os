const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { seed } = require('./seeds');

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DB_PATH = path.join(__dirname, '..', '..', 'data', 'school.db');
const DB_PATH = isVercel ? path.join('/tmp', 'school.db') : LOCAL_DB_PATH;

let db = null;

function getDb() {
  if (db) return db;
  
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // On Vercel, copy pre-seeded database to writable /tmp if not yet copied
  if (isVercel && !fs.existsSync(DB_PATH) && fs.existsSync(LOCAL_DB_PATH)) {
    try {
      fs.copyFileSync(LOCAL_DB_PATH, DB_PATH);
      console.log('📦 Pre-seeded School OS database copied to /tmp');
    } catch (e) {
      console.error('Failed copying database to /tmp:', e);
    }
  }

  const isNew = !fs.existsSync(DB_PATH);
  db = new Database(DB_PATH);
  
  // Enable WAL or DELETE mode depending on environment
  if (isVercel) {
    db.pragma('journal_mode = DELETE');
  } else {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');

  if (isNew) {
    console.log('🏫 Creating School OS database...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
    console.log('  ✅ Schema created');
    
    console.log('🌱 Seeding school data...');
    seed(db);
  } else {
    console.log('🏫 Connected to existing School OS database');
  }

  ensureIndexes(db);

  return db;
}

function ensureIndexes(database) {
  try {
    database.exec(`
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

      CREATE TABLE IF NOT EXISTS auth_sessions (
        token TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        FOREIGN KEY (staff_id) REFERENCES staff(id)
      );
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_exp ON auth_sessions(token, expires_at);
    `);
  } catch (err) {
    console.error('Warning: could not ensure search indexes and auth tables:', err.message);
  }
}

function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    // Clean WAL and SHM files too
    const walPath = DB_PATH + '-wal';
    const shmPath = DB_PATH + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  }
  return getDb();
}

module.exports = { getDb, resetDb };
