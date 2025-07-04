'use strict';

module.exports = async function (req, res, next) {
  try {
    const { id } = req.params;

    const trigger = await this.db('triggers')
      .where({ id, user_id: req.user.id })
      .first();

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    await this.db('triggers')
      .where({ id })
      .delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting trigger:', error);
    res.status(500).json({ error: 'Failed to delete trigger' });
  }
};