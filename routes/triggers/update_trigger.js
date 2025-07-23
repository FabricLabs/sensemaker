'use strict';

module.exports = async function (req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, type, config, active } = req.body;

    const trigger = await this.db('triggers')
      .select('*', this.db.raw('fabric_id as id'))
      .where({ fabric_id: id, user_id: req.user.id })
      .first();

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    // Validate trigger type if provided
    if (type) {
      const validTypes = ['threshold', 'schedule', 'event', 'keyword', 'topic'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid trigger type' });
      }
    }

    // Validate config if provided
    if (config) {
      const triggerType = type || trigger.type;
      if (triggerType === 'threshold') {
        if (!config.value || !config.condition) {
          return res.status(400).json({ error: 'Threshold triggers require value and condition' });
        }
      } else if (triggerType === 'schedule') {
        if (!config.cron || !config.timezone) {
          return res.status(400).json({ error: 'Schedule triggers require cron and timezone' });
        }
      } else if (triggerType === 'event') {
        if (!config.event_type) {
          return res.status(400).json({ error: 'Event triggers require event_type' });
        }
      } else if (triggerType === 'keyword') {
        if (!config.keywords || !Array.isArray(config.keywords)) {
          return res.status(400).json({ error: 'Keyword triggers require an array of keywords' });
        }
      } else if (triggerType === 'topic') {
        if (!config.topic) {
          return res.status(400).json({ error: 'Topic triggers require a topic' });
        }
      }
    }

    // Prepare updates object
    const updates = {
      ...(name && { name }),
      ...(description && { description }),
      ...(type && { type }),
      ...(config && { config: JSON.stringify(config) }), // Ensure config is stored as JSON string
      ...(typeof active === 'boolean' && { active }),
      updated_at: new Date()
    };

    // Update the trigger
    await this.db('triggers')
      .where({ fabric_id: id })
      .update(updates);

    // Fetch the updated trigger
    const updatedTrigger = await this.db('triggers')
      .select('*', this.db.raw('fabric_id as id'))
      .where({ fabric_id: id })
      .first();

    // Parse the config JSON string back to an object if it's a string
    if (updatedTrigger.config && typeof updatedTrigger.config === 'string') {
      try {
        updatedTrigger.config = JSON.parse(updatedTrigger.config);
      } catch (e) {
        console.error('Error parsing trigger config:', e);
        // If parsing fails, keep the original config
      }
    }

    res.json(updatedTrigger);
  } catch (error) {
    console.error('Error updating trigger:', error);
    res.status(500).json({ error: 'Failed to update trigger' });
  }
};