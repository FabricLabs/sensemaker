'use strict';

module.exports = function (req, res, next) {
  let store = null

  if (req.user && req.user.id) {
    store = this.trainer.getStoreForOwner(req.user.id);
  } else {
    store = this.trainer.embeddings;
  }

  const retriever = store.asRetriever();

  res.format({
    json: () => {
      console.debug('listing memories...');
      retriever.listMemories(req.query).then(memories => {
        console.debug('got memories:', memories);
        res.send(memories);
      }).catch(error => {
        console.error('Error fetching memories:', error);
        res.status(500).json({ message: 'Internal server error.' });
      });
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
