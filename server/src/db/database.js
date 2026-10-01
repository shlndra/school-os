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

  return db;
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
