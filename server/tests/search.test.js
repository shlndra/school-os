const assert = require('assert');
const { getDb } = require('../src/db/database');
const SearchService = require('../src/services/searchService');
const { resolveAuth, VALID_ROLES } = require('../src/middleware/auth');

async function runTests() {
  console.log('🧪 Starting School OS Search Architecture Test Suite...\n');
  const db = getDb();
  const searchService = new SearchService(db);

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Authorization & Role-Based Access Control (RBAC) Tests
  // ---------------------------------------------------------------------------
  console.log('--- 1. Authorization & RBAC Access Matrix ---');

  test('Teacher role CANNOT search Fees or Admissions pipeline', () => {
    const actor = {
      id: 'STF-003',
      role: 'Teacher',
      permissions: {
        canSearchStudents: true,
        canSearchStaff: true,
        canViewStaffSalary: false,
        canSearchFees: false,
        canViewFeeAmounts: false,
        canSearchAdmissions: false,
        canViewAdmissionsConfidential: false,
        canSearchStore: true
      }
    };

    const res = searchService.search({ query: 'Aarav', actor });
    assert.strictEqual(Array.isArray(res.results.students), true);
    assert.strictEqual(res.results.fees.length, 0, 'Fees must be empty for Teacher');
    assert.strictEqual(res.results.admissions.length, 0, 'Admissions must be empty for Teacher');
  });

  test('Teacher role CANNOT view staff salaries in search results', () => {
    const actor = {
      id: 'STF-003',
      role: 'Teacher',
      permissions: {
        canSearchStudents: true,
        canSearchStaff: true,
        canViewStaffSalary: false,
        canSearchFees: false,
        canSearchAdmissions: false,
        canSearchStore: true
      }
    };

    const res = searchService.search({ query: 'Sharma', actor });
    assert(res.results.staff.length > 0, 'Should find staff with Sharma');
    for (const staff of res.results.staff) {
      assert.strictEqual(staff.meta.baseSalary, undefined, 'Salary must NOT be exposed to Teacher');
    }
  });

  test('Principal role HAS full visibility across all 5 domains including salary', () => {
    const actor = {
      id: 'STF-001',
      role: 'Principal',
      permissions: {
        canSearchStudents: true,
        canSearchStaff: true,
        canViewStaffSalary: true,
        canSearchFees: true,
        canViewFeeAmounts: true,
        canSearchAdmissions: true,
        canViewAdmissionsConfidential: true,
        canSearchStore: true
      }
    };

    const res = searchService.search({ query: 'Sharma', actor });
    assert(res.results.staff.length > 0, 'Should find staff with Sharma');
    const staffWithSalary = res.results.staff.find(s => s.meta.baseSalary !== undefined);
    assert(staffWithSalary, 'Principal must be able to view staff salary');
  });

  test('Accountant role CAN view fee invoice amounts but NOT admissions notes', () => {
    const actor = {
      id: 'STF-007',
      role: 'Accountant',
      permissions: {
        canSearchStudents: true,
        canSearchStaff: true,
        canViewStaffSalary: true,
        canSearchFees: true,
        canViewFeeAmounts: true,
        canSearchAdmissions: false,
        canViewAdmissionsConfidential: false,
        canSearchStore: true
      }
    };

    const res = searchService.search({ query: 'Fee', actor });
    assert.strictEqual(res.results.admissions.length, 0, 'Accountant cannot see admissions');
    if (res.results.fees.length > 0) {
      assert(res.results.fees[0].meta.totalAmount !== undefined, 'Accountant must see fee amounts');
    }
  });

  test('Auth Middleware rejects requests missing credentials with 401', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: {}, app: { locals: { db } } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    resolveAuth(req, res, () => {});

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.code, 'AUTH_REQUIRED');
  });

  test('Auth Middleware rejects invalid roles with 400', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: { 'x-user-role': 'SuperHacker' }, app: { locals: { db } } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    resolveAuth(req, res, () => {});

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonBody.code, 'AUTH_INVALID_ROLE');
  });

  test('Auth Middleware resolves valid staff ID from database', () => {
    let nextCalled = false;
    const req = { headers: { 'x-user-id': 'STF-001' }, app: { locals: { db } } };
    const res = {};
    resolveAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.actor.id, 'STF-001');
    assert.strictEqual(req.actor.role, 'Principal');
    assert.strictEqual(req.actor.permissions.canViewStaffSalary, true);
  });

  // ---------------------------------------------------------------------------
  // 2. SQL Injection Resistance Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. SQL Injection Resistance ---');

  const adminActor = {
    id: 'STF-001',
    role: 'Principal',
    permissions: {
      canSearchStudents: true,
      canSearchStaff: true,
      canViewStaffSalary: true,
      canSearchFees: true,
      canViewFeeAmounts: true,
      canSearchAdmissions: true,
      canViewAdmissionsConfidential: true,
      canSearchStore: true
    }
  };

  test('SQL injection payload "\' OR \'1\'=\'1" does not return all records', () => {
    const res = searchService.search({ query: "' OR '1'='1", actor: adminActor });
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  test('Destructive payload "\'; DROP TABLE students; --" causes no corruption', () => {
    const res = searchService.search({ query: "'; DROP TABLE students; --", actor: adminActor });
    assert.strictEqual(res.results.students.length, 0);

    // Verify students table is still intact and readable
    const count = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
    assert(count > 0, 'Students table must remain completely intact');
  });

  test('UNION SELECT payload is safely treated as literal text', () => {
    const res = searchService.search({ query: "x' UNION SELECT id, first_name FROM staff --", actor: adminActor });
    assert.strictEqual(res.results.students.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 3. Wildcard & Escaping Handling Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Wildcard Escaping & Sanitization ---');

  test('Percent sign "%" is treated as literal and does not wildcard all rows', () => {
    // Two percent characters
    const res = searchService.search({ query: '%%', actor: adminActor });
    // Should only match if someone literally has "%%" in their name
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  test('Underscore "_" is treated as literal character and not single-character wildcard', () => {
    const res = searchService.search({ query: '__', actor: adminActor });
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  test('Backslash "\\" does not cause SQL syntax error', () => {
    const res = searchService.search({ query: 'test\\escape', actor: adminActor });
    assert.strictEqual(res.results.students.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 4. Input Validation & Bounding Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Input Validation & Bounding ---');

  test('Empty or whitespace query throws validation error', () => {
    assert.throws(() => {
      searchService.search({ query: '   ', actor: adminActor });
    }, /at least 2 characters/);
  });

  test('Query shorter than 2 characters throws validation error', () => {
    assert.throws(() => {
      searchService.search({ query: 'a', actor: adminActor });
    }, /at least 2 characters/);
  });

  test('Query exceeding 100 characters throws validation error', () => {
    const longQuery = 'a'.repeat(101);
    assert.throws(() => {
      searchService.search({ query: longQuery, actor: adminActor });
    }, /cannot exceed 100 characters/);
  });

  // ---------------------------------------------------------------------------
  // 5. Pagination & Limit Bounding Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Pagination & Limit Bounding ---');

  test('Limit bounds result count per domain', () => {
    const res = searchService.search({ query: 'Grade', actor: adminActor, limit: 3 });
    assert(res.results.students.length <= 3, 'Must return at most 3 students');
    assert.strictEqual(res.pagination.limit, 3);
  });

  test('Limit is clamped to maximum 50', () => {
    const res = searchService.search({ query: 'Grade', actor: adminActor, limit: 500 });
    assert.strictEqual(res.pagination.limit, 50, 'Limit must be clamped to 50');
  });

  test('Page offset returns distinct subsequent page records', () => {
    const page1 = searchService.search({ query: 'Grade', actor: adminActor, limit: 2, page: 1 });
    const page2 = searchService.search({ query: 'Grade', actor: adminActor, limit: 2, page: 2 });

    if (page1.results.students.length > 0 && page2.results.students.length > 0) {
      assert.notStrictEqual(
        page1.results.students[0].id,
        page2.results.students[0].id,
        'Page 1 and Page 2 should not start with identical student'
      );
    }
  });

  // ---------------------------------------------------------------------------
  // 6. Cross-Entity Search Results Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Cross-Entity Search Results ---');

  test('Searching "Sharma" finds both students and staff', () => {
    const res = searchService.search({ query: 'Sharma', actor: adminActor });
    const studentSharma = res.results.students.some(s => s.title.includes('Sharma'));
    const staffSharma = res.results.staff.some(s => s.title.includes('Sharma'));

    assert.strictEqual(studentSharma, true, 'Should find student with Sharma surname');
    assert.strictEqual(staffSharma, true, 'Should find staff with Sharma surname');
  });

  test('Searching "Uniform" finds POS items in UNIFORM category', () => {
    const res = searchService.search({ query: 'Uniform', actor: adminActor });
    assert(res.results.store.length > 0, 'Should find items matching UNIFORM category or name');
    assert.strictEqual(res.results.store[0].meta.category, 'UNIFORM');
  });

  test('Searching "Notebook" finds matching stationery items by title', () => {
    const res = searchService.search({ query: 'Notebook', actor: adminActor });
    assert(res.results.store.length > 0, 'Should find notebook in store');
    assert(res.results.store[0].title.toLowerCase().includes('notebook'));
  });

  test('Entity filter limits search to requested entity only', () => {
    const res = searchService.search({
      query: 'Sharma',
      actor: adminActor,
      entities: ['students']
    });

    assert(res.results.students.length > 0, 'Students should be searched');
    assert.strictEqual(res.results.staff.length, 0, 'Staff should be omitted');
    assert.strictEqual(res.results.fees.length, 0, 'Fees should be omitted');
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n========================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
