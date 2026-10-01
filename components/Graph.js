'use strict';

const React = require('react');
const Actor = require('@fabric/core/types/actor');

const GraphContent = require('./GraphContent');

class Graph extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      state: {
        edges: [],
        nodes: []
      }
    }, settings);

    this.state = {
      edges: this.settings.state.edges,
      nodes: this.settings.state.nodes
    };

    this._state = {
      content: this.settings.state,
      edges: {},
      nodes: {}
    };

    return this;
  }

  addNode (node) {
    const actor = new Actor(node);
    this._state.nodes[actor.id] = actor;
    this.setState(prevState => ({
      nodes: [
        ...prevState.nodes,
        { ...node, id: actor.id }
      ]
    }));
  }

  toDOT () {
    const { nodes, edges } = this.state;

    return `digraph G {
      ${nodes.map(node => `"${node.id}" [label="${node.label}"];`).join('\n')}
      ${edges.map(edge => `"${edge.source}" -> "${edge.target}";`).join('\n')}
    }`;
  }

  render () {
    return (
      <fabric-graph>
        <fabric-graph-raw></fabric-graph-raw>
        <GraphContent {...this.props} />
      </fabric-graph>
    );
  }
};

module.exports = Graph;
