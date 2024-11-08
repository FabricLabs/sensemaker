'use strict';

module.exports = async function (req, res) {
  const inquiryID = req.params.id;
  try {
    const inquiry = await this.db.select('*').from('inquiries').where({ id: inquiryID }).first();
    if (!inquiry) return res.status(404).json({ message: 'Invalid inquiry' });
    // update the invitation status to deleted from the invitations list
    const inquiryDeleteStatus = await this.db('inquiries')
      .where({ id: inquiryID })
      .update({
        updated_at: new Date(),
        status: 'deleted',
      });

    if (!inquiryDeleteStatus) {
      return res.status(500).json({ message: 'Error deleting the inquiry.' });
    }

    res.send({
      message: 'Inquiry deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.', error });
  }
};
