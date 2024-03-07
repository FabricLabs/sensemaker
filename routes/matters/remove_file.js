'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Deleting file from matter...');
  try {
    const update = await this.db('matters_files')
      .where({ id: req.params.idFile })
      .update({
        updated_at: new Date(),
        deleted: 1,
      });
    res.send({
      message: 'File deleted successfully!'
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
