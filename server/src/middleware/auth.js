const { VALID_ROLES, ROLE_ALIASES, ROLE_PERMISSIONS } = require('./authConstants');

/**
 * Strict Server-Side Authentication & Identity Resolution Middleware.
 * 
 * SECURITY RULES:
 * 1. Role is EXCLUSIVELY resolved from the SQLite database via a verified session token.
 * 2. Client-supplied role headers (e.g. x-user-role, x-actor-role) are NEVER trusted or evaluated.
 * 3. Client-supplied identity headers (e.g. x-user-id) cannot be used to impersonate staff without a matching cryptographic token.
 * 4. Unauthenticated or invalid token requests receive HTTP 401 Unauthorized.
 */
function resolveAuth(req, res, next) {
  const authService = req.app.locals.authService;
  if (!authService) {
    return res.status(500).json({ error: 'Auth service is not initialized on server' });
  }

  // Extract session token from Authorization: Bearer <token> or x-session-token
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'].trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Provide a verified session token via Authorization: Bearer <token> or x-session-token header.',
      code: 'AUTH_REQUIRED'
    });
  }

  // Validate token against auth_sessions table in SQLite
  const actor = authService.validateToken(token);
  if (!actor) {
    return res.status(401).json({
      error: 'Invalid or expired session token.',
      code: 'AUTH_INVALID_TOKEN'
    });
  }

  // Attach verified actor to request.
  // Note: Any client-supplied x-user-role or x-user-id header is completely ignored.
  req.actor = actor;
  next();
}

module.exports = {
  resolveAuth,
  VALID_ROLES,
  ROLE_ALIASES,
  ROLE_PERMISSIONS
};
