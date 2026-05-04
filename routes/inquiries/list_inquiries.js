'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      if (!(await this._assertSensemakerAdminJson(req, res))) return;
      try {
        const inquiries = await this.db('inquiries').select().orderBy('created_at', 'desc').limit(100);
        res.send(inquiries);
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
