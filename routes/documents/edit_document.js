'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Editing document:', req.params.fabricID);
  try {
    const { title } = req.body;
    const update = await this.db('documents')
      .where({ fabric_id: req.params.fabricID })
      .update({
        title: title,
        updated_at: new Date(),
      });

    const document = await this.db('documents').where('fabric_id', req.params.fabricID).orderBy('created_at', 'desc').first();
    res.send(document);
  } catch (exception) {
    console.debug('[NOVO]', 'Error editing document:', exception);
    res.status(503);
    return res.send({
      type: 'EditDocumentError',
      content: exception
    });
  }
};
