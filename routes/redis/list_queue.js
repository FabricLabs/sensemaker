module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      try {
        if (!this.queue || !this.queue.jobs) return res.json([]);
        const queueList = await Promise.race([
          this.queue.jobs,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout')), 5000))
        ]);

        if (!queueList || !Array.isArray(queueList)) return res.json([]);
        const parsedQueueList = queueList.map(jobString => {
          try {
            return JSON.parse(jobString);
          } catch (e) {
            console.error('[REDIS:QUEUE]', 'Failed to parse job:', e);
            return null;
          }
        }).filter(job => job !== null);

        res.json(parsedQueueList);
      } catch (error) {
        console.error('[REDIS:QUEUE]', 'Error fetching queue:', error);
        res.json([]);
      }
    },
  });
};
