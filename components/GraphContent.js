'use strict';

const crypto = require('crypto');

const React = require('react');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');
const parser = require('dotparser');
const { Digraph, Subgraph, Node, Edge, toDot, fromDot } = require('ts-graphviz');

// D3 and D3-Graphviz imports
const d3 = require('d3');
const { Graphviz } = require('@hpcc-js/wasm');

const {
  Button,
  Icon,
  Popup,
  TextArea,
  Modal,
  Form,
  Header
} = require('semantic-ui-react');

const Actor = require('@fabric/core/types/actor');

class GraphContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        showRawContent: false,
        currentContent: props.content || 'digraph G {\n  \n}',
        width: props.width || '100%',
        height: props.height || 600,
        error: null,
        nodeCounter: 0,
        selectedNode: null,
        nodeModalOpen: false,
        ast: null // Store the AST
      }
    }, props);

    this.graph = null; // d3-graphviz instance
    this.digraph = new Digraph('G'); // ts-graphviz instance
    this.state = this.settings.state;
    this.graphRef = React.createRef();
    this.editorRef = React.createRef();

    // Debounce the content change to prevent excessive re-renders
    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);

    // Fabric State
    this._state = {
      edges: {},
      nodes: {},
      content: this.state
    };

    return this;
  }

  componentDidMount () {
    console.debug('GraphContent componentDidMount');
    this.setState({ status: 'READY' });
    this.initializeGraph();
    // Parse initial content and update digraph
    const ast = this.parseDotToAST(this.state.currentContent);

    // Add resize handler
    this.resizeHandler = debounce(() => {
      if (this.graphRef.current && this.graph) {
        const containerWidth = this.graphRef.current.parentElement.clientWidth;
        this.graph.width(containerWidth);
        this.renderDotContent(this.state.currentContent, true);
      }
    }, 250);
    window.addEventListener('resize', this.resizeHandler);
  }

  componentDidUpdate (prevProps) {
    // Only update when props change, not when state changes
    if (prevProps.content !== this.props.content && this.props.content !== this.state.currentContent) {
      this.setState({ currentContent: this.props.content });
      this.parseDotToAST(this.props.content);
      if (this.graph) this.renderDotContent(this.props.content, true);
    }

    // Update graph name when document title changes
    if (this.props.documents?.document?.title !== prevProps.documents?.document?.title) {
      if (this.digraph) {
        this.digraph.id = this.props.documents.document.title.replace(/[^a-zA-Z0-9_]/g, '_');
        this.updateContentAndRender();
      }
    }
  }

  componentWillUnmount() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  handleContentChange (content) {
    if (this.props.onContentChange) this.props.onContentChange(content);
  }

  async initializeGraph () {
    if (!this.graphRef.current) return;
    try {
      const graphviz = await Graphviz.load();
      const containerWidth = this.graphRef.current.parentElement.clientWidth;

      this.graph = d3.select(this.graphRef.current).graphviz({
        useWorker: false,
        zoom: true,
        fit: true,
        width: containerWidth,
        height: this.state.height,
        engine: 'dot',
        graphviz: graphviz
      }).transition(() => {
        d3.transition().duration(1000).ease(d3.easeLinear);
      }).onerror((error) => {
        console.error('Graphviz render error:', error);
        const errorMessage = error?.message || 'Failed to render graph';
        this.setState({ error: errorMessage });
        if (this.graphRef.current) {
          this.graphRef.current.innerHTML = `<div style="padding: 20px; text-align: center; color: #d32f2f; border: 1px solid #ffcdd2; background: #ffebee; border-radius: 4px;">
            <strong>Graph Render Error:</strong><br/>
            ${errorMessage}
          </div>`;
        }
      });

      // Add click event handler for nodes
      d3.select(this.graphRef.current).on('click', (event) => {
        const target = event.target;
        const nodeEl = target.closest('.node');
        if (nodeEl) {
          let nodeId = null;
          const titleEl = nodeEl.querySelector('title');
          if (titleEl) {
            nodeId = titleEl.textContent;
          } else if (nodeEl.dataset && nodeEl.dataset.nodeId) {
            nodeId = nodeEl.dataset.nodeId;
          } else {
            nodeId = nodeEl.id;
          }

          // Fetch latest node attributes from digraph
          let nodeAttrs = {};
          if (this.digraph) {
            const nodeObj = this.digraph.getNode(nodeId);
            if (nodeObj) {
              nodeAttrs = { ...nodeObj.attributes };
            }
          }

          // Find the label element within the node
          const labelEl = nodeEl.querySelector('text');
          const label = nodeAttrs.label || (labelEl ? labelEl.textContent : nodeId);

          this.setState({
            selectedNode: {
              id: nodeId,
              label: label,
              ...nodeAttrs
            },
            nodeModalOpen: true
          });
        }
      });

      // Use the content from props
      this.renderDotContent(this.props.content, true);
    } catch (error) {
      console.error('Failed to initialize d3-graphviz:', error);
      const errorMessage = error?.message || 'Graph visualization not available. Please ensure d3 and d3-graphviz are properly loaded.';
      this.setState({ error: errorMessage });
      if (this.graphRef.current) this.graphRef.current.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">${errorMessage}</div>`;
    }
  }

  renderDotContent (dotContent, skipNotify = false) {
    if (!this.graph) return;
    try {
      // Update state first
      this.setState({
        status: 'RENDERING',
        currentContent: dotContent,
        error: null
      }, () => {
        // Then render the graph
        this.graph.renderDot(dotContent).on('end', () => {
          this.setState({ status: 'RENDERED' });
          if (!skipNotify && this.props.onContentChange) {
            this.handleContentChange(dotContent);
          }
        });
      });
    } catch (error) {
      console.error('Failed to render DOT content:', error);
      this.setState({ 
        error: error.message,
        status: 'ERROR'
      });
    }
  }

  updateDigraphFromDot (dotContent) {
    try {
      this.digraph = fromDot(dotContent);
      this.setState({ error: null });
    } catch (error) {
      console.error('Failed to update digraph from DOT:', error);
      // Fallback to empty digraph
      this.digraph = new Digraph('G');
      this.setState({
        error: `Parse error: ${error.message}`
      });
    }
  }

  parseDotToAST (dotContent) {
    try {
      const ast = parser(dotContent);
      this.setState({ ast, error: null });
      this.updateDigraphFromDot(dotContent);
      return ast;
    } catch (error) {
      console.error('Failed to parse DOT content:', error);
      this.setState({ 
        error: `Parse error: ${error.message}`,
        ast: null
      });

      // Try to update digraph anyway
      this.updateDigraphFromDot(dotContent);

      return null;
    }
  }

  // Add a new node using ts-graphviz
  addNode (label = null) {
    if (!this.graph || !this.digraph) return;

    const random = crypto.randomBytes(16).toString('hex');
    const nodeName = `node:${random}`;
    const nodeLabel = label || nodeName;

    // Create Fabric actor
    const actor = new Actor({ name: nodeName });
    this._state.nodes[actor.id] = actor;

    // Add node to Digraph with attributes
    const node = new Node(nodeName, { label: nodeLabel });
    this.digraph.addNode(node);

    // Update counter
    this.setState(prevState => ({
      nodeCounter: prevState.nodeCounter + 1
    }));

    // Update content and render
    this.updateContentAndRender();

    return nodeName;
  }

  // Add an edge using ts-graphviz
  addEdge (fromNodeId, toNodeId, attributes = {}) {
    if (!this.graph || !this.digraph) return;

    try {
      // Ensure fromNodeId and toNodeId are strings
      fromNodeId = String(fromNodeId);
      toNodeId = String(toNodeId);

      if (typeof fromNodeId !== 'string' || typeof toNodeId !== 'string') {
        console.error('addEdge: fromNodeId and toNodeId must be strings', { fromNodeId, toNodeId });
        return;
      }

      if (!fromNodeId || !toNodeId) {
        console.error('addEdge: fromNodeId and toNodeId must be non-empty strings', { fromNodeId, toNodeId });
        return;
      }

      const fromNode = this.digraph.getNode(fromNodeId);
      const toNode = this.digraph.getNode(toNodeId);
      if (!fromNode || !toNode) {
        console.error('addEdge: One or both nodes do not exist in the graph', { fromNodeId, toNodeId, fromNode, toNode }, toDot(this.digraph));
        return;
      }

      // Create edge using actual Node objects instead of string IDs
      const edge = new Edge([fromNode, toNode], attributes || {});
      this.digraph.addEdge(edge);

      // Update content and render using ts-graphviz
      this.updateContentAndRender();
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  }

  // Add a subgraph using ts-graphviz
  addSubgraph (label = 'Subgraph', nodes = []) {
    if (!this.graph || !this.digraph) return;
    const clusterId = `cluster_${this.state.nodeCounter + 1}`;

    // Create new subgraph
    const subgraph = new Subgraph(clusterId, {
      label,
      style: 'rounded',
      bgcolor: '#f8f8f8'
    });

    // Add nodes to subgraph
    nodes.forEach(nodeId => {
      const node = this.digraph.getNode(nodeId);
      if (node) {
        // Create a new node in the subgraph with the same attributes
        const subNode = new Node(node.id, node.attributes || {});
        subgraph.addNode(subNode);
      }
    });

    // Add subgraph to main graph
    this.digraph.addSubgraph(subgraph);

    // Update counter
    this.setState(prevState => ({
      nodeCounter: prevState.nodeCounter + 1
    }));

    // Update content and render
    this.updateContentAndRender();

    return clusterId;
  }

  // Update content from Digraph and trigger render
  updateContentAndRender () {
    try {
      // Debug: log the current state of the digraph
      const newContent = toDot(this.digraph);
      this.setState({ currentContent: newContent });
      if (this.graph) {
        this.graph
          .renderDot(newContent)
          .on('end', () => {
            this.setState({ status: 'RENDERED' });
            if (this.props.onContentChange) {
              this.handleContentChange(newContent);
            }
          });
      }
    } catch (error) {
      console.error('Error in updateContentAndRender:', error);
    }
  }

  // Handle textarea changes (user input only)
  handleTextareaChange = (event) => {
    const newContent = event.target.value;
    this.setState({ currentContent: newContent });

    // Parse new content and update digraph
    const ast = this.parseDotToAST(newContent);

    // Render the graph
    if (this.graph) {
      this.graph.renderDot(newContent);
    }
  };

  // Update node attributes using ts-graphviz
  updateNodeAttributes = (nodeId, newAttributes) => {
    if (!this.graph || !this.digraph) return;

    try {
      // Get the node from Digraph
      const node = this.digraph.getNode(nodeId);
      if (!node) {
        console.error('Node not found:', nodeId);
        return;
      }


      // Create a new Node with updated attributes to ensure proper attribute handling
      const updatedNode = new Node(nodeId, {
        ...node.attributes,  // Keep existing attributes
        ...Object.fromEntries(  // Add new attributes, filtering out undefined/null
          Object.entries(newAttributes)
            .filter(([_, value]) => value !== undefined && value !== null)
        )
      });

      // Replace the old node with the updated one
      this.digraph.removeNode(node);
      this.digraph.addNode(updatedNode);

      // Close modal and update content
      this.setState({ nodeModalOpen: false });
      this.updateContentAndRender();
    } catch (error) {
      console.error('Error updating node attributes:', error);
    }
  };

  // Remove a node and all its edges
  removeNode = (nodeId) => {
    if (!this.graph || !this.digraph) return;

    try {
      // Try to find the node in the digraph
      let foundNode = null;
      for (const node of this.digraph.nodes) {
        if (node.id === nodeId || (typeof node === 'string' && node.includes(nodeId))) {
          foundNode = node;
          break;
        }
      }

      if (!foundNode) {
        console.debug('Node not found in digraph after all attempts, aborting');
        return;
      }

      // First, remove all edges connected to this node
      const edges = [...this.digraph.edges];
      edges.forEach(edge => {
        if (!edge) return;
        try {
          const edgeFrom = edge.from || (edge.targets && edge.targets[0]);
          const edgeTo = edge.to || (edge.sources && edge.sources[0]);
          if (edgeFrom === nodeId || edgeTo === nodeId) {
            this.digraph.removeEdge(edge);
          }
        } catch (err) {
          console.warn('Error processing edge:', err);
        }
      });

      // Remove the node from the digraph
      this.digraph.removeNode(foundNode);

      // Remove from Fabric state
      if (this._state.nodes[nodeId]) {
        delete this._state.nodes[nodeId];
      }

      // Generate new DOT content without the removed node
      const newContent = toDot(this.digraph);

      // Close modal and reinitialize graph
      this.setState({ nodeModalOpen: false }, () => {
        if (this.graph) {
          // Force a complete re-initialization
          this.graph
            .dot(newContent)
            .render()
            .on('end', () => {
              d3.selectAll('.node').each(function(d) {
                const nodeElement = d3.select(this);
                const nodeTitle = nodeElement.select('title').text();
                if (nodeTitle === nodeId || nodeTitle.includes(nodeId)) {
                  nodeElement.remove();
                }
              });

              this.setState({ status: 'RENDERED' });

              if (this.props.onContentChange) {
                this.handleContentChange(newContent);
              }
            });
        }
      });
    } catch (error) {
      console.error('Error removing node:', error);
    }
  };

  // Remove a specific edge
  removeEdge = (sourceId, targetId) => {
    if (!this.graph || !this.digraph) return;

    try {
      const edges = [...this.digraph.edges];
      const edgeToRemove = edges.find(edge => {
        if (!edge) return false;
        const edgeFrom = edge.from || (edge.targets && edge.targets[0]) || sourceId;
        const edgeTo = edge.to || (edge.sources && edge.sources[0]) || targetId;
        return (edgeFrom === sourceId && edgeTo === targetId) ||
               (edge.targets && edge.targets.includes && edge.targets.includes(targetId) && 
                edge.sources && edge.sources.includes && edge.sources.includes(sourceId));
      });

      if (edgeToRemove) {
        this.digraph.removeEdge(edgeToRemove);
        this.updateContentAndRender();
      }
    } catch (error) {
      console.error('Error removing edge:', error);
    }
  };

  // Function to compute current inputs and outputs for a given node
  getCurrentInputsOutputs = (nodeId) => {
    const edges = this.digraph ? [...this.digraph.edges] : [];
    const inputs = [];
    const outputs = [];

    edges.forEach(edge => {
      if (!edge) return;

      try {
        let sourceId, targetId;

        // For edges created with Node objects, edge.targets contains Node objects
        if (edge.targets && edge.targets.length >= 2) {
          const sourceNode = edge.targets[0];
          const targetNode = edge.targets[1];

          // Extract IDs from Node objects or use as strings
          sourceId = typeof sourceNode === 'object' && sourceNode.id ? sourceNode.id : String(sourceNode);
          targetId = typeof targetNode === 'object' && targetNode.id ? targetNode.id : String(targetNode);
        }
        // Legacy fallback for string-based edges
        else if (edge.from && edge.to) {
          sourceId = edge.from;
          targetId = edge.to;
        }
        // Another fallback for edge ID parsing
        else if (edge.id) {
          const match = edge.id.match(/(.+?)\s*->\s*(.+)/);
          if (match) {
            sourceId = match[1].replace(/"/g, '');
            targetId = match[2].replace(/"/g, '');
          }
        }

        if (sourceId && targetId) {
          // Clean up IDs (remove quotes if present)
          sourceId = typeof sourceId === 'string' ? sourceId.replace(/"/g, '') : String(sourceId);
          targetId = typeof targetId === 'string' ? targetId.replace(/"/g, '') : String(targetId);

          // Check if this edge targets our selected node (input)
          if (targetId === nodeId) {
            inputs.push(sourceId);
          }

          // Check if this edge sources from our selected node (output)
          if (sourceId === nodeId) {
            outputs.push(targetId);
          }
        }
      } catch (err) {
        console.warn('Failed to process edge:', edge, err);
      }
    });

    return { inputs, outputs };
  };

  renderNodeModal () {
    const { nodeModalOpen, selectedNode } = this.state;
    if (!selectedNode) return null;

    // Get all available nodes except the current one
    const nodes = this.digraph ? [...this.digraph.nodes].filter(node => node.id !== selectedNode.id) : [];
    const nodeOptions = nodes.map(node => {
      let label = node.attributes?.label;
      if (!label) {
        const digraphNode = this.digraph.getNode(node.id);
        label = digraphNode?.attributes?.label;
      }

      label = label || node.id;

      return {
        key: node.id,
        text: label,
        value: node.id
      };
    });

    // Get current inputs and outputs for this node
    const { inputs: currentInputs, outputs: currentOutputs } = this.getCurrentInputsOutputs(selectedNode.id);

    const handleInputChange = (e, { value }) => {
      // Ensure value is always an array
      const selectedInputs = Array.isArray(value) ? value : [value].filter(Boolean);

      // Get current inputs to determine what to remove and what to add
      const { inputs: currentInputs } = this.getCurrentInputsOutputs(selectedNode.id);

      // Remove edges that are no longer selected
      currentInputs.forEach(inputId => {
        if (!selectedInputs.includes(inputId)) {
          this.removeEdge(inputId, selectedNode.id);
        }
      });

      // Add new edges one at a time
      selectedInputs.forEach(sourceId => {
        if (sourceId && !currentInputs.includes(sourceId)) {
          // Create edge with empty attributes object
          this.addEdge(sourceId, selectedNode.id, {});
        }
      });
    };

    const handleOutputChange = (e, { value }) => {
      // Ensure value is always an array
      const selectedOutputs = Array.isArray(value) ? value : [value].filter(Boolean);

      // Get current outputs to determine what to remove and what to add
      const { outputs: currentOutputs } = this.getCurrentInputsOutputs(selectedNode.id);

      // Remove edges that are no longer selected
      currentOutputs.forEach(outputId => {
        if (!selectedOutputs.includes(outputId)) {
          this.removeEdge(selectedNode.id, outputId);
        }
      });

      // Add new edges
      selectedOutputs.forEach(targetId => {
        if (targetId && !currentOutputs.includes(targetId)) {
          this.addEdge(selectedNode.id, targetId);
        }
      });
    };

    return (
      <Modal
        open={nodeModalOpen}
        onClose={() => this.setState({ nodeModalOpen: false })}
        size='small'
      >
        <Header icon='sitemap' content={`Node: ${selectedNode.label || selectedNode.id}`} />
        <Modal.Content>
          <Form>
            <Form.Input
              label='Label'
              value={selectedNode.label || selectedNode.id}
              onChange={(e, { value }) => {
                const updatedNode = { ...selectedNode };
                updatedNode.label = value;
                this.setState({ selectedNode: updatedNode });
              }}
            />
            <Form.Input
              label='Shape'
              defaultValue={selectedNode.shape || 'box'}
              onChange={(e, { value }) => {
                const updatedNode = { ...selectedNode };
                updatedNode.shape = value;
                this.setState({ selectedNode: updatedNode });
              }}
            />
            <Form.Input
              label='Fill Color'
              defaultValue={selectedNode.fillcolor || '#f0f0f0'}
              type='color'
              onChange={(e, { value }) => {
                const updatedNode = { ...selectedNode };
                updatedNode.fillcolor = value;
                this.setState({ selectedNode: updatedNode });
              }}
            />
            <Form.Input
              label='Style'
              defaultValue={selectedNode.style || 'filled'}
              onChange={(e, { value }) => {
                const updatedNode = { ...selectedNode };
                updatedNode.style = value;
                this.setState({ selectedNode: updatedNode });
              }}
            />
            <Form.Dropdown
              label='Input Connections'
              placeholder='Select input nodes'
              fluid
              multiple
              search
              selection
              options={nodeOptions}
              value={currentInputs}
              onChange={handleInputChange}
            />
            <Form.Dropdown
              label='Output Connections'
              placeholder='Select output nodes'
              fluid
              multiple
              search
              selection
              options={nodeOptions}
              value={currentOutputs}
              onChange={handleOutputChange}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='red' onClick={() => this.setState({ nodeModalOpen: false })}>
            <Icon name='remove' /> Cancel
          </Button>
          <Button
            color='orange'
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove the node "${selectedNode.label || selectedNode.id}"? This will also remove all connected edges.`)) {
                this.removeNode(selectedNode.id);
              }
            }}
          >
            <Icon name='trash' /> Remove Node
          </Button>
          <Button color='green' onClick={() => {
            const attrs = {
              label: this.state.selectedNode.label || this.state.selectedNode.id,
              shape: this.state.selectedNode.shape,
              fillcolor: this.state.selectedNode.fillcolor,
              style: this.state.selectedNode.style
            };
            this.updateNodeAttributes(this.state.selectedNode.id, attrs);
          }}>
            <Icon name='checkmark' /> Update
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  renderEditingToolbar () {
    const { showRawContent } = this.state;
    return (
      <div style={{ marginBottom: '1em', display: 'flex', justifyContent: 'space-between' }}>
        <Button.Group size='small'>
          <Popup
            content='Add Node'
            trigger={
              <Button icon onClick={() => this.addNode('New Node')}>
                <Icon name='add circle' />
              </Button>
            }
          />
          <Popup
            content='Add Edge'
            trigger={
              <Button icon onClick={() => {
                const lastNodeId = `node${this.state.nodeCounter}`;
                const newNodeId = this.addNode('New Node');
                if (this.state.nodeCounter > 1) {
                  this.addEdge(lastNodeId, newNodeId);
                }
              }}>
                <Icon name='arrow right' />
              </Button>
            }
          />
          <Popup
            content='Add Subgraph'
            trigger={
              <Button icon onClick={() => {
                const nodeId = this.addNode('Subgraph Node');
                this.addSubgraph('Subgraph', [nodeId]);
              }}>
                <Icon name='object group' />
              </Button>
            }
          />
        </Button.Group>
        <Button
          icon
          labelPosition='left'
          active={showRawContent}
          onClick={() => this.setState(prev => ({ showRawContent: !prev.showRawContent }))}
        >
          <Icon name='code' />
          {showRawContent ? 'Hide Source' : 'View Source'}
        </Button>
      </div>
    );
  }

  render () {
    const { editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
    const { editMode, showRawContent, currentContent, width, height, error, ast } = this.state;
    const currentEditMode = externalEditMode !== undefined ? externalEditMode : editMode;
    const handleEditToggle = () => {
      if (externalEditMode !== undefined && onEditModeChange) {
        // Use external control
        onEditModeChange(!externalEditMode);
      } else {
        // Use internal state
        this.setState(prev => ({ 
          editMode: !prev.editMode,
          showRawContent: false // Hide raw content when toggling edit mode
        }));
      }
    };

    return (
      <fabric-graph-content>
        <style>{`
          .node ellipse {
            stroke: #d4d4d5;
            stroke-width: 2px;
          }

          .cluster text,
          .node text {
            font-family: Arvo, 'Helvetica Neue', Arial, Helvetica, sans-serif;
          }
        `}</style>
        {editable && !hideEditButton && (
          <div style={{ marginBottom: '1em' }}>
            <Button
              icon
              labelPosition='left'
              onClick={handleEditToggle}
              style={{ float: 'right' }}
            >
              <Icon name='edit' />
              {currentEditMode ? 'View' : 'Edit'}
            </Button>
          </div>
        )}

        <div style={{ clear: 'both' }}>
          {currentEditMode && this.renderEditingToolbar()}

          {/* Graph Preview */}
          <div
            ref={this.graphRef}
            style={{
              width: '100%',
              height: height,
              marginBottom: showRawContent ? '1em' : 0,
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          />

          {/* Node Modal */}
          {this.renderNodeModal()}

          {/* Raw Content Editor and AST View */}
          {currentEditMode && showRawContent && (
            <div style={{ display: 'flex', gap: '1em' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.5em', fontWeight: 'bold' }}>DOT Content</div>
                <TextArea
                  ref={this.editorRef}
                  value={currentContent}
                  onChange={this.handleTextareaChange}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    padding: '1em',
                    marginBottom: error ? '1em' : 0,
                    border: error ? '1px solid #d32f2f' : undefined,
                    resize: 'vertical'
                  }}
                />
                {error && (
                  <div style={{
                    color: '#d32f2f',
                    padding: '8px',
                    backgroundColor: '#ffebee',
                    borderRadius: '4px'
                  }}>
                    {error}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.5em', fontWeight: 'bold' }}>AST View</div>
                <div
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    padding: '1em',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {ast ? JSON.stringify(ast, null, 2) : 'No AST available'}
                </div>
              </div>
            </div>
          )}
        </div>
      </fabric-graph-content>
    );
  }
}

module.exports = GraphContent;