'use strict';

module.exports = async function (req, res, next) {
  try {
    const { id } = req.params;
    const { title, message, type, topic, trigger, read } = req.body;

    const alert = await this.db('alerts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updates = {
      ...(title && { title }),
      ...(message && { message }),
      ...(type && { type }),
      ...(topic && { topic }),
      ...(trigger && { trigger }),
      ...(typeof read === 'boolean' && { read }),
      updated_at: new Date()
    };

    const [updatedAlert] = await this.db('alerts')
      .where({ id })
      .update(updates)
      .returning('*');

    res.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
}; 