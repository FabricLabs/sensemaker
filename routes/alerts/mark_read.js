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

    const [updatedAlert] = await this.db('alerts')
      .where({ id })
      .update({
        read: true,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedAlert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};