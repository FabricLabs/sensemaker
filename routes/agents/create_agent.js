'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  // TODO: add date, make unique, etc.
  const actor = new Actor({ name: `sensemaker/agents/${req.body.name}` });
  const prompt = req.body.prompt || `You are ${req.body.name}, an assistant.  Be helpful.`;
  const promptActor = new Actor({ content: prompt });
  const blobNumber = await this.db('blobs').insert({ fabric_id: promptActor.id, content: prompt, mime_type: 'text/plain' });
  if (!blobNumber) return res.status(500).send({ error: 'Could not create prompt blob.' });
  const inserted = await this.db('agents').insert({
    id: actor.id,
    name: req.body.name,
    model: 'sensemaker',
    creator: req.user.id,
    owner: req.user.id,
    // description: req.body.description,
    latest_prompt_blob_id: blobNumber[0],
    prompt_blob_history: JSON.stringify([blobNumber[0]])
  });

  /* const user = await this.db('users').insert({
    username: req.body.name.toLowerCase(),
    display_name: req.body.name
  });

  if (!inserted) return res.status(500).send({ error: 'Could not create agent.' });

  await this.db('agents').update({
    user_id: user[0]
  }).where('id', actor.id); */

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
