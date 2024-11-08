module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const user = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();
      if (!user || user.is_admin !== 1) {
        return res.status(401).json({ message: 'User not allowed to clear queue.' });
      }
      const emptyQueue = await this.queue.clearQueue;
      res.send(emptyQueue);
    },
  });
};
