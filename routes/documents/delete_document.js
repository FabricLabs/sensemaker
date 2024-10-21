'use strict';

module.exports = function (req, res)  {
  const fabricID = req.params.fabricID;
  res.format({
    json:async() => {
      try {
        const document = await this.db.select('*').from('documents').where({ fabric_id: req.params.fabricID }).first();

        if (!document) {
          return res.status(404).json({ message: 'Invalid document' });
        }

        // update the document status to deleted from the documents list
        const documentDeleteStatus = await this.db('documents')
          .where({ fabric_id: req.params.fabricID })
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
