'use strict';

module.exports = async function (req, res, next) {
  try {
    const { title, message, type, topic, trigger } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const [alert] = await this.db('alerts').insert({
      user_id: req.user.id,
      title,
      message,
      type: type || 'info',
      topic: topic || null,
      trigger: trigger || null,
      read: false,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    res.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
}; 