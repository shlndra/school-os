const crypto = require('crypto');
const { ROLE_ALIASES, ROLE_PERMISSIONS } = require('../middleware/authConstants');

class AuthService {
  constructor(db) {
    this.db = db;
    this.ensureDevelopmentSessions();
  }

  /**
   * Pre-seeds persistent development session tokens for local development personas.
   * Strictly restricted to non-production environments.
   */
  ensureDevelopmentSessions() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    try {
      const devSessions = [
        ['dev-token-principal-meera', 'STF-001', '2099-12-31T23:59:59.000Z'],
        ['dev-token-teacher-sunita', 'STF-003', '2099-12-31T23:59:59.000Z'],
        ['dev-token-accountant-anita', 'STF-007', '2099-12-31T23:59:59.000Z'],
        ['dev-token-librarian-deepak', 'STF-011', '2099-12-31T23:59:59.000Z'],
      ];

      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO auth_sessions (token, staff_id, expires_at)
        VALUES (?, ?, ?)
      `);

      devSessions.forEach(([token, staffId, expiresAt]) => {
        // Verify staff exists before inserting session
        const staffExists = this.db.prepare('SELECT id FROM staff WHERE id = ?').get(staffId);
        if (staffExists) {
          stmt.run(token, staffId, expiresAt);
        }
      });
    } catch (err) {
      console.error('Warning: could not seed development sessions:', err.message);
    }
  }

  /**
   * Creates a cryptographically verified server-side session.
   *
   * @param {string} staffId - Valid staff member ID from staff table
   * @param {number} [durationHours=24] - Session validity duration
   * @returns {{ token: string, staffId: string, expiresAt: string, user: Object }}
   */
  createSession(staffId, durationHours = 24) {
    if (!staffId || typeof staffId !== 'string') {
      throw new Error('Valid staffId is required to create a session');
    }

    const staffMember = this.db.prepare(`
      SELECT id, first_name, last_name, role, department, status
      FROM staff
      WHERE id = ? AND status = 'ACTIVE'
    `).get(staffId.trim());

    if (!staffMember) {
      throw new Error(`Staff member "${staffId}" not found or inactive`);
    }

    const token = 'sk_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

    this.db.prepare(`
      INSERT INTO auth_sessions (token, staff_id, expires_at)
      VALUES (?, ?, ?)
    `).run(token, staffMember.id, expiresAt);

    const canonicalRole = ROLE_ALIASES[staffMember.role.toLowerCase()] || staffMember.role;

    return {
      token,
      staffId: staffMember.id,
      expiresAt,
      user: {
        id: staffMember.id,
        name: `${staffMember.first_name} ${staffMember.last_name || ''}`.trim(),
        role: canonicalRole,
        department: staffMember.department
      }
    };
  }

  /**
   * Validates a session token server-side and resolves the verified actor.
   * Derives role EXCLUSIVELY from the SQLite database.
   *
   * @param {string} token
   * @returns {Object|null} Verified actor object or null if invalid/expired
   */
  validateToken(token) {
    if (!token || typeof token !== 'string') return null;

    const trimmedToken = token.trim();
    if (trimmedToken.length < 8) return null;

    try {
      const session = this.db.prepare(`
        SELECT 
          s.token,
          s.staff_id,
          s.expires_at,
          st.first_name,
          st.last_name,
          st.role,
          st.department,
          st.status
        FROM auth_sessions s
        JOIN staff st ON s.staff_id = st.id
        WHERE s.token = ? AND st.status = 'ACTIVE'
      `).get(trimmedToken);

      if (!session) return null;

      // Check expiry
      if (new Date(session.expires_at).getTime() < Date.now()) {
        // Clean up expired session lazily
        try {
          this.db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(trimmedToken);
        } catch (_) {}
        return null;
      }

      const canonicalRole = ROLE_ALIASES[session.role.toLowerCase()] || session.role;
      const permissions = ROLE_PERMISSIONS[canonicalRole] || ROLE_PERMISSIONS['Teacher'];

      return {
        id: session.staff_id,
        name: `${session.first_name} ${session.last_name || ''}`.trim(),
        role: canonicalRole,
        department: session.department,
        permissions
      };
    } catch (err) {
      console.error('Session validation query error:', err);
      return null;
    }
  }

  /**
   * Revokes a session token.
   */
  revokeSession(token) {
    if (!token) return false;
    const info = this.db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token.trim());
    return info.changes > 0;
  }
}

module.exports = AuthService;
