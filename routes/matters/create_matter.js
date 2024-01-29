'use strict';

module.exports = async function (req, res, next) {
  try {
    const request = req.body;
    const insert = await this.db('matters').insert({
      creator: req.user.id,
      title: request.title,
      description: request.description
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
