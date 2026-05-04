'use strict';

module.exports = async function viewGoal (req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { preimage_sha256 } = req.params;

    if (!preimage_sha256) {
      return res.status(400).json({ error: 'Goal preimage_sha256 is required' });
    }

    // Check if goal exists in user's goals
    const userGoals = await this.getGoals(req.user.id);
    let goal = userGoals.find(g => g.preimage_sha256 === preimage_sha256);
    let scope = 'user';

    // If not found in user goals, check global goals
    if (!goal) {
      const globalGoals = await this.getGoals(null);
      goal = globalGoals.find(g => g.preimage_sha256 === preimage_sha256);
      scope = 'global';
    }

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        preimage_sha256: preimage_sha256
      });
    }

    goal.scope = scope;

    console.debug('[GOALS]', `Retrieved ${scope} goal:`, goal.id);

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(200).json({
          success: true,
          goal: goal
        });
      }
    });

  } catch (error) {
    console.error('[GOALS]', 'Error viewing goal:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve goal',
      details: error.message
    });
  }
};
