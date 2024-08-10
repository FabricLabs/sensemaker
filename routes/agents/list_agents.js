'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: () => {
      const agents = Object.keys(this.agents).map(x => {
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
      });

      res.send(agents);
    }
  });
};
