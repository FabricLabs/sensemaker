'use strict';

module.exports = function (req, res)  {
  const fabricID = req.params.fabricID;
  res.format({
    json: async () => {
      try {
        const document = await this.db('documents')
          .where({ fabric_id: req.params.fabricID })
          .andWhere(function() {
            this.where('creator', '=', req.user.id).orWhere('owner', '=', req.user.id);
          })
          .first();

        if (!document) {
          return res.status(404).json({ message: 'Document not found or access denied.' });
        }

        // update the document status to deleted from the documents list
        const documentDeleteStatus = await this.db('documents')
          .where({ fabric_id: req.params.fabricID })
          .andWhere(function() {
            this.where('creator', '=', req.user.id).orWhere('owner', '=', req.user.id);
          })
          .update({
            updated_at: new Date(),
            status: 'deleted',
          });

        if (!documentDeleteStatus) {
          return res.status(500).json({ message: 'Error deleting the document.' });
        }

        res.send({
          message: 'document deleted successfully!'
        });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    }
  })
};
