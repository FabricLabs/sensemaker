'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const actor = new Actor({ name: `sensemaker/agents/${req.body.name}` });
  const prompt = `You are ${req.body.name}, an assistant.  Be helpful.`;
  const promptActor = new Actor({ content: prompt });
  const blobNumber = await this.db('blobs').insert({ fabric_id: promptActor.id, content: prompt, mime_type: 'text/plain' });
  const inserted = await this.db('agents').insert({
    id: actor.id,
    name: req.body.name,
    model: 'sensemaker'
  });

  console.debug('inserted:', inserted);

  res.format({
    json: () => {
      res.send({
        id: actor.id
      });
    },
    html: () => {
      res.redirect('/agents/' + actor.id);
    }
  });
};
