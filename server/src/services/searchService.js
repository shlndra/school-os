/**
 * Unified Multi-Domain Search Service for School OS.
 * Strictly enforces parameterization, wildcard escaping, input bounds,
 * and role-based access control (RBAC).
 */

class SearchService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Escapes SQL LIKE wildcards (% and _) and the escape character (\).
   */
  escapeLike(str) {
    return str.replace(/([%_\\])/g, '\\$1');
  }

  /**
   * Executes unified cross-domain search.
   *
   * @param {Object} params
   * @param {string} params.query - Search query string
   * @param {Object} params.actor - Authenticated actor with permissions
   * @param {number} [params.limit=10] - Items per domain (1-50)
   * @param {number} [params.page=1] - 1-based page number
   * @param {string[]} [params.entities] - Specific entities to query
   */
  search({ query, actor, limit = 10, page = 1, entities = null }) {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const trimmed = query.trim();
    if (trimmed.length > 100) {
      throw new Error('Search query cannot exceed 100 characters');
    }

    const safeLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (safePage - 1) * safeLimit;

    const escaped = this.escapeLike(trimmed);
    const pattern = `%${escaped}%`;

    const permissions = actor.permissions;
    const requestedEntities = Array.isArray(entities) && entities.length > 0
      ? entities.map(e => e.toLowerCase())
      : ['students', 'staff', 'fees', 'admissions', 'store'];

    const results = {
      students: [],
      staff: [],
      fees: [],
      admissions: [],
      store: []
    };

    let totalMatches = 0;

    // 1. Students Domain
    if (requestedEntities.includes('students') && permissions.canSearchStudents) {
      const { items, count } = this.searchStudents(pattern, safeLimit, offset);
      results.students = items;
      totalMatches += count;
    }

    // 2. Staff HR Domain
    if (requestedEntities.includes('staff') && permissions.canSearchStaff) {
      const { items, count } = this.searchStaff(pattern, safeLimit, offset, permissions.canViewStaffSalary);
      results.staff = items;
      totalMatches += count;
    }

    // 3. Fees & Invoices Domain
    if (requestedEntities.includes('fees') && permissions.canSearchFees) {
      const { items, count } = this.searchFees(pattern, safeLimit, offset, permissions.canViewFeeAmounts);
      results.fees = items;
      totalMatches += count;
    }

    // 4. Admissions Pipeline Domain
    if (requestedEntities.includes('admissions') && permissions.canSearchAdmissions) {
      const { items, count } = this.searchAdmissions(pattern, safeLimit, offset, permissions.canViewAdmissionsConfidential);
      results.admissions = items;
      totalMatches += count;
    }

    // 5. Campus Store & POS Domain
    if (requestedEntities.includes('store') && permissions.canSearchStore) {
      const { items, count } = this.searchStore(pattern, safeLimit, offset);
      results.store = items;
      totalMatches += count;
    }

    return {
      query: trimmed,
      actor: {
        id: actor.id,
        role: actor.role,
        department: actor.department
      },
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalMatches
      },
      results
    };
  }

  searchStudents(pattern, limit, offset) {
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM students
      WHERE status = 'ACTIVE'
        AND (
          id LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR (first_name || ' ' || COALESCE(last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR grade LIKE ? ESCAPE '\\' COLLATE NOCASE
        )
    `);

    const selectStmt = this.db.prepare(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        (first_name || ' ' || COALESCE(last_name, '')) as name,
        grade, 
        section, 
        status, 
        admission_date,
        photo_url
      FROM students
      WHERE status = 'ACTIVE'
        AND (
          id LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR (first_name || ' ' || COALESCE(last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR grade LIKE ? ESCAPE '\\' COLLATE NOCASE
        )
      ORDER BY grade, section, first_name
      LIMIT ? OFFSET ?
    `);

    const count = countStmt.get(pattern, pattern, pattern, pattern, pattern).total;
    const rows = selectStmt.all(pattern, pattern, pattern, pattern, pattern, limit, offset);

    const items = rows.map(s => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.grade} - Sec ${s.section || 'A'}`,
      category: 'students',
      actionUrl: `classroom?studentId=${s.id}`,
      meta: {
        grade: s.grade,
        section: s.section,
        status: s.status,
        admissionDate: s.admission_date
      }
    }));

    return { items, count };
  }

  searchStaff(pattern, limit, offset, canViewSalary) {
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM staff
      WHERE status = 'ACTIVE'
        AND (
          id LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR (first_name || ' ' || COALESCE(last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR role LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR department LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR subject LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR phone LIKE ? ESCAPE '\\'
        )
    `);

    // Strict field projection: salary is explicitly omitted unless authorized
    const selectSql = canViewSalary
      ? `
        SELECT 
          id, 
          first_name, 
          last_name, 
          (first_name || ' ' || COALESCE(last_name, '')) as name,
          role, 
          department, 
          subject, 
          phone, 
          email, 
          base_salary,
          status
        FROM staff
        WHERE status = 'ACTIVE'
          AND (
            id LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR (first_name || ' ' || COALESCE(last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR role LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR department LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR subject LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR phone LIKE ? ESCAPE '\\'
          )
        ORDER BY department, role, first_name
        LIMIT ? OFFSET ?
      `
      : `
        SELECT 
          id, 
          first_name, 
          last_name, 
          (first_name || ' ' || COALESCE(last_name, '')) as name,
          role, 
          department, 
          subject, 
          phone, 
          email, 
          NULL as base_salary,
          status
        FROM staff
        WHERE status = 'ACTIVE'
          AND (
            id LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR (first_name || ' ' || COALESCE(last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR role LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR department LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR subject LIKE ? ESCAPE '\\' COLLATE NOCASE
            OR phone LIKE ? ESCAPE '\\'
          )
        ORDER BY department, role, first_name
        LIMIT ? OFFSET ?
      `;

    const selectStmt = this.db.prepare(selectSql);
    const count = countStmt.get(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern).total;
    const rows = selectStmt.all(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, limit, offset);

    const items = rows.map(s => {
      const item = {
        id: s.id,
        title: s.name,
        subtitle: `${s.role} • ${s.department || 'Operations'}${s.subject ? ' (' + s.subject + ')' : ''}`,
        category: 'staff',
        actionUrl: `staff?staffId=${s.id}`,
        meta: {
          role: s.role,
          department: s.department,
          subject: s.subject,
          phone: s.phone,
          email: s.email
        }
      };

      if (canViewSalary && s.base_salary != null) {
        item.meta.baseSalary = s.base_salary;
      }

      return item;
    });

    return { items, count };
  }

  searchFees(pattern, limit, offset, canViewAmounts) {
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM fee_invoices f
      JOIN students s ON f.student_id = s.id
      WHERE (
        f.id LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR f.student_id LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR f.description LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR s.first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR s.last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR (s.first_name || ' ' || COALESCE(s.last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
      )
    `);

    const selectStmt = this.db.prepare(`
      SELECT 
        f.id,
        f.student_id,
        f.description,
        f.total_amount,
        f.paid_amount,
        (f.total_amount - f.paid_amount) as balance,
        f.due_date,
        f.status,
        (s.first_name || ' ' || COALESCE(s.last_name, '')) as student_name,
        s.grade,
        s.section
      FROM fee_invoices f
      JOIN students s ON f.student_id = s.id
      WHERE (
        f.id LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR f.student_id LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR f.description LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR s.first_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR s.last_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR (s.first_name || ' ' || COALESCE(s.last_name, '')) LIKE ? ESCAPE '\\' COLLATE NOCASE
      )
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const count = countStmt.get(pattern, pattern, pattern, pattern, pattern, pattern).total;
    const rows = selectStmt.all(pattern, pattern, pattern, pattern, pattern, pattern, limit, offset);

    const items = rows.map(inv => {
      const item = {
        id: inv.id,
        title: `${inv.description} — ${inv.student_name}`,
        subtitle: `Invoice #${inv.id} • ${inv.grade} • Status: ${inv.status}`,
        category: 'fees',
        actionUrl: `fees?invoiceId=${inv.id}`,
        meta: {
          studentId: inv.student_id,
          studentName: inv.student_name,
          grade: inv.grade,
          dueDate: inv.due_date,
          status: inv.status
        }
      };

      if (canViewAmounts) {
        item.meta.totalAmount = inv.total_amount;
        item.meta.paidAmount = inv.paid_amount;
        item.meta.balance = inv.balance;
      }

      return item;
    });

    return { items, count };
  }

  searchAdmissions(pattern, limit, offset, canViewConfidential) {
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM admissions
      WHERE (
        id LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR applicant_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR target_grade LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR status LIKE ? ESCAPE '\\' COLLATE NOCASE
      )
    `);

    const selectStmt = this.db.prepare(`
      SELECT 
        id,
        applicant_name,
        target_grade,
        status,
        documents_verified,
        guardian_name,
        guardian_phone,
        interview_score,
        interview_notes,
        created_at
      FROM admissions
      WHERE (
        id LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR applicant_name LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR target_grade LIKE ? ESCAPE '\\' COLLATE NOCASE
        OR status LIKE ? ESCAPE '\\' COLLATE NOCASE
      )
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const count = countStmt.get(pattern, pattern, pattern, pattern).total;
    const rows = selectStmt.all(pattern, pattern, pattern, pattern, limit, offset);

    const items = rows.map(adm => {
      const item = {
        id: adm.id,
        title: adm.applicant_name,
        subtitle: `Application #${adm.id} • ${adm.target_grade} • Status: ${adm.status}`,
        category: 'admissions',
        actionUrl: `admissions?applicantId=${adm.id}`,
        meta: {
          targetGrade: adm.target_grade,
          status: adm.status,
          documentsVerified: Boolean(adm.documents_verified),
          createdAt: adm.created_at
        }
      };

      if (canViewConfidential) {
        item.meta.guardianName = adm.guardian_name;
        item.meta.guardianPhone = adm.guardian_phone;
        item.meta.interviewScore = adm.interview_score;
        item.meta.interviewNotes = adm.interview_notes;
      }

      return item;
    });

    return { items, count };
  }

  searchStore(pattern, limit, offset) {
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM pos_items
      WHERE is_active = 1
        AND (
          id LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR category LIKE ? ESCAPE '\\' COLLATE NOCASE
        )
    `);

    const selectStmt = this.db.prepare(`
      SELECT 
        id,
        name,
        category,
        price,
        stock,
        is_active
      FROM pos_items
      WHERE is_active = 1
        AND (
          id LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR category LIKE ? ESCAPE '\\' COLLATE NOCASE
        )
      ORDER BY category, name
      LIMIT ? OFFSET ?
    `);

    const count = countStmt.get(pattern, pattern, pattern).total;
    const rows = selectStmt.all(pattern, pattern, pattern, limit, offset);

    const items = rows.map(item => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.category} • ₹${item.price} • Stock: ${item.stock}`,
      category: 'store',
      actionUrl: `store?itemId=${item.id}`,
      meta: {
        category: item.category,
        price: item.price,
        stock: item.stock
      }
    }));

    return { items, count };
  }
}

module.exports = SearchService;
