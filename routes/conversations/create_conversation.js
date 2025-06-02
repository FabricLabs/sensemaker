'use strict';

module.exports = async (req, res) => {
  res.format({
    json: async () => {
      const { title, description } = req.body;
      if (!title) return res.status(400).json({ error: 'Title is required' });

      const inserted = await this.db('conversations').insert({
        title: req.body.title,
        description: req.body.description,
        user_id: req.user.id,
        created_at: new Date(),
        updated_at: new Date()
      });

      const conversation = await this.db('conversations').where('id', inserted[0]).first();
      res.json(conversation);
    }
  });
};