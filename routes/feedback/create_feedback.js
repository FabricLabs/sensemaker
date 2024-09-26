'use strict';

module.exports = async function (req, res) {
  console.debug('[SENSEMAKER]', 'Creating feedback...');
  try {
    const { comment, conversation_id, relates_to } = req.body;
    const insert = await this.db('feedback').insert({
      creator: req.user.id,
      content: comment,
      conversation_id: conversation_id,
      relates_to: relates_to,
    });

    return res.send({
      message: 'Feedback successfully sent',
    });
  } catch (exception) {
    console.debug('[SENSEMAKER]', 'Error creating feedback:', exception);
    res.status(503);
    return res.send({
      type: 'CreateFeedbackError',
      content: exception
    });
  }
};
