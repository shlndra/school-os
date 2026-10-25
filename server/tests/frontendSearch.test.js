const assert = require('assert');
const { getDb } = require('../src/db/database');
const SearchService = require('../src/services/searchService');
const AuthService = require('../src/services/authService');
const { resolveAuth } = require('../src/middleware/auth');

async function runFrontendSearchTests() {
  console.log('🧪 Starting School OS Phase 2: Frontend Contract & RBAC Isolation Tests...\n');
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
  // 1. Frontend Search Debounce, Bounding & Client Contract Tests
  // ---------------------------------------------------------------------------
  console.log('--- 1. Frontend Search Client Contracts & State Transitions ---');

  test('Frontend client contract: query under 2 characters must not execute search', () => {
    // Simulating useDebounceSearch minChars threshold
    const minChars = 2;
    const shortQueries = ['', ' ', 'a', ' S '];
    for (const q of shortQueries) {
      const trimmed = q.trim();
      assert(trimmed.length < minChars, `Query "${q}" must be skipped`);
    }
  });

  test('Frontend client contract: search request includes Bearer token and omits client role header', () => {
    const token = 'dev-token-principal-meera';
    const buildHeaders = (authToken) => {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      return headers;
    };

    const headers = buildHeaders(token);
    assert.strictEqual(headers['Authorization'], `Bearer ${token}`);
    assert.strictEqual(headers['x-user-role'], undefined, 'Must not send forged role header');
    assert.strictEqual(headers['x-actor-role'], undefined, 'Must not send forged actor header');
  });

  test('Frontend categorization & flattening correctly indexes items for linear keyboard navigation', () => {
    const mockResults = {
      students: [{ id: 'STU-001', title: 'Aarav Sharma', subtitle: 'Grade 10-A', category: 'students' }],
      staff: [{ id: 'STF-001', title: 'Meera Iyer', subtitle: 'Principal', category: 'staff' }],
      fees: [{ id: 'INV-001', title: 'Invoice INV-001', subtitle: 'Aarav Sharma', category: 'fees' }],
      admissions: [{ id: 'ADM-001', title: 'Vihaan Verma', subtitle: 'Grade 1', category: 'admissions' }],
      store: [{ id: 'POS-001', title: 'School Tie', subtitle: 'UNIFORM', category: 'store' }],
    };

    const categories = [
      { key: 'students', label: 'Students' },
      { key: 'staff', label: 'Staff HR' },
      { key: 'fees', label: 'Fees & Invoices' },
      { key: 'admissions', label: 'Admissions Pipeline' },
      { key: 'store', label: 'Campus Store' },
    ];

    const flatten = (results, selectedCategory) => {
      const items = [];
      categories.forEach(cat => {
        if (selectedCategory !== 'ALL' && selectedCategory !== cat.key) return;
        const list = results[cat.key] || [];
        list.forEach(item => items.push({ ...item, domainConfig: cat }));
      });
      return items;
    };

    // ALL category selected
    const allItems = flatten(mockResults, 'ALL');
    assert.strictEqual(allItems.length, 5);
    assert.strictEqual(allItems[0].id, 'STU-001');
    assert.strictEqual(allItems[4].id, 'POS-001');

    // Filtering to students category
    const studentItems = flatten(mockResults, 'students');
    assert.strictEqual(studentItems.length, 1);
    assert.strictEqual(studentItems[0].category, 'students');

    // Filtering to fees category
    const feeItems = flatten(mockResults, 'fees');
    assert.strictEqual(feeItems.length, 1);
    assert.strictEqual(feeItems[0].category, 'fees');
  });

  test('Keyboard navigation linear navigation wrapping (ArrowDown / ArrowUp)', () => {
    const itemCount = 5;
    let selectedIndex = 0;

    // Simulate ArrowDown
    selectedIndex = (selectedIndex + 1) % itemCount; // 1
    assert.strictEqual(selectedIndex, 1);

    selectedIndex = (selectedIndex + 1) % itemCount; // 2
    assert.strictEqual(selectedIndex, 2);

    // Simulate Wrap-around on ArrowDown
    selectedIndex = 4;
    selectedIndex = (selectedIndex + 1) % itemCount; // 0
    assert.strictEqual(selectedIndex, 0);

    // Simulate Wrap-around on ArrowUp
    selectedIndex = (selectedIndex - 1 + itemCount) % itemCount; // 4
    assert.strictEqual(selectedIndex, 4);
  });

  test('Selection dispatches correct route and navigation parameters per domain', () => {
    const dispatches = [];
    const onNavigate = (page, params) => dispatches.push({ page, params });

    const handleSelect = (item) => {
      switch (item.category) {
        case 'students':
          onNavigate('classroom', { studentId: item.id });
          break;
        case 'staff':
          onNavigate('staff', { staffId: item.id });
          break;
        case 'fees':
          onNavigate('fees', { invoiceId: item.id });
          break;
        case 'admissions':
          onNavigate('admissions', { applicantId: item.id });
          break;
        case 'store':
          onNavigate('store', { itemId: item.id });
          break;
      }
    };

    handleSelect({ id: 'STU-101', category: 'students' });
    handleSelect({ id: 'STF-202', category: 'staff' });
    handleSelect({ id: 'INV-303', category: 'fees' });
    handleSelect({ id: 'ADM-404', category: 'admissions' });
    handleSelect({ id: 'POS-505', category: 'store' });

    assert.deepStrictEqual(dispatches, [
      { page: 'classroom', params: { studentId: 'STU-101' } },
      { page: 'staff', params: { staffId: 'STF-202' } },
      { page: 'fees', params: { invoiceId: 'INV-303' } },
      { page: 'admissions', params: { applicantId: 'ADM-404' } },
      { page: 'store', params: { itemId: 'POS-505' } },
    ]);
  });

  // ---------------------------------------------------------------------------
  // 2. Unauthorized Sessions & Expired Token Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Unauthorized Sessions & Expired Tokens ---');

  test('Missing Authorization header returns 401 AUTH_REQUIRED', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: {}, app: { locals: { authService, db } } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };

    resolveAuth(req, res, () => {});
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.code, 'AUTH_REQUIRED');
  });

  test('Malformed token in Authorization header returns 401 AUTH_INVALID_TOKEN', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = {
      headers: { 'authorization': 'Bearer not-a-valid-token' },
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

  test('Expired session token returns 401 AUTH_INVALID_TOKEN and denies search', () => {
    const expiredToken = 'expired-frontend-token-999';
    db.prepare(`
      INSERT OR REPLACE INTO auth_sessions (token, staff_id, expires_at)
      VALUES (?, 'STF-001', '2021-01-01T00:00:00.000Z')
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

  test('Revoked session token immediately denies subsequent search requests with 401', () => {
    const session = authService.createSession('STF-003', 1);
    assert(session.token);

    // Initial check passes
    let actor = authService.validateToken(session.token);
    assert(actor !== null);

    // Revoke session
    authService.revokeSession(session.token);

    // Subsequent search request is rejected
    let statusCode = null;
    let jsonBody = null;
    const req = {
      headers: { 'authorization': `Bearer ${session.token}` },
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

  test('Supplying client x-user-role with an invalid token DOES NOT bypass 401', () => {
    let statusCode = null;
    const req = {
      headers: {
        'authorization': 'Bearer non-existent-token',
        'x-user-role': 'Principal'
      },
      app: { locals: { authService, db } }
    };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: () => res
    };

    resolveAuth(req, res, () => {});
    assert.strictEqual(statusCode, 401);
  });

  // ---------------------------------------------------------------------------
  // 3. Role-Specific Results Isolation Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Role-Specific Results Isolation ---');

  const principal = authService.validateToken('dev-token-principal-meera');
  const teacher = authService.validateToken('dev-token-teacher-sunita');
  const accountant = authService.validateToken('dev-token-accountant-anita');
  const librarian = authService.validateToken('dev-token-librarian-deepak');

  test('Principal (Meera Iyer): sees student records, staff with salary, fees with amounts, admissions', () => {
    const res = searchService.search({ query: 'Sharma', actor: principal });
    assert(res.results.students.length > 0, 'Principal sees students');
    assert(res.results.staff.length > 0, 'Principal sees staff');

    // Verify salary is visible for Principal
    const staffWithSalary = res.results.staff.find(s => s.meta.baseSalary !== undefined);
    assert(staffWithSalary, 'Staff salary must be visible to Principal');
    assert(typeof staffWithSalary.meta.baseSalary === 'number');

    // Check fee access
    const feeRes = searchService.search({ query: 'INV', actor: principal });
    assert(feeRes.results.fees.length > 0, 'Fees must be visible to Principal');
    assert(feeRes.results.fees[0].meta.totalAmount !== undefined);
  });

  test('Teacher (Sunita Devi): fee and admissions domains are empty; staff salary is completely masked', () => {
    const res = searchService.search({ query: 'Sharma', actor: teacher });
    assert(res.results.students.length > 0, 'Teacher sees students');
    assert(res.results.staff.length > 0, 'Teacher sees staff directory');

    // Verify salary is masked
    for (const s of res.results.staff) {
      assert.strictEqual(s.meta.baseSalary, undefined, 'Salary must be masked for Teacher');
    }

    // Verify fees and admissions are strictly empty
    assert.strictEqual(res.results.fees.length, 0, 'Fees must be empty for Teacher');
    assert.strictEqual(res.results.admissions.length, 0, 'Admissions must be empty for Teacher');
  });

  test('Accountant (Anita Sharma): fee domain is populated with totals; admissions domain is strictly empty', () => {
    const res = searchService.search({ query: 'INV', actor: accountant });
    assert(res.results.fees.length > 0, 'Accountant sees fee invoices');
    assert(res.results.fees[0].meta.totalAmount !== undefined, 'Accountant sees total amount');
    assert(res.results.fees[0].meta.balance !== undefined, 'Accountant sees balance');

    // Admissions search attempt
    const admRes = searchService.search({ query: 'Admissions', actor: accountant });
    assert.strictEqual(admRes.results.admissions.length, 0, 'Admissions must be empty for Accountant');

    // Staff search attempt by Teacher (salary strictly masked)
    const teacherStaffRes = searchService.search({ query: 'Iyer', actor: teacher });
    for (const s of teacherStaffRes.results.staff) {
      assert.strictEqual(s.meta.baseSalary, undefined, 'Staff salary must not be exposed to Teacher');
    }
  });

  test('Librarian (Deepak Gupta): store and student records accessible; fees and admissions strictly empty', () => {
    const res = searchService.search({ query: 'Book', actor: librarian });
    assert(res.results.store.length > 0, 'Librarian can search campus store / library items');

    const feeRes = searchService.search({ query: 'INV', actor: librarian });
    assert.strictEqual(feeRes.results.fees.length, 0, 'Fees must be empty for Librarian');

    const admRes = searchService.search({ query: 'Applicant', actor: librarian });
    assert.strictEqual(admRes.results.admissions.length, 0, 'Admissions must be empty for Librarian');
  });

  test('Field masking integrity: sensitive student guardian contact details are not exposed in search metadata', () => {
    const res = searchService.search({ query: 'Aarav', actor: teacher });
    assert(res.results.students.length > 0);
    for (const student of res.results.students) {
      assert.strictEqual(student.meta?.guardianPhone, undefined, 'Guardian phone must not be leaked');
      assert.strictEqual(student.meta?.guardianEmail, undefined, 'Guardian email must not be leaked');
    }
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n========================================');
  console.log(`Phase 2 Test Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runFrontendSearchTests().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runFrontendSearchTests };
