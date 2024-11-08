'use strict';

module.exports = async function (req, res, next) {
  if (!req.user || !req.user.state?.roles?.includes('admin')) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const request = req.body;

  try {
    await this.db('announcements').insert({
      creator_id: req.user.id,
      title: (request.title) ? request.title : null,
      body: request.body,
      expiration_date: (request.expirationDate) ? request.expirationDate : null,
    });

    return res.send({
      type: 'announcementCreated',
      content: {
        message: 'Success!',
        status: 'success'
      }
    });
  } catch (exception) {
    return res.send({
      type: 'announcementError',
      content: exception
    });
  }
};
