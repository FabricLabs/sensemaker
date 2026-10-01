'use strict';

/**
 * SEARCH /documents — Fabric document search (vector-backed).
 * Body must be a JSON object: `{ "query": "<text>", ... }` (optional limit, filters later).
 */
module.exports = async function searchDocuments (req, res, next) {
  const body = req.body;

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      type: 'Error',
      content: 'Document search requires a JSON object body with a string `query` field.'
    });
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return res.status(400).json({
      type: 'Error',
      content: 'Missing or empty `query` for document search.'
    });
  }

  const request = Object.assign({}, body, {
    query,
    user: req.user && req.user.id != null ? { id: req.user.id } : undefined
  });

  try {
    const documents = await this._searchDocuments(request);
    const result = {
      documents: documents || []
    };

    console.debug('[SENSEMAKER]', '[HTTP]', 'Search Documents:', { query: request.query });
    console.debug('[SENSEMAKER]', '[HTTP]', 'Search Results:', result);

    return res.send({
      type: 'SearchDocumentsResult',
      content: result,
      results: documents
    });
  } catch (error) {
    console.error('[SENSEMAKER]', '[HTTP]', 'Error searching documents:', error);
    return res.status(500).send({
      type: 'Error',
      content: 'Error searching documents',
      error: error.message
    });
  }
};
