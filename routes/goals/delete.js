'use strict';

module.exports = async function deleteGoal (req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { preimage_sha256 } = req.params;

    if (!preimage_sha256) {
      return res.status(400).json({ error: 'Goal preimage_sha256 is required' });
    }

    // Check if goal exists and determine scope
    const userGoals = await this.getGoals(req.user.id);
    let goalExists = userGoals.find(g => g.preimage_sha256 === preimage_sha256);
    let user_id = req.user.id;
    let scope = 'user';

    // If not found in user goals, check global goals (admin only)
    if (!goalExists) {
      const isAdmin = req.user.username === 'admin'; // Adjust this based on your admin logic
      if (isAdmin) {
        const globalGoals = await this.getGoals(null);
        goalExists = globalGoals.find(g => g.preimage_sha256 === preimage_sha256);
        if (goalExists) {
          user_id = null; // This is a global goal
          scope = 'global';
        }
      }
    }

    if (!goalExists) {
      return res.status(404).json({
        error: 'Goal not found or you do not have permission to delete it',
        preimage_sha256: preimage_sha256
      });
    }

    await this.deleteGoal(preimage_sha256, user_id);

    console.debug('[GOALS]', `Deleted ${scope} goal:`, goalExists.id);

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(200).json({
          success: true,
          preimage_sha256: preimage_sha256,
          scope: scope,
          message: 'Goal deleted successfully'
        });
      }
    });

  } catch (error) {
    console.error('[GOALS]', 'Error deleting goal:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete goal',
      details: error.message
    });
  }
};
