module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const queueList = await this.queue.jobs;
      const parsedQueueList = queueList.map(jobString => JSON.parse(jobString));
      res.send(parsedQueueList);
    },
  });
};
