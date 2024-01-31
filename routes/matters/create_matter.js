'use strict';

module.exports = async function (req, res) {
  try {
    // const request = req.body;
    const {title, description, plaintiff, defendant, representing, jurisdiction_id, court_id} = req.body;
    const insert = await this.db('matters').insert({
      creator: req.user.id,
      title: title,
      description: description,
      plaintiff: plaintiff,
      defendant: defendant,
      representing: representing,
      jurisdiction_id: jurisdiction_id,
      court_id: court_id,
    });

    const result = { id: insert[0] };

    return res.send({
      type: 'CreateMatterResult',
      content: result
    });
  } catch (exception) {
    res.status(503);
    return res.send({
      type: 'CreateMatterError',
      content: exception
    });
  }
};
