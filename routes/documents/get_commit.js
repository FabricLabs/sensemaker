'use strict';

module.exports = async function (req, res) {
  try {
    const { fabricID, commitID } = req.params;

    // First verify the user has access to the document
    const document = await this.db('documents')
      .where('fabric_id', fabricID)
      .andWhere('status', '!=', 'deleted')
      .andWhere(function () {
        this.where('creator', '=', req.user.id).orWhere('owner', '=', req.user.id);
      })
      .first();

    if (!document) {
      return res.status(404).send({ 
        status: 'error', 
        message: 'Document not found or access denied.' 
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
