'use strict';

module.exports = async (req, res) => {
  res.format({
    json: async () => {
      const { title, description, context } = req.body;
      if (!title) return res.status(400).json({ error: 'Title is required' });

      const insertData = {
        title: req.body.title,
        description: req.body.description,
        user_id: req.user.id,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add context if provided
      if (context) {
        insertData.context = JSON.stringify(context);
      }

      const inserted = await this.db('conversations').insert(insertData);
      const conversation = await this.db('conversations').where('id', inserted[0]).first();
      res.json(conversation);
    }
  });
};