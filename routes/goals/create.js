'use strict';

module.exports = async function createGoal (req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, priority, status, target_date, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required',
        required: ['title', 'description']
      });
    }

    const goalData = {
      title,
      description,
      priority: priority || 'medium',
      status: status || 'active',
      target_date,
      category: category || 'general'
    };

    // Determine if this should be a global goal (admin only) or user goal
    const isAdmin = req.user.username === 'admin'; // Adjust this based on your admin logic
    const user_id = (isAdmin && req.body.global) ? null : req.user.id;

    const goal = await this.createGoal(goalData, user_id);

    console.debug('[GOALS]', `Created ${user_id ? 'user' : 'global'} goal:`, goal.id);

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(201).json({
          success: true,
          goal: goal,
          message: 'Goal created successfully'
        });
      }
    });

  } catch (error) {
    console.error('[GOALS]', 'Error creating goal:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create goal',
      details: error.message
    });
  }
};
