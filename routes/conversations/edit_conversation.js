'use strict';

//route to edit a conversation (title, pinned status, etc.)
module.exports = function (req, res, next) {
  const { title, pinned } = req.body;
  
  res.format({
    json: async () => {
      try {
        const conversationEditing = await this.db('conversations')
          .where({
            id: req.params.id,
            creator_id: req.user.id  // validates if the user editing is the creator of the conversation
          }).first();
    
        if (!conversationEditing) {
          return res.status(404).json({ 
            error: 'Conversation not found or unauthorized' 
          });
        }
    
        // Build update object with only provided fields
        const updateFields = {
          updated_at: this.db.fn.now()
        };
        
        if (title !== undefined) {
          updateFields.title = title;
        }
        
        if (pinned !== undefined) {
          updateFields.pinned = pinned;
        }
        
        // Only proceed if there are fields to update
        if (Object.keys(updateFields).length === 1) { // Only updated_at
          return res.status(400).json({ 
            error: 'No valid fields provided for update',
            message: 'Please provide title or pinned status to update'
          });
        }
    
        // Update the conversation in the database
        await this.db('conversations')
          .where('id', req.params.id)
          .update(updateFields);
    
        // Build response message
        const updatedFields = [];
        if (title !== undefined) updatedFields.push('title');
        if (pinned !== undefined) updatedFields.push(pinned ? 'pinned' : 'unpinned');
        
        return res.json({
          success: true,
          message: `Conversation ${updatedFields.join(' and ')} successfully`,
          updated: updateFields
        });
        
      } catch (error) {
        console.error('Error editing conversation:', error);
        return res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to update conversation'
        });
      }
    }
  });
};
