'use strict';

module.exports = async function (req, res, next) {
  const request = req.body;
  request.user = { id: req.user.id };

  try {
    const documents = await this._searchDocuments(request);
    const result = {
      documents: documents || []
    };

    console.debug('[SENSEMAKER]', '[HTTP]', 'Search Documents:', request);
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
