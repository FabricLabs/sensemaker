'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Deleting note from matter...');
  try {
    const update = await this.db('matters_notes')
      .where({ id: req.params.idNote })
      .update({
        deleted: 1,
      });
    res.send({
      message: 'Note deleted successfully!'
    });
  } catch (exception) {
    console.debug('[NOVO]', 'Error deleting file in matter:', exception);
    res.status(503);
    return res.send({
      type: 'ContextMatterError',
      content: exception
    });
  }
};
