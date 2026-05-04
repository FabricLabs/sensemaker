'use strict';

module.exports = function (req, res) {
  res.format({
    json: async () => {
      if (!(await this._assertSensemakerAdminJson(req, res))) return;

      try {
        const invitations = await this.db('invitations').select('*').orderBy('created_at', 'desc').limit(100);
        res.send(invitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  })
};
