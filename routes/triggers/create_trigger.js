'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  try {
    const { name, description, type = 'keyword', config = {} } = req.body;
    console.debug('received:', { name, description, type, config }, req.body);

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate trigger type
    const validTypes = ['keyword', 'topic', 'threshold', 'schedule', 'event'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid trigger type' });
    }

    // Set default config based on type if not provided
    if (type === 'keyword' && !config.keywords) {
      config.keywords = [];
    } else if (type === 'topic' && !config.topic) {
      config.topic = '';
    } else if (type === 'threshold' && (!config.value || !config.condition)) {
      return res.status(400).json({ error: 'Threshold triggers require value and condition' });
    } else if (type === 'schedule' && (!config.cron || !config.timezone)) {
      return res.status(400).json({ error: 'Schedule triggers require cron and timezone' });
    } else if (type === 'event' && !config.event_type) {
      return res.status(400).json({ error: 'Event triggers require event_type' });
    }

    const now = new Date();
    const actor = new Actor({ created: now.toISOString(), content: req.body });
    await this.db('triggers')
      .insert({
        fabric_id: actor.id,
        user_id: req.user.id,
        name,
        description,
        type,
        config,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

    const trigger = await this.db('triggers')
      .select('*', this.db.raw('fabric_id as id'))
      .where({ fabric_id: actor.id })
      .first();

    res.json(trigger);
  } catch (error) {
    console.error('Error creating trigger:', error);
    res.status(500).json({ error: 'Failed to create trigger' });
  }
};
