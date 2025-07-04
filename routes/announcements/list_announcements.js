'use strict';

module.exports = async function (req, res, next) {
  try {
    const announcements = await this.db('announcements')
      .select('*')
      .where(function() {
        this.where('expiration_date', '>', new Date())
            .orWhereNull('expiration_date');
      })
      .orderBy('created_at', 'desc');

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
