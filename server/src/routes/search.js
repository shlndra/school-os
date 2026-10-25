const router = require('express').Router();
const { resolveAuth } = require('../middleware/auth');

/**
 * GET /api/search
 * Unified multi-domain search across students, staff, fees, admissions, and campus store.
 * Requires authentication header (x-user-role or x-user-id).
 */
router.get('/', resolveAuth, (req, res) => {
  try {
    const searchService = req.app.locals.searchService;
    if (!searchService) {
      return res.status(500).json({ error: 'Search service is not initialized' });
    }

    const { q, limit, page, entities } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and cannot be empty',
        code: 'SEARCH_EMPTY_QUERY'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Query parameter "q" must be at least 2 characters long',
        code: 'SEARCH_QUERY_TOO_SHORT'
      });
    }

    if (q.trim().length > 100) {
      return res.status(400).json({
        error: 'Query parameter "q" cannot exceed 100 characters',
        code: 'SEARCH_QUERY_TOO_LONG'
      });
    }

    let parsedEntities = null;
    if (entities && typeof entities === 'string') {
      parsedEntities = entities.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      const allowedEntities = ['students', 'staff', 'fees', 'admissions', 'store'];
      const invalid = parsedEntities.filter(e => !allowedEntities.includes(e));
      if (invalid.length > 0) {
        return res.status(400).json({
          error: `Invalid entity filter(s): ${invalid.join(', ')}. Allowed: ${allowedEntities.join(', ')}`,
          code: 'SEARCH_INVALID_ENTITIES'
        });
      }
    }

    const searchResponse = searchService.search({
      query: q,
      actor: req.actor,
      limit,
      page,
      entities: parsedEntities
    });

    res.json(searchResponse);
  } catch (err) {
    console.error('Search endpoint error:', err);
    res.status(500).json({
      error: 'An internal error occurred while processing the search request',
      message: err.message
    });
  }
});

module.exports = router;
