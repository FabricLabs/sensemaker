'use strict';

//route to edit a conversation title
module.exports = function (req, res, next) {
  const { title } = req.body;
  res.format({
    json:async () => {
      try {
        const conversationEditing = await this.db('conversations')
        .where({
          id: req.params.id,
          creator_id: req.user.id  // validates if the user editing is the creator of the conversation
        }).first();
    
        if (!conversationEditing) {
          return res.status(401).json({ message: 'Invalid conversation.' });
        }
    
        // Update the conversation's title in the database
        await this.db('conversations').where('id', req.params.id).update({
          title: title
        });
    
        return res.json({
          message: 'Title edited successfully.',
        });
      } catch (error) {
        console.error('Error editing title: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    }
  })
};
