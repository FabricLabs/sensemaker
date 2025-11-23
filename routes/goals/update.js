'use strict';

module.exports = async function updateGoal (req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { preimage_sha256 } = req.params;
    const { title, description, priority, status, target_date, category } = req.body;

    if (!preimage_sha256) {
      return res.status(400).json({ error: 'Goal preimage_sha256 is required' });
    }

    // Check if goal exists and determine scope
    const userGoals = await this.getGoals(req.user.id);
    let goalExists = userGoals.find(g => g.preimage_sha256 === preimage_sha256);
    let user_id = req.user.id;

    // If not found in user goals, check global goals (admin only)
    if (!goalExists) {
      const isAdmin = req.user.username === 'admin'; // Adjust this based on your admin logic
      if (isAdmin) {
        const globalGoals = await this.getGoals(null);
        goalExists = globalGoals.find(g => g.preimage_sha256 === preimage_sha256);
        if (goalExists) {
          user_id = null; // This is a global goal
        }
      }
    }

    if (!goalExists) {
      return res.status(404).json({
        error: 'Goal not found or you do not have permission to update it',
        preimage_sha256: preimage_sha256
      });
    }

    // Prepare updates object (only include defined fields)
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (target_date !== undefined) updates.target_date = target_date;
    if (category !== undefined) updates.category = category;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No updates provided',
        available_fields: ['title', 'description', 'priority', 'status', 'target_date', 'category']
      });
    }

    const updatedGoal = await this.updateGoal(preimage_sha256, updates, user_id);

    console.debug('[GOALS]', `Updated ${user_id ? 'user' : 'global'} goal:`, updatedGoal.id);

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(200).json({
          success: true,
          goal: updatedGoal,
          old_preimage_sha256: preimage_sha256,
          new_preimage_sha256: updatedGoal.preimage_sha256,
          message: 'Goal updated successfully'
        });
      }
    });

  } catch (error) {
    console.error('[GOALS]', 'Error updating goal:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update goal',
      details: error.message
    });
  }
};
