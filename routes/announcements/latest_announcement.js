'use strict';

module.exports = async function (req, res, next) {
  try {
    const latestAnnouncement = await this.db('announcements')
      .select('*')
      .orderBy('created_at', 'desc')
      .first();

    if (!latestAnnouncement) {
      return res.status(404).json({ message: 'No announcement found.' });
    }

    res.json(latestAnnouncement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
