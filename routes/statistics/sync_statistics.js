'use strict';

module.exports = async function (req, res, next) {
  const current = await this._getState();
  const state = {
    current: current,
    datasources: {}
  };

  for (let [name, datasource] of Object.entries(this.datasources)) {
    let source = { name: datasource.name };
    switch (name) {
      case 'discord':
        source.counts = await this.discord.getCounts();
        break;
      case 'matrix':
        source.counts = await this.matrix.getCounts();
        break;
      default:
        console.warn('[SENSEMAKER:CORE]', 'Unhandled Datasource:', name);
        break;
    }

    state.datasources[name] = source.counts;
  }

  res.send(state);
};
