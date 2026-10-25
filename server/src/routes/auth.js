const router = require('express').Router();
const { resolveAuth } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Prototype authentication endpoint to issue cryptographically verified session tokens.
 * In production, this verifies institutional passwords or SAML/OIDC SSO assertions.
 */
router.post('/login', (req, res) => {
  try {
    const authService = req.app.locals.authService;
    const { staffId } = req.body;

    if (!staffId || typeof staffId !== 'string') {
      return res.status(400).json({ error: 'Field "staffId" is required' });
    }

    const session = authService.createSession(staffId.trim());
    res.json({
      message: 'Authentication successful',
      token: session.token,
      expiresAt: session.expiresAt,
      user: session.user
    });
  } catch (err) {
    res.status(401).json({ error: err.message, code: 'AUTH_FAILED' });
  }
});

/**
 * GET /api/auth/me
 * Returns verified session details for the calling actor.
 */
router.get('/me', resolveAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.actor.id,
      name: req.actor.name,
      role: req.actor.role,
      department: req.actor.department
    }
  });
});

/**
 * POST /api/auth/logout
 * Revokes active session token.
 */
router.post('/logout', resolveAuth, (req, res) => {
  try {
    const authService = req.app.locals.authService;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : req.headers['x-session-token'];

    authService.revokeSession(token);
    res.json({ message: 'Session successfully revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
