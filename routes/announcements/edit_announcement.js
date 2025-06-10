'use strict';

module.exports = async function (req, res, next) {
  if (!req.user || !req.user.state?.roles?.includes('admin')) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const announcementId = req.params.id;
  const updates = req.body;

  try {
    // Update the announcement with the provided changes
    await this.db('announcements')
      .where({ id: announcementId })
      .update(updates);

    return res.json({
      type: 'announcementUpdated',
      content: {
        message: 'Announcement updated successfully.',
        status: 'success'
      }
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({
      type: 'announcementError',
      content: {
        message: 'Failed to update announcement.',
        error: error.message
      }
    });
  }
}; 