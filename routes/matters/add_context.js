'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Adding context to matter...');
  try {
    const { note, filename } = req.body;
    if(note){
      const insertNote = await this.db('matters_notes').insert({
        content: note,
        matter_id: req.params.id ,
      });
    }
    if(filename){
      const insertFile = await this.db('matters_files').insert({
        filename: filename,
        matter_id: req.params.id ,
      });
    }

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
