'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Deleting file from matter...');
  try {
    const update = await this.db('matters')
      .where({ id: req.params.id })
      .update({
        file: null,
        updated_at: new Date(),
      });
    //TO DO: 
    //delete the actual file from server
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
