'use strict';

module.exports = async function (req, res, next) {
  const inquiries = await this.db('inquiries').select('id');
  const invitations = await this.db('invitations').select('id').from('invitations');
  const stats = {
    ingestions: {
      remaining: 0,
      complete: 0
    },
    inquiries: {
      total: inquiries.length
    },
    invitations: {
      total: invitations.length
    }
  };

  res.send(stats);
};
