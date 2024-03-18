'use strict';

module.exports = async function (req, res, next) {
  try {
    const request = req.body;
    const documents = await this._searchDocuments(request);
    const result = {
      documents: documents || []
    };

    return res.send({
      type: 'SearchDocumentsResult',
      content: result,
      results: documents
    });
  } catch (exception) {
    res.status(503);
    return res.send({
      type: 'SearchDocumentsError',
      content: exception
    });
  }
};
