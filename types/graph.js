'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

class Graph extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      name: 'sensemaker'
    }, settings);

    this._graph = null;
    this._state = {
      content: {
        nodes: [],
        edges: []
      },
      documents: {},
      status: 'STOPPED'
    };

    return this;
  }

  async addActor (content) {
    const actor = new Actor(content);
    this._state.documents[actor.id] = actor;
    this._state.content.nodes.push(actor.id);
    return actor.id;
  }

  async addRelationship (source, target, content) {
    const edge = { name: `${source}:${target}`, source: source, target: target, content: content };
    const actor = new Actor(edge);
    this._state.documents[actor.id] = actor;
    this._state.content.edges.push(actor.id);
    return actor.id;
  }

  async getActorByID (id) {
    return this._state.documents[id];
  }

  async getActorListByID (id) {
    // return this._graph.query(`MATCH (a:actor { id: '${id}' }) RETURN a`);
  }

  async getActorListByContent (content) {
    // return this._graph.query(`MATCH (a:actor { content: '${JSON.stringify(content)}' }) RETURN a`);
  }

  async start () {
    this._state.status = 'STARTING';
    // this._graph = new RedisGraph(this.settings.name);
    this._state.status = 'STARTED';
    return this;
  }

  async stop () {
    this._state.status = 'STOPPING';
    // this._graph.close();
    this._state.status = 'STOPPED';
    return this;
  }
}

module.exports = Graph;
