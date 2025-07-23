'use strict';

module.exports = async function (req, res, next) {
  try {
    const { id } = req.params;

    const alert = await this.db('alerts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await this.db('alerts')
      .where({ id })
      .delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};