'use strict';

module.exports = async function (req, res, next) {
  try {
    const triggers = await this.db('triggers')
      .select('*', this.db.raw('fabric_id as id'))
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    res.json(triggers);
  } catch (error) {
    console.error('Error fetching triggers:', error);
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
}; 