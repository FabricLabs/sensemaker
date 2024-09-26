'use strict';

module.exports = async function (req, res) {
  console.debug('[SENSEMAKER]', 'Deleting file from matter...');
  try {
    const file = await this.db('matters_files').select('file_id').where('id', req.params.idFile).first();
    const updateMatter = await this.db('matters_files')
      .where({ id: req.params.idFile })
      .update({
        updated_at: new Date(),
        deleted: 1,
      });
    const updateFiles = await this.db('files')
      .where({ id: file.file_id })
      .update({
        updated_at: new Date(),
        deleted: 1,
      });
    const updateDocuments = await this.db('documents')
      .where({ file_id: file.file_id })
      .update({
        updated_at: new Date(),
        deleted: 1,
      });
    res.send({
      message: 'File deleted successfully!'
    });
  } catch (exception) {
    console.debug('[SENSEMAKER]', 'Error deleting file in matter:', exception);
    res.status(503);
    return res.send({
      type: 'ContextMatterError',
      content: exception
    });
  }
};
