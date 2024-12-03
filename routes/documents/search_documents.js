'use strict';

module.exports = async function (req, res, next) {
    const request = req.body;
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
};
