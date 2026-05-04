module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      if (!(await this._assertSensemakerAdminJson(req, res))) return;
      const emptyQueue = await this.queue.clearQueue;
      res.send(emptyQueue);
    },
  });
};
