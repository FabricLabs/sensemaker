'use strict';

module.exports = async function (req, res, next) {
  const { roomId } = req.params;
  const { client } = req;

  try {
    const room = await this.matrix.getRoom(roomId);
    res.json({
      room
    });
  } catch (err) {
    next(err);
  }
}
