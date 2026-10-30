'use strict';

module.exports = async function (req, res) {
  try {
    const { fabricID, commitID } = req.params;

    const isAdmin = await this._userHasAdminAccess(req);

    // First verify the user has access to the document
    let query = this.db('documents')
      .where('fabric_id', fabricID)
      .andWhere('status', '!=', 'deleted');

    // If not admin, restrict to documents where user is creator/owner or document is source-created
    if (!isAdmin) {
      const userId = req.user && req.user.id;
      query = query.andWhere(function () {
        // Source-created documents (no creator, no owner) are visible to all.
        this.where(function () {
          this.whereNull('creator').whereNull('owner');
        });
        if (userId) {
          this.orWhere('creator', '=', userId)
            .orWhere('owner', '=', userId);
        }
      });
    }

    const document = await query.first();

    if (!document) {
      return res.status(404).send({
        status: 'error',
        message: 'Document not found or access denied.'
      });
    }

    let history = [];
    try {
      history = typeof document.history === 'string' ? JSON.parse(document.history) : (document.history || []);
    } catch (parseError) {
      history = [];
    }
    if (!Array.isArray(history) || !history.map(String).includes(String(commitID))) {
      return res.status(404).send({
        status: 'error',
        message: 'Commit not found.'
      });
    }

    // Retrieve commit blob
    const commit = await this.db('blobs')
      .where('fabric_id', commitID)
      .where('mime_type', 'application/json')
      .first();

    if (!commit) {
      return res.status(404).send({
        status: 'error',
        message: 'Commit not found.'
      });
    }

    // Parse the commit data
    let commitData;
    try {
      commitData = JSON.parse(commit.content);
    } catch (parseError) {
      return res.status(500).send({
        status: 'error',
        message: 'Invalid commit data format.'
      });
    }

    // Validate commit structure
    if (!commitData.timestamp || !commitData.content) {
      return res.status(500).send({
        status: 'error',
        message: 'Commit missing required fields.'
      });
    }

    return res.send({
      id: commitID,
      timestamp: commitData.timestamp,
      parent: commitData.parent,
      content: commitData.content
    });

  } catch (exception) {
    console.error('[GET_COMMIT] Error:', exception);
    return res.status(503).send({
      type: 'GetCommitError',
      content: exception.message || exception
    });
  }
};
