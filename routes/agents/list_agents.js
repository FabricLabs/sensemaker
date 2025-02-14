'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      /* const agents = Object.keys(this.agents).map(x => {
        const agent = this.agents[x];
        return {
          name: x,
          description: agent.description,
          prompt: agent.prompt,
          rules: agent.settings.rules,
          constraints: agent.settings.constraints,
          documentation: agent.settings.documentation,
          settings: agent.settings
        };
      }); */
      const agents = await this.db('agents').select('*');

      res.send({ agents: agents.map((x) => {
        return {
          id: x.id,
          can_edit: (x.owner == req.user.id) ? true : false,
          name: x.name,
          description: x.description,
          status: x.status,
          prompt: x.prompt,
          rules: x.rules,
          constraints: x.constraints,
          documentation: x.documentation,
          settings: x.settings,
          created_at: x.created_at,
          updated_at: x.updated_at
        };
      }) });
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
