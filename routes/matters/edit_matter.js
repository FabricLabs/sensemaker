'use strict';

module.exports = async function (req, res) {
  console.debug('[NOVO]', 'Adding context to matter...');
  try {
    const { title, description, plaintiff, defendant, representing, jurisdiction_id, court_id } = req.body;
    const update = await this.db('matters')
      .where({ id: req.params.id })
      .update({
        title: title,
        description: description,
        plaintiff: plaintiff,
        defendant: defendant,
        representing: representing,
        jurisdiction_id: jurisdiction_id,
        court_id: court_id,
        updated_at: new Date(),
      });
    res.send({
      message: 'Matter edited successfully!'
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
