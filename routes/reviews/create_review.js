'use strict';

module.exports = async function (req, res, next) {
  // TODO: check token
  const request = req.body;

  try {
    await this.db('reviews').insert({
      creator: req.user.id,
      rating: request.rating,
      comment: request.comment,
      intended_sentiment: (request.thumbsUpClicked) ? 'positive' : 'negative',
      message_id: request.message
    });

    return res.send({
      type: 'ReviewMessageResult',
      content: {
        message: 'Success!',
        status: 'success'
      }
    });
  } catch (exception) {
    return res.send({
      type: 'ReviewMessageError',
      content: exception
    });
  }
};
