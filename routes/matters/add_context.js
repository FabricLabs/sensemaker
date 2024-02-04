'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Adding context to matter...');
  try {
    const { note, filename, id } = req.body;
    console.log("DATOS", note,file,id);
    const update = await this.db('matters')
      .where({ id: id })
      .update({
        note: note,
        file: filename,
        updated_at: new Date(),
      });

    res.send({
      message: 'Context added successfully!'
    });
  } catch (exception) {
    console.debug('[NOVO]', 'Error editing matter:', exception);
    res.status(503);
    return res.send({
      type: 'ContextMatterError',
      content: exception
    });
  }
};
