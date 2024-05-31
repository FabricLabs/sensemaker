'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Editing document:', req.params.fabricID);
  try {
    const { document } = req.body;
    const update = await this.db('documents')
      .where({ fabric_id: req.params.fabricID })
      .update({
        //..update here..//
        updated_at: new Date(),
      });
    res.send({
      message: 'Document edited successfully!'
    });
  } catch (exception) {
    console.debug('[NOVO]', 'Error editing document:', exception);
    res.status(503);
    return res.send({
      type: 'EditDocumentError',
      content: exception
    });
  }
};
