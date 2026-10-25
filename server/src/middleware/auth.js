const VALID_ROLES = [
  'Principal',
  'Academic Coordinator',
  'Teacher',
  'Registrar',
  'Accountant',
  'Librarian',
  'Parent',
  'Student'
];

// Map case-insensitive common names and aliases to canonical roles from RBAC_HITL_MATRIX.md
const ROLE_ALIASES = {
  'principal': 'Principal',
  'executive': 'Principal',
  'admin': 'Principal',
  'administrator': 'Principal',
  'academic coordinator': 'Academic Coordinator',
  'coordinator': 'Academic Coordinator',
  'teacher': 'Teacher',
  'faculty': 'Teacher',
  'accountant': 'Accountant',
  'bursar': 'Accountant',
  'finance': 'Accountant',
  'registrar': 'Registrar',
  'admissions': 'Registrar',
  'librarian': 'Librarian',
  'transport': 'Librarian',
  'nurse': 'Librarian',
  'guard': 'Librarian',
  'parent': 'Parent',
  'guardian': 'Parent',
  'student': 'Student'
};

const ROLE_PERMISSIONS = {
  'Principal': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: true,
    canSearchFees: true,
    canViewFeeAmounts: true,
    canSearchAdmissions: true,
    canViewAdmissionsConfidential: true,
    canSearchStore: true
  },
  'Academic Coordinator': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Teacher': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Registrar': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: true,
    canViewAdmissionsConfidential: true,
    canSearchStore: true
  },
  'Accountant': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: true,
    canSearchFees: true,
    canViewFeeAmounts: true,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Librarian': {
    canSearchStudents: true,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Parent': {
    canSearchStudents: false,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  },
  'Student': {
    canSearchStudents: false,
    canSearchStaff: true,
    canViewStaffSalary: false,
    canSearchFees: false,
    canViewFeeAmounts: false,
    canSearchAdmissions: false,
    canViewAdmissionsConfidential: false,
    canSearchStore: true
  }
};

/**
 * Authentication and RBAC Resolution Middleware.
 * Reuses existing staff schema and RBAC_HITL_MATRIX roles.
 * Resolves actor from:
 *   1. x-user-id header (verified against staff table in SQLite)
 *   2. x-user-role / x-actor-role header (validated against RBAC matrix)
 *   3. req.user object if pre-populated
 */
function resolveAuth(req, res, next) {
  const db = req.app.locals.db;
  const userId = req.headers['x-user-id'];
  const roleHeader = req.headers['x-user-role'] || req.headers['x-actor-role'];

  // Case 1: Verified Staff ID lookup in SQLite
  if (userId && db) {
    try {
      const staffMember = db.prepare(`
        SELECT id, first_name, last_name, role, department, status
        FROM staff
        WHERE id = ? AND status = 'ACTIVE'
      `).get(userId.trim());

      if (staffMember) {
        const canonicalRole = ROLE_ALIASES[staffMember.role.toLowerCase()] || staffMember.role;
        req.actor = {
          id: staffMember.id,
          name: `${staffMember.first_name} ${staffMember.last_name || ''}`.trim(),
          role: canonicalRole,
          department: staffMember.department,
          permissions: ROLE_PERMISSIONS[canonicalRole] || ROLE_PERMISSIONS['Teacher']
        };
        return next();
      } else {
        return res.status(401).json({
          error: 'Unauthorized: Staff ID not found or inactive',
          code: 'AUTH_INVALID_USER_ID'
        });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Auth lookup error: ' + err.message });
    }
  }

  // Case 2: Role header specification
  if (roleHeader) {
    const normalized = ROLE_ALIASES[roleHeader.trim().toLowerCase()];
    if (!normalized || !VALID_ROLES.includes(normalized)) {
      return res.status(400).json({
        error: `Invalid role specified: "${roleHeader}". Valid roles: ${VALID_ROLES.join(', ')}`,
        code: 'AUTH_INVALID_ROLE'
      });
    }

    req.actor = {
      id: 'HEADER_ACTOR',
      name: `${normalized} User`,
      role: normalized,
      department: null,
      permissions: ROLE_PERMISSIONS[normalized]
    };
    return next();
  }

  // Case 3: Pre-populated req.user
  if (req.user && req.user.role) {
    const normalized = ROLE_ALIASES[req.user.role.trim().toLowerCase()] || req.user.role;
    if (VALID_ROLES.includes(normalized)) {
      req.actor = {
        id: req.user.id || 'SESSION_USER',
        name: req.user.name || `${normalized} User`,
        role: normalized,
        department: req.user.department || null,
        permissions: ROLE_PERMISSIONS[normalized]
      };
      return next();
    }
  }

  // Case 4: No credentials provided
  return res.status(401).json({
    error: 'Authentication required. Specify x-user-role or x-user-id header.',
    code: 'AUTH_REQUIRED',
    supportedRoles: VALID_ROLES
  });
}

module.exports = {
  resolveAuth,
  VALID_ROLES,
  ROLE_ALIASES,
  ROLE_PERMISSIONS
};
