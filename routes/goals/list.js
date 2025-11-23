'use strict';

module.exports = async function listGoals (req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get query parameters
    const { global, status, priority, category } = req.query;
    const isAdmin = req.user.username === 'admin'; // Adjust this based on your admin logic
    
    let goals = [];

    // Get user goals
    const userGoals = await this.getGoals(req.user.id);
    goals = goals.concat(userGoals.map(goal => ({ ...goal, scope: 'user' })));

    // Get global goals if requested and user is admin, or always for regular users
    if ((global && isAdmin) || !isAdmin) {
      const globalGoals = await this.getGoals(null);
      goals = goals.concat(globalGoals.map(goal => ({ ...goal, scope: 'global' })));
    }

    // Apply filters
    if (status) {
      goals = goals.filter(goal => goal.status === status);
    }
    if (priority) {
      goals = goals.filter(goal => goal.priority === priority);
    }
    if (category) {
      goals = goals.filter(goal => goal.category === category);
    }

    // Sort by created_at (newest first)
    goals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.debug('[GOALS]', `Retrieved ${goals.length} goals for user ${req.user.id}`);

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(200).json({
          success: true,
          goals: goals,
          count: goals.length,
          filters: { status, priority, category, global: !!global }
        });
      }
    });

  } catch (error) {
    console.error('[GOALS]', 'Error listing goals:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve goals',
      details: error.message
    });
  }
};
