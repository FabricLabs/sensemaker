'use strict';

module.exports = async function (req, res, next) {
  console.debug('params:', req.params);
  const agent = await this.db('agents').where({ id: req.params.id }).first();
  if (!agent) return res.status(404).send({ error: 'Agent not found.' });
  const prompt = await this.db('blobs').where({ id: agent.latest_prompt_blob_id }).first();
  res.format({
    json: () => {
      res.send({ agent: { ...agent, prompt: prompt.content }});
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
