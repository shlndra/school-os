const assert = require('assert');
const { getDb } = require('../src/db/database');
const SearchService = require('../src/services/searchService');
const AuthService = require('../src/services/authService');
const { resolveAuth } = require('../src/middleware/auth');

async function runTests() {
  console.log('🧪 Starting School OS Verified Identity & Search Security Test Suite...\n');
  const db = getDb();
  const authService = new AuthService(db);
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
  // 1. Server-Side Identity Verification & Anti-Spoofing Tests
  // ---------------------------------------------------------------------------
  console.log('--- 1. Server-Side Identity Verification & Anti-Spoofing ---');

  test('Valid session token correctly resolves identity and role from SQLite database', () => {
    const actor = authService.validateToken('dev-token-principal-meera');
    assert(actor !== null, 'Should validate pre-seeded principal token');
    assert.strictEqual(actor.id, 'STF-001');
    assert.strictEqual(actor.name, 'Meera Iyer');
    assert.strictEqual(actor.role, 'Principal');
    assert.strictEqual(actor.permissions.canViewStaffSalary, true);
    assert.strictEqual(actor.permissions.canSearchFees, true);
  });

  test('Teacher token strictly resolves to Teacher role and permissions', () => {
    const actor = authService.validateToken('dev-token-teacher-sunita');
    assert(actor !== null, 'Should validate pre-seeded teacher token');
    assert.strictEqual(actor.id, 'STF-003');
    assert.strictEqual(actor.role, 'Teacher');
    assert.strictEqual(actor.permissions.canViewStaffSalary, false, 'Teacher must not view salary');
    assert.strictEqual(actor.permissions.canSearchFees, false, 'Teacher must not search fees');
    assert.strictEqual(actor.permissions.canSearchAdmissions, false, 'Teacher must not search admissions');
  });

  test('Privilege escalation attempt: passing "x-user-role: Principal" with Teacher token is IGNORED', () => {
    let nextCalled = false;
    const req = {
      headers: {
        'authorization': 'Bearer dev-token-teacher-sunita',
        'x-user-role': 'Principal',          // FORGERY ATTEMPT
        'x-actor-role': 'Executive'          // FORGERY ATTEMPT
      },
      app: { locals: { authService, db } }
    };
    const res = {};
    resolveAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Middleware should proceed with valid token');
    assert.strictEqual(req.actor.role, 'Teacher', 'Role MUST remain Teacher; forged header must be ignored');
    assert.strictEqual(req.actor.id, 'STF-003');
    assert.strictEqual(req.actor.permissions.canViewStaffSalary, false);
    assert.strictEqual(req.actor.permissions.canSearchFees, false);

    // Verify search results reflect Teacher permissions, not Principal
    const searchRes = searchService.search({ query: 'Sharma', actor: req.actor });
    assert.strictEqual(searchRes.results.fees.length, 0, 'Fees must remain hidden');
    assert.strictEqual(searchRes.results.admissions.length, 0, 'Admissions must remain hidden');
    for (const s of searchRes.results.staff) {
      assert.strictEqual(s.meta.baseSalary, undefined, 'Salary must remain masked');
    }
  });

  test('Impersonation attempt: passing "x-user-id: STF-001" with Teacher token does NOT change identity', () => {
    let nextCalled = false;
    const req = {
      headers: {
        'authorization': 'Bearer dev-token-teacher-sunita',
        'x-user-id': 'STF-001' // IMPERSONATION ATTEMPT
      },
      app: { locals: { authService, db } }
    };
    const res = {};
    resolveAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.actor.id, 'STF-003', 'Actor ID must match session owner, not header');
    assert.strictEqual(req.actor.name, 'Sunita Devi');
    assert.strictEqual(req.actor.role, 'Teacher');
  });

  test('Unauthenticated request (missing token) is rejected with 401 AUTH_REQUIRED', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      headers: {},
      app: { locals: { authService, db } }
    };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    resolveAuth(req, res, () => {});

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.code, 'AUTH_REQUIRED');
  });

  test('Unauthenticated request with only "x-user-role: Principal" is rejected with 401', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      headers: { 'x-user-role': 'Principal' },
      app: { locals: { authService, db } }
    };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    resolveAuth(req, res, () => {});

    assert.strictEqual(statusCode, 401, 'Client cannot authenticate via role header alone');
    assert.strictEqual(jsonBody.code, 'AUTH_REQUIRED');
  });

  test('Invalid / fabricated session token is rejected with 401 AUTH_INVALID_TOKEN', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      headers: { 'authorization': 'Bearer fake-malicious-token-12345' },
      app: { locals: { authService, db } }
    };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    resolveAuth(req, res, () => {});

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.code, 'AUTH_INVALID_TOKEN');
  });

  test('Expired session token is rejected with 401 AUTH_INVALID_TOKEN', () => {
    // Insert an expired token
    const expiredToken = 'expired-token-test-123';
    db.prepare(`
      INSERT OR REPLACE INTO auth_sessions (token, staff_id, expires_at)
      VALUES (?, 'STF-001', '2020-01-01T00:00:00.000Z')
    `).run(expiredToken);

    let statusCode = null;
    let jsonBody = null;
    const req = {
      headers: { 'authorization': `Bearer ${expiredToken}` },
      app: { locals: { authService, db } }
    };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };
    resolveAuth(req, res, () => {});

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.code, 'AUTH_INVALID_TOKEN');
  });

  test('Dynamic session creation via createSession() generates verified crypto token', () => {
    const session = authService.createSession('STF-007', 12);
    assert(session.token.startsWith('sk_'), 'Token should be prefixed');
    assert.strictEqual(session.staffId, 'STF-007');
    assert.strictEqual(session.user.role, 'Accountant');

    // Validate the newly created token
    const actor = authService.validateToken(session.token);
    assert(actor !== null);
    assert.strictEqual(actor.id, 'STF-007');
    assert.strictEqual(actor.role, 'Accountant');
    assert.strictEqual(actor.permissions.canSearchFees, true);
    assert.strictEqual(actor.permissions.canSearchAdmissions, false);

    // Clean up
    authService.revokeSession(session.token);
    assert.strictEqual(authService.validateToken(session.token), null, 'Revoked token should be null');
  });

  // ---------------------------------------------------------------------------
  // 2. Data Protection & RBAC Matrix Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Data Protection & Role Domain Scoping ---');

  const principalActor = authService.validateToken('dev-token-principal-meera');
  const teacherActor = authService.validateToken('dev-token-teacher-sunita');
  const accountantActor = authService.validateToken('dev-token-accountant-anita');

  test('Principal has full cross-domain visibility including staff salaries', () => {
    const res = searchService.search({ query: 'Sharma', actor: principalActor });
    assert(res.results.students.length > 0, 'Principal sees students');
    assert(res.results.staff.length > 0, 'Principal sees staff');
    const staffSalary = res.results.staff.find(s => s.meta.baseSalary !== undefined);
    assert(staffSalary, 'Principal must see staff salary');
  });

  test('Teacher cannot access Fee Invoices or Admissions pipeline', () => {
    const res = searchService.search({ query: 'Sharma', actor: teacherActor });
    assert.strictEqual(res.results.fees.length, 0, 'Fees must be hidden from Teacher');
    assert.strictEqual(res.results.admissions.length, 0, 'Admissions must be hidden from Teacher');
  });

  test('Accountant can view Fee Invoices with amounts, but not admissions notes', () => {
    const res = searchService.search({ query: 'Fee', actor: accountantActor });
    assert.strictEqual(res.results.admissions.length, 0, 'Admissions must be hidden from Accountant');
    if (res.results.fees.length > 0) {
      assert(res.results.fees[0].meta.totalAmount !== undefined, 'Accountant must see totalAmount');
      assert(res.results.fees[0].meta.balance !== undefined, 'Accountant must see balance');
    }
  });

  // ---------------------------------------------------------------------------
  // 3. SQL Injection Resistance Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. SQL Injection Resistance ---');

  test('SQL injection payload "\' OR \'1\'=\'1" returns 0 records', () => {
    const res = searchService.search({ query: "' OR '1'='1", actor: principalActor });
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  test('Destructive SQL payload "\'; DROP TABLE students; --" is neutral and causes no schema alteration', () => {
    const res = searchService.search({ query: "'; DROP TABLE students; --", actor: principalActor });
    assert.strictEqual(res.results.students.length, 0);

    const count = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
    assert(count > 0, 'Students table must remain completely intact');
  });

  test('UNION SELECT payload is safely evaluated as string literal', () => {
    const res = searchService.search({ query: "x' UNION SELECT id, first_name FROM staff --", actor: principalActor });
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 4. Wildcard Escaping & Sanitization Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Wildcard Escaping & Sanitization ---');

  test('Percent sign "%" is escaped and does not wildcard all rows', () => {
    const res = searchService.search({ query: '%%', actor: principalActor });
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  test('Underscore "_" is escaped and does not match arbitrary single characters', () => {
    const res = searchService.search({ query: '__', actor: principalActor });
    assert.strictEqual(res.results.students.length, 0);
    assert.strictEqual(res.results.staff.length, 0);
  });

  test('Backslash "\\" does not cause SQL syntax error', () => {
    const res = searchService.search({ query: 'test\\escape', actor: principalActor });
    assert.strictEqual(res.results.students.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 5. Input Validation & Bounding Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Input Validation & Bounding ---');

  test('Empty or whitespace query throws validation error', () => {
    assert.throws(() => {
      searchService.search({ query: '   ', actor: principalActor });
    }, /at least 2 characters/);
  });

  test('Query shorter than 2 characters throws validation error', () => {
    assert.throws(() => {
      searchService.search({ query: 'a', actor: principalActor });
    }, /at least 2 characters/);
  });

  test('Query exceeding 100 characters throws validation error', () => {
    const longQuery = 'x'.repeat(101);
    assert.throws(() => {
      searchService.search({ query: longQuery, actor: principalActor });
    }, /cannot exceed 100 characters/);
  });

  // ---------------------------------------------------------------------------
  // 6. Pagination & Limit Bounding Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Pagination & Limit Bounding ---');

  test('Limit bounds result count per domain', () => {
    const res = searchService.search({ query: 'Grade', actor: principalActor, limit: 3 });
    assert(res.results.students.length <= 3, 'Must return at most 3 students');
    assert.strictEqual(res.pagination.limit, 3);
  });

  test('Limit is clamped to maximum 50', () => {
    const res = searchService.search({ query: 'Grade', actor: principalActor, limit: 500 });
    assert.strictEqual(res.pagination.limit, 50);
  });

  test('Pagination offset returns non-overlapping subsequent pages', () => {
    const page1 = searchService.search({ query: 'Grade', actor: principalActor, limit: 2, page: 1 });
    const page2 = searchService.search({ query: 'Grade', actor: principalActor, limit: 2, page: 2 });

    if (page1.results.students.length > 0 && page2.results.students.length > 0) {
      assert.notStrictEqual(
        page1.results.students[0].id,
        page2.results.students[0].id,
        'Page 1 and Page 2 should not start with identical record'
      );
    }
  });

  // ---------------------------------------------------------------------------
  // 7. Cross-Entity Search Results Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Cross-Entity Search Results ---');

  test('Searching "Sharma" returns both matching students and staff', () => {
    const res = searchService.search({ query: 'Sharma', actor: principalActor });
    const hasStudentSharma = res.results.students.some(s => s.title.includes('Sharma'));
    const hasStaffSharma = res.results.staff.some(s => s.title.includes('Sharma'));

    assert.strictEqual(hasStudentSharma, true);
    assert.strictEqual(hasStaffSharma, true);
  });

  test('Searching "Notebook" finds matching stationery items by title', () => {
    const res = searchService.search({ query: 'Notebook', actor: principalActor });
    assert(res.results.store.length > 0);
    assert(res.results.store[0].title.toLowerCase().includes('notebook'));
  });

  test('Searching "Uniform" finds POS items in UNIFORM category', () => {
    const res = searchService.search({ query: 'Uniform', actor: principalActor });
    assert(res.results.store.length > 0);
    assert.strictEqual(res.results.store[0].meta.category, 'UNIFORM');
  });

  test('Entity filter limits search to requested entity only', () => {
    const res = searchService.search({
      query: 'Sharma',
      actor: principalActor,
      entities: ['students']
    });

    assert(res.results.students.length > 0, 'Students should be returned');
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
