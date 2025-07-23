'use strict';

// Dependencies
const crypto = require('crypto');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');

// React
const React = require('react');

// Graphs
const d3 = require('d3');
const parser = require('dotparser');
const { Digraph, Subgraph, Node, Edge, toDot, fromDot } = require('ts-graphviz');

// Loader for Graphviz
let GraphvizWasm = null;
try {
  GraphvizWasm = require('graphviz-wasm').default;
} catch (e) {
  GraphvizWasm = null;
}

// Semantic UI
const {
  Button,
  Icon,
  Popup,
  TextArea,
  Modal,
  Form,
  Header
} = require('semantic-ui-react');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

class GraphContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        showRawContent: true,
        currentContent: props.content || 'digraph G {\n  \n}',
        width: props.width || '100%',
        height: props.height || 600,
        error: null,
        nodeCounter: 0,
        selectedNode: null,
        nodeModalOpen: false,
        selectedEdge: null,
        edgeModalOpen: false,
        ast: null, // Store the AST
        // Viewport controls
        zoomLevel: 1,
        panX: 0,
        panY: 0,
        autoFit: props.autoFit === true, // Default to false (100% zoom)
        minZoom: 0.1,
        maxZoom: 10,
        isDragging: false,
        // Animation controls
        animationsEnabled: props.animationsEnabled !== false, // Default to true
        animationDuration: props.animationDuration || 750, // Default 750ms
        previousNodePositions: new Map() // Store previous node positions for animation
      }
    }, props);

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

  async componentDidMount () {
    this.setState({ status: 'READY' });
    if (!GraphvizWasm) {
      this.setState({ error: 'graphviz-wasm is not available' });
      if (this.graphRef.current) {
        this.graphRef.current.innerHTML = `<div style="padding: 20px; text-align: center; color: #d32f2f; border: 1px solid #ffcdd2; background: #ffebee; border-radius: 4px;">
          <strong>Graphviz WASM not available</strong>
        </div>`;
      }
      return;
    }
    // Required for all current graphviz-wasm versions (including 3.0.2)
    await GraphvizWasm.loadWASM();

    // Parse initial content to set AST
    this.parseDotToAST(this.state.currentContent);

    await this.renderDotContent(this.state.currentContent, true);
    this.resizeHandler = debounce(async () => {
      if (this.graphRef.current && this.state.autoFit) {
        // Re-fit the graph when container resizes if auto-fit is enabled
        this.fitGraphToViewport();
      } else if (this.graphRef.current) {
        // Just reapply the current transform
        this.applyViewportTransform();
      }
    }, 250);

    // Add keyboard shortcuts
    this.keyboardHandler = (event) => {
      // Only handle shortcuts when the graph container is focused or when no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      if (isInputFocused) return;

      switch (event.key) {
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.zoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.resetZoom();
          }
          break;
        case 'f':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.toggleAutoFit();
          }
          break;
      }
    };

    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('keydown', this.keyboardHandler);
  }

  async componentDidUpdate (prevProps) {
    if (prevProps.content !== this.props.content && this.props.content !== this.state.currentContent) {
      this.setState({ currentContent: this.props.content });
      this.parseDotToAST(this.props.content);
      await this.renderDotContent(this.props.content, true);
    }
    if (this.props.documents?.document?.title !== prevProps.documents?.document?.title) {
      if (this.digraph) {
        this.digraph.id = this.props.documents.document.title.replace(/[^a-zA-Z0-9_]/g, '_');
        await this.updateContentAndRender();
      }
    }
  }

  componentWillUnmount() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
    }

    // Clean up SVG click handler
    if (this.svgClickHandler && this.graphRef.current) {
      const svg = this.graphRef.current.querySelector('svg');
      if (svg) {
        svg.removeEventListener('click', this.svgClickHandler);
      }
    }

    // Clean up click style element
    if (this.clickStyleElement && this.clickStyleElement.parentNode) {
      this.clickStyleElement.parentNode.removeChild(this.clickStyleElement);
    }

    // Clean up animation timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
  }

  handleContentChange (content) {
    if (this.props.onContentChange) this.props.onContentChange(content);
  }

  // Capture current node positions from the SVG
  captureNodePositions () {
    if (!this.graphRef.current) return new Map();
    const svg = this.graphRef.current.querySelector('svg');
    if (!svg) return new Map();

    const positions = new Map();
    const nodes = svg.querySelectorAll('.node');

    nodes.forEach(node => {
      const title = node.querySelector('title');
      if (title) {
        const id = title.textContent.trim();
        const transform = node.getAttribute('transform');
        if (transform) {
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (match) {
            positions.set(id, {
              x: parseFloat(match[1]),
              y: parseFloat(match[2])
            });
          }
        }
      }
    });

    return positions;
  }

  // Capture edge path data
  captureEdgeData () {
    if (!this.graphRef.current) return new Map();
    const svg = this.graphRef.current.querySelector('svg');
    if (!svg) return new Map();

    const edgeData = new Map();
    const edges = svg.querySelectorAll('.edge');

    edges.forEach(edge => {
      const title = edge.querySelector('title');
      const path = edge.querySelector('path');
      if (title && path) {
        const id = title.textContent.trim();
        edgeData.set(id, {
          d: path.getAttribute('d')
        });
      }
    });

    return edgeData;
  }

  // Capture cluster positions and data
  captureClusterData () {
    if (!this.graphRef.current) return new Map();
    const svg = this.graphRef.current.querySelector('svg');
    if (!svg) return new Map();

    const clusterData = new Map();
    const clusters = svg.querySelectorAll('.cluster');

    clusters.forEach(cluster => {
      const title = cluster.querySelector('title');
      if (title) {
        const id = title.textContent.trim();

        // Get the polygon that defines the cluster boundary
        const polygon = cluster.querySelector('polygon');

        // Get all nodes that belong to this cluster
        const clusterNodes = [];
        cluster.querySelectorAll('.node').forEach(node => {
          const nodeTitle = node.querySelector('title');
          if (nodeTitle) {
            clusterNodes.push(nodeTitle.textContent.trim());
          }
        });

        clusterData.set(id, {
          polygon: polygon ? polygon.getAttribute('points') : null,
          nodes: clusterNodes,
          element: cluster
        });
      }
    });

    return clusterData;
  }

  // Animate the transition between graph states
  async animateGraphTransition (newSvgContent, oldNodePositions, oldEdgeData, oldClusterData = new Map()) {
    // Cancel any pending animation
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }

    return new Promise((resolve) => {
      const duration = this.state.animationDuration;

      // Parse new SVG to extract data
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newSvgContent, 'image/svg+xml');
      const newSvg = newDoc.querySelector('svg');

      if (!newSvg) {
        this.graphRef.current.innerHTML = newSvgContent;
        resolve(false); // Didn't animate
        return;
      }

      // Get current SVG
      const currentSvg = this.graphRef.current.querySelector('svg');
      if (!currentSvg) {
        this.graphRef.current.innerHTML = newSvgContent;
        resolve(false); // Didn't animate
        return;
      }

      // Preserve viewport transform
      const viewportWrapper = currentSvg.querySelector('g.viewport-wrapper');
      const currentViewportTransform = viewportWrapper ? viewportWrapper.getAttribute('transform') : null;
      console.debug('Animation: Preserving viewport transform:', currentViewportTransform);

      // Extract new positions and elements
      const newNodes = new Map();
      const newEdges = new Map();
      const newClusters = new Map();

      newSvg.querySelectorAll('.node').forEach(node => {
        const title = node.querySelector('title');
        if (title) {
          const id = title.textContent.trim();
          const transform = node.getAttribute('transform');
          const match = transform ? transform.match(/translate\(([^,]+),([^)]+)\)/) : null;
          newNodes.set(id, {
            element: node,
            x: match ? parseFloat(match[1]) : 0,
            y: match ? parseFloat(match[2]) : 0
          });
        }
      });

      newSvg.querySelectorAll('.edge').forEach(edge => {
        const title = edge.querySelector('title');
        if (title) {
          newEdges.set(title.textContent.trim(), edge);
        }
      });

      // Extract new cluster data
      newSvg.querySelectorAll('.cluster').forEach(cluster => {
        const title = cluster.querySelector('title');
        if (title) {
          const id = title.textContent.trim();
          const polygon = cluster.querySelector('polygon');

          // Get all nodes that belong to this cluster
          const clusterNodes = [];
          cluster.querySelectorAll('.node').forEach(node => {
            const nodeTitle = node.querySelector('title');
            if (nodeTitle) {
              clusterNodes.push(nodeTitle.textContent.trim());
            }
          });

          newClusters.set(id, {
            element: cluster,
            polygon: polygon ? polygon.getAttribute('points') : null,
            nodes: clusterNodes
          });
        }
      });

      // Track elements to remove
      const nodesToRemove = [];
      const edgesToRemove = [];
      const clustersToRemove = [];

      // For clusters, we'll take a simpler approach:
      // 1. Remove clusters that no longer exist
      // 2. Add new clusters completely (with their structure)
      // 3. For existing clusters, only update their visual properties

      const graphContainer = viewportWrapper || currentSvg;
      const existingClusterIds = new Set();

      // Mark existing clusters and remove those that don't exist in new graph
      graphContainer.querySelectorAll('.cluster').forEach(cluster => {
        const title = cluster.querySelector('title');
        if (title) {
          const id = title.textContent.trim();
          if (!newClusters.has(id)) {
            // Remove cluster that doesn't exist in new graph
            cluster.remove();
          } else {
            existingClusterIds.add(id);
            // For existing clusters, just update the polygon shape
            const newCluster = newClusters.get(id);
            const currentPolygon = cluster.querySelector('polygon');
            const newPolygon = newCluster.element.querySelector('polygon');

            if (currentPolygon && newPolygon) {
              // Animate polygon shape change
              const newPoints = newPolygon.getAttribute('points');
              if (currentPolygon.getAttribute('points') !== newPoints) {
                d3.select(currentPolygon)
                  .transition()
                  .duration(duration)
                  .attr('points', newPoints);
              }

              // Update other attributes
              Array.from(newPolygon.attributes).forEach(attr => {
                if (attr.name !== 'points') {
                  currentPolygon.setAttribute(attr.name, attr.value);
                }
              });
            }
          }
        }
      });

      // Update existing nodes - handle both standalone and cluster nodes
      const allNodes = graphContainer.querySelectorAll('.node');
      allNodes.forEach(node => {
        const title = node.querySelector('title');
        if (title) {
          const id = title.textContent.trim();
          const newNode = newNodes.get(id);

          if (newNode) {
            // Node exists in new graph - animate to new position
            const oldPos = oldNodePositions.get(id);
            if (oldPos && (oldPos.x !== newNode.x || oldPos.y !== newNode.y)) {
              // Only animate if position actually changed
              d3.select(node)
                .transition()
                .duration(duration)
                .ease(d3.easeCubicInOut)
                .attr('transform', `translate(${newNode.x},${newNode.y})`);
            } else if (!oldPos) {
              // New position for existing node
              node.setAttribute('transform', `translate(${newNode.x},${newNode.y})`);
            }

            // Update node content if changed
            const currentEllipse = node.querySelector('ellipse, polygon, circle, rect');
            const newEllipse = newNode.element.querySelector('ellipse, polygon, circle, rect');
            if (currentEllipse && newEllipse) {
              // Copy attributes
              Array.from(newEllipse.attributes).forEach(attr => {
                if (attr.name !== 'transform') {
                  currentEllipse.setAttribute(attr.name, attr.value);
                }
              });
            }

            // Update text
            const currentText = node.querySelector('text');
            const newText = newNode.element.querySelector('text');
            if (currentText && newText) {
              currentText.textContent = newText.textContent;
              Array.from(newText.attributes).forEach(attr => {
                currentText.setAttribute(attr.name, attr.value);
              });
            }

            // Mark as processed
            newNodes.delete(id);
          } else {
            // Node doesn't exist in new graph - fade out and remove
            nodesToRemove.push(node);
            d3.select(node)
              .transition()
              .duration(duration * 0.5)
              .style('opacity', 0)
              .remove();
          }
        }
      });

      // Update existing edges
      graphContainer.querySelectorAll('.edge').forEach(edge => {
        const title = edge.querySelector('title');
        if (title) {
          const id = title.textContent.trim();
          const newEdge = newEdges.get(id);

          if (newEdge) {
            // Update edge path
            const currentPath = edge.querySelector('path');
            const newPath = newEdge.querySelector('path');
            if (currentPath && newPath) {
              d3.select(currentPath)
                .transition()
                .duration(duration)
                .attr('d', newPath.getAttribute('d'));

              // Update other attributes
              Array.from(newPath.attributes).forEach(attr => {
                if (attr.name !== 'd') {
                  currentPath.setAttribute(attr.name, attr.value);
                }
              });
            }

            // Update polygon (arrowhead)
            const currentPolygon = edge.querySelector('polygon');
            const newPolygon = newEdge.querySelector('polygon');
            if (currentPolygon && newPolygon) {
              d3.select(currentPolygon)
                .transition()
                .duration(duration)
                .attr('points', newPolygon.getAttribute('points'));

              // Update other attributes
              Array.from(newPolygon.attributes).forEach(attr => {
                if (attr.name !== 'points') {
                  currentPolygon.setAttribute(attr.name, attr.value);
                }
              });
            }

            // Mark as processed
            newEdges.delete(id);
          } else {
            // Edge doesn't exist in new graph - fade out and remove
            edgesToRemove.push(edge);
            d3.select(edge)
              .transition()
              .duration(duration * 0.5)
              .style('opacity', 0)
              .remove();
          }
        }
      });

      // Get the actual graph group (inside viewport wrapper if it exists)
      let currentG = null;
      if (viewportWrapper) {
        currentG = viewportWrapper.querySelector('g');
      } else {
        currentG = currentSvg.querySelector('g');
      }

      if (!currentG) {
        console.error('Animation: Could not find graph group');
        this.graphRef.current.innerHTML = newSvgContent;
        resolve(false); // Couldn't animate, fell back to replacement
        return;
      }

      // Add new clusters that don't exist yet - with their complete structure
      newClusters.forEach((clusterData, id) => {
        if (!existingClusterIds.has(id)) {
          // Clone the entire cluster with all its contents
          const clonedCluster = clusterData.element.cloneNode(true);

          // Insert clusters at the beginning to maintain proper z-order
          const firstNonCluster = Array.from(currentG.children).find(child => !child.classList.contains('cluster'));
          if (firstNonCluster) {
            currentG.insertBefore(clonedCluster, firstNonCluster);
          } else {
            currentG.appendChild(clonedCluster);
          }

          // Mark nodes in this cluster as already processed
          clusterData.nodes.forEach(nodeId => {
            newNodes.delete(nodeId);
          });
        }
      });

      // Add new nodes (only standalone nodes, cluster nodes were already added)
      newNodes.forEach((nodeData, id) => {
        const clonedNode = nodeData.element.cloneNode(true);
        currentG.appendChild(clonedNode);

        // Start scaled down and transparent
        clonedNode.setAttribute('transform', `translate(${nodeData.x},${nodeData.y}) scale(0.01)`);
        d3.select(clonedNode).style('opacity', 0);

        // Animate in
        d3.select(clonedNode)
          .transition()
          .duration(duration)
          .ease(d3.easeBackOut)
          .attr('transform', `translate(${nodeData.x},${nodeData.y}) scale(1)`)
          .style('opacity', 1);
      });

      // Add new edges
      newEdges.forEach((edgeElement, id) => {
        const clonedEdge = edgeElement.cloneNode(true);

        // Insert edges before nodes to maintain proper z-order
        const firstNode = currentG.querySelector('.node');
        if (firstNode) {
          currentG.insertBefore(clonedEdge, firstNode);
        } else {
          currentG.appendChild(clonedEdge);
        }

        // Start transparent
        d3.select(clonedEdge).style('opacity', 0);

        // Animate in
        d3.select(clonedEdge)
          .transition()
          .delay(duration * 0.3)
          .duration(duration * 0.7)
          .style('opacity', 1);
      });

      // Update graph attributes (like bgcolor, etc)
      const newG = newSvg.querySelector('g');
      // Get the actual graph group, not the viewport wrapper
      const currentG2 = viewportWrapper ? viewportWrapper.querySelector('g') : currentSvg.querySelector('g');
      if (newG && currentG2) {
        Array.from(newG.attributes).forEach(attr => {
          // Don't copy transform or class attributes to avoid messing with viewport
          if (attr.name !== 'transform' && attr.name !== 'class') {
            currentG2.setAttribute(attr.name, attr.value);
          }
        });
      }

      // Update SVG viewBox and size if needed - but skip if we have a viewport wrapper
      // to avoid messing with the zoom/pan state
      if (!viewportWrapper) {
        Array.from(newSvg.attributes).forEach(attr => {
          if (attr.name === 'viewBox' || attr.name === 'width' || attr.name === 'height') {
            currentSvg.setAttribute(attr.name, attr.value);
          }
        });
      }

      // Ensure viewport transform is still intact after all operations
      if (currentViewportTransform && viewportWrapper) {
        console.debug('Animation: Restoring viewport transform:', currentViewportTransform);
        viewportWrapper.setAttribute('transform', currentViewportTransform);
      }

      // Resolve after animations complete
      this.animationTimeout = setTimeout(() => {
        this.animationTimeout = null;
        resolve(true); // Successfully animated
      }, duration + 100);
    });
  }

  async renderDotContent (dotContent, skipNotify = false) {
    if (!GraphvizWasm) return;
    try {
      this.setState({
        status: 'RENDERING',
        currentContent: dotContent,
        error: null
      });

      // Capture current node, edge, and cluster positions before re-rendering
      const oldNodePositions = this.captureNodePositions();
      const oldEdgeData = this.captureEdgeData();
      const oldClusterData = this.captureClusterData();

      const svg = GraphvizWasm.layout(dotContent, 'svg', 'dot');
      if (this.graphRef.current) {
        // Check if animations are enabled and we have previous data
        let didAnimate = false;
        if (this.state.animationsEnabled && (oldNodePositions.size > 0 || oldEdgeData.size > 0 || oldClusterData.size > 0)) {
          didAnimate = await this.animateGraphTransition(svg, oldNodePositions, oldEdgeData, oldClusterData);
        }

        if (!didAnimate) {
          this.graphRef.current.innerHTML = svg;
        }

        // Apply viewport fitting after rendering
        // Use setTimeout to ensure DOM is updated before applying transforms
        setTimeout(() => {
          // Only apply viewport transform if:
          // 1. We didn't animate (fell back to innerHTML replacement), OR
          // 2. This is the first render (no previous data)
          const isFirstRender = oldNodePositions.size === 0 && oldEdgeData.size === 0;
          const shouldApplyViewport = !didAnimate || isFirstRender;

          if (shouldApplyViewport) {
            if (this.state.autoFit) {
              this.fitGraphToViewport();
            } else if (isFirstRender) {
              // Only center view on first render
              try {
                this.centerView();
              } catch (error) {
                // Reset to default position if centering fails
                this.setState({
                  panX: 0,
                  panY: 0,
                  zoomLevel: 1
                }, this.applyViewportTransform);
              }
            } else {
              // Just apply existing viewport transform
              this.applyViewportTransform();
            }
          }
          // Animation preserves viewport, so no action needed
        }, 0);

        // Add delegated click handler to SVG AFTER viewport transform
        this.addSVGClickHandler();
      }
      this.setState({ status: 'RENDERED' });
      if (!skipNotify && this.props.onContentChange) {
        this.handleContentChange(dotContent);
      }
    } catch (error) {
      this.setState({
        error: error.message,
        status: 'ERROR'
      });
      if (this.graphRef.current) {
        this.graphRef.current.innerHTML = `<div style="padding: 20px; text-align: center; color: #d32f2f; border: 1px solid #ffcdd2; background: #ffebee; border-radius: 4px;">
          <strong>Graph Render Error:</strong><br/>
          ${error.message}
        </div>`;
      }
    }
  }

  // Add delegated click handler to SVG for all nodes
  addSVGClickHandler = () => {
    if (!this.graphRef.current) return;

    const svg = this.graphRef.current.querySelector('svg');
    if (!svg) {
      return;
    }

    // Remove existing handler if any
    if (this.svgClickHandler) {
      svg.removeEventListener('click', this.svgClickHandler);
    }

    // Find all node elements and log them
    const nodeElements = svg.querySelectorAll('.node');
    nodeElements.forEach((node, index) => {
      const title = node.querySelector('title');
      console.debug(`Node ${index}:`, {
        element: node,
        title: title?.textContent,
        classes: node.className,
        tagName: node.tagName
      });
    });

    // Also try alternative selectors
    const allNodes = svg.querySelectorAll('g[class*="node"], g.node, [class*="node"]');

    // Debug: Find all g elements with titles to understand the structure
    const allGWithTitles = svg.querySelectorAll('g');
    const gElementsWithTitles = Array.from(allGWithTitles).filter(g => g.querySelector('title'));
    gElementsWithTitles.forEach((g, index) => {
      const title = g.querySelector('title');
      console.debug(`G element ${index} with title:`, {
        element: g,
        title: title?.textContent,
        classes: g.className,
        hasNodeElements: !!(g.querySelector('ellipse, polygon, rect') || g.querySelector('text'))
      });
    });

    // Create delegated click handler
    this.svgClickHandler = (event) => {
      console.debug('SVG clicked, target:', event.target);

      // Check for edge clicks first
      let edgeElement = event.target.closest('.edge');

      if (!edgeElement) {
        // Look for edge-like elements (path, line, polygon in edge context)
        let current = event.target;
        while (current && current !== svg) {
          if (current.tagName === 'g' &&
            (current.classList.contains('edge') ||
              (current.className && current.className.baseVal && current.className.baseVal.includes('edge')))) {
            edgeElement = current;
            break;
          }
          current = current.parentElement;
        }
      }

      // If we found an edge, handle edge click
      if (edgeElement) {
        console.debug('Edge clicked:', edgeElement);
        this.handleEdgeClick(edgeElement);
        return;
      }

      // Start with the most specific approach - look for .node class
      let nodeElement = event.target.closest('.node');

      // If not found, check if we clicked on a polygon/ellipse/text that's part of a node
      if (!nodeElement) {
        let current = event.target;
        while (current && current !== svg) {
          // Check if current element is a 'g' element with class 'node'
          if (current.tagName === 'g' &&
            (current.classList.contains('node') ||
              (current.className && current.className.baseVal && current.className.baseVal.includes('node')))) {
            nodeElement = current;
            break;
          }
          current = current.parentElement;
        }
      }

      // If still not found, try looking for g elements that have a direct title child
      // but be more selective to avoid picking up graph-level elements
      if (!nodeElement) {
        let current = event.target;
        while (current && current !== svg) {
          if (current.tagName === 'g') {
            const titleElement = current.querySelector(':scope > title');
            // Only consider it a node if it has a direct title child and isn't the graph root
            if (titleElement && current !== svg.firstElementChild) {
              // Additional check: make sure this g element contains node-like elements
              const hasNodeElements = current.querySelector('ellipse, polygon, rect') ||
                current.querySelector('text');
              if (hasNodeElements) {
                nodeElement = current;
                break;
              }
            }
          }
          current = current.parentElement;
        }
      }

      console.debug('Found node element:', nodeElement);

      if (!nodeElement) {
        console.debug('No node element found for click');
        return;
      }

      // Only handle if we're not dragging
      if (this.state.isDragging) {
        console.debug('Ignoring click because isDragging is true');
        return;
      }

      // Get the node ID from the title element
      const titleElement = nodeElement.querySelector('title');
      console.debug('Title element:', titleElement);

      if (!titleElement) {
        console.debug('No title element found in node');
        return;
      }

      const nodeId = titleElement.textContent.trim();
      console.debug('Extracted node ID:', nodeId);
      console.debug('Node element classes:', nodeElement.className);
      console.debug('Node element position in DOM:', Array.from(svg.querySelectorAll('g')).indexOf(nodeElement));

      if (!nodeId) {
        console.debug('No node ID found in title');
        return;
      }

      console.debug('Node clicked via delegation:', nodeId);

      // Prevent event from bubbling up to pan handler
      event.stopPropagation();

      this.handleNodeClick(nodeId);
    };

    // Add the delegated handler
    svg.addEventListener('click', this.svgClickHandler);
    console.debug('Added delegated click handler to SVG');

    // Better approach: Use CSS to handle pointer events properly
    const style = document.createElement('style');
    style.textContent = `
      /* Allow clicks to pass through background elements to nodes */
      svg polygon[fill="white"][stroke="transparent"] {
        pointer-events: none;
      }
      /* Ensure node elements can receive clicks */
      svg .node, svg g[class*="node"] {
        pointer-events: auto;
      }
      svg .node *, svg g[class*="node"] * {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    // Store reference to clean up later
    this.clickStyleElement = style;

    // Add hover styles to nodes
    nodeElements.forEach(nodeElement => {
      nodeElement.style.cursor = 'pointer';

      // Also set cursor on all child elements to ensure clicks work
      const childElements = nodeElement.querySelectorAll('*');
      childElements.forEach(child => {
        child.style.cursor = 'pointer';
      });

      console.debug('Set cursor pointer on node and children:', nodeElement);
    });

    // Also try to find nodes using alternative methods and set cursor
    const allGElements = svg.querySelectorAll('g');
    const nodesWithTitles = Array.from(allGElements).filter(g => g.querySelector('title'));
    nodesWithTitles.forEach(node => {
      node.style.cursor = 'pointer';
      const childElements = node.querySelectorAll('*');
      childElements.forEach(child => {
        child.style.cursor = 'pointer';
      });
    });

    // Add cursor styling for edges
    const edgeElements = svg.querySelectorAll('.edge');
    edgeElements.forEach(edgeElement => {
      edgeElement.style.cursor = 'pointer';

      // Also set cursor on all child elements (paths, text, etc.)
      const childElements = edgeElement.querySelectorAll('*');
      childElements.forEach(child => {
        child.style.cursor = 'pointer';
      });

      console.debug('Set cursor pointer on edge and children:', edgeElement);
    });

    // Also find edges using alternative methods
    const edgesWithTitles = Array.from(allGElements).filter(g => {
      const title = g.querySelector('title');
      return title && title.textContent.includes('->');
    });
    edgesWithTitles.forEach(edge => {
      edge.style.cursor = 'pointer';
      const childElements = edge.querySelectorAll('*');
      childElements.forEach(child => {
        child.style.cursor = 'pointer';
      });
    });

    console.debug('Setup complete for', nodeElements.length, 'nodes, plus', nodesWithTitles.length, 'alternative nodes, and', edgeElements.length + edgesWithTitles.length, 'edges');
  };

  // Handle node click to open edit modal
  handleNodeClick = (nodeId) => {
    console.debug('handleNodeClick called with nodeId:', nodeId);

    // Ensure digraph is up to date with current content
    try {
      this.digraph = fromDot(this.state.currentContent);
      console.debug('Updated digraph from current content');
    } catch (error) {
      console.warn('Could not update digraph in handleNodeClick:', error);
    }

    if (!this.digraph) {
      console.warn('No digraph available');
      return;
    }

    try {
      // Find the node in the digraph
      let node = this.digraph.getNode(nodeId);
      console.debug('Looking for node in digraph:', {
        nodeId,
        digraphNodes: this.digraph.nodes.map(n => ({ id: n.id, label: n.attributes?.label })),
        nodeFound: !!node
      });
      let selectedNode;

      if (node) {
        // Node found in digraph - try to get the best label
        let nodeLabel = node.attributes?.label;

        // If no label in attributes or label is same as ID, try to get from SVG text
        if (!nodeLabel || nodeLabel === nodeId) {
          // Try multiple approaches to find the SVG text element
          let svgLabel = null;

          // Approach 1: Find by title element
          const titleElement = this.graphRef.current?.querySelector(`title`);
          const titleElements = this.graphRef.current?.querySelectorAll('title');
          let nodeElement = null;

          for (const title of titleElements) {
            if (title.textContent?.trim() === nodeId) {
              nodeElement = title.parentElement;
              break;
            }
          }

          if (nodeElement) {
            const textElement = nodeElement.querySelector('text');
            svgLabel = textElement?.textContent?.trim();
          }

          // Approach 2: If not found, try to find the node element directly by class and look for matching text
          if (!svgLabel) {
            const nodeElements = this.graphRef.current?.querySelectorAll('.node');
            for (const element of nodeElements) {
              const titleEl = element.querySelector('title');
              if (titleEl?.textContent?.trim() === nodeId) {
                const textEl = element.querySelector('text');
                svgLabel = textEl?.textContent?.trim();
                break;
              }
            }
          }

          console.debug('SVG label extraction attempts:', {
            nodeId,
            approach1Result: svgLabel,
            totalTitleElements: titleElements.length,
            foundNodeElement: !!nodeElement
          });

          // Use SVG text if it's different from the node ID and not empty
          if (svgLabel && svgLabel !== nodeId) {
            nodeLabel = svgLabel;
          }
        }

        // Final fallback to nodeId
        nodeLabel = nodeLabel || nodeId;

        console.debug('Node found in digraph:', {
          nodeId,
          nodeAttributes: node.attributes,
          attributeLabel: node.attributes?.label,
          finalLabel: nodeLabel
        });

        selectedNode = {
          id: nodeId,
          label: nodeLabel,
          shape: node.attributes?.shape,
          fillcolor: node.attributes?.fillcolor,
          style: node.attributes?.style,
          ...node.attributes // Include any other attributes
        };
      } else {
        // Node not found in digraph - create a basic node object
        console.warn('Node not found in digraph, creating basic node:', nodeId);

        // Try to get label from the SVG text element
        const nodeElement = this.graphRef.current?.querySelector(`[title="${nodeId}"]`)?.parentElement;
        const textElement = nodeElement?.querySelector('text');
        const displayLabel = textElement?.textContent || nodeId;

        console.debug('Fallback node creation:', {
          nodeId,
          nodeElement: !!nodeElement,
          textElement: !!textElement,
          extractedLabel: displayLabel
        });

        selectedNode = {
          id: nodeId,
          label: displayLabel,
          shape: 'box',
          fillcolor: '#f0f0f0',
          style: 'filled'
        };

        // Add the node to digraph if it doesn't exist
        try {
          const { Node } = require('ts-graphviz');
          const newNode = new Node(nodeId, {
            label: displayLabel,
            shape: 'box',
            fillcolor: '#f0f0f0',
            style: 'filled'
          });
          this.digraph.addNode(newNode);
        } catch (addError) {
          console.warn('Could not add node to digraph:', addError);
        }
      }

      console.debug('Opening modal with selectedNode:', selectedNode);

      // Open the node modal
      this.setState({
        selectedNode,
        nodeModalOpen: true
      });

    } catch (error) {
      console.error('Error handling node click:', error);

      // Fallback: create a minimal node object
      const selectedNode = {
        id: nodeId,
        label: nodeId,
        shape: 'box',
        fillcolor: '#f0f0f0',
        style: 'filled'
      };

      this.setState({
        selectedNode,
        nodeModalOpen: true
      });
    }
  };

  // Handle edge click to open edit modal
  handleEdgeClick = (edgeElement) => {
    console.debug('handleEdgeClick called with edgeElement:', edgeElement);

    if (this.state.isDragging) {
      console.debug('Ignoring edge click because isDragging is true');
      return;
    }

    // Get the edge ID from the title element
    const titleElement = edgeElement.querySelector('title');
    if (!titleElement) {
      console.debug('No title element found in edge');
      return;
    }

    const edgeTitle = titleElement.textContent.trim();
    console.debug('Edge title:', edgeTitle);

    // Parse edge title to extract source and target nodes
    // Edge titles are typically in format "sourceNode->targetNode" or "sourceNode -- targetNode"
    const edgeMatch = edgeTitle.match(/(.+?)\s*(?:->|--)\s*(.+)/);
    if (!edgeMatch) {
      console.debug('Could not parse edge title:', edgeTitle);
      return;
    }

    const sourceNodeId = edgeMatch[1].trim();
    const targetNodeId = edgeMatch[2].trim();

    // Find the edge in the digraph to get its attributes
    let edgeAttributes = {};
    if (this.digraph) {
      const edge = this.digraph.edges.find(e => {
        if (!e || !e.targets || e.targets.length < 2) return false;

        const edgeSource = e.targets[0];
        const edgeTarget = e.targets[1];

        const edgeSourceId = typeof edgeSource === 'object' ? edgeSource.id : String(edgeSource);
        const edgeTargetId = typeof edgeTarget === 'object' ? edgeTarget.id : String(edgeTarget);

        return edgeSourceId === sourceNodeId && edgeTargetId === targetNodeId;
      });

      if (edge) {
        edgeAttributes = edge.attributes || {};
      }
    }

    const selectedEdge = {
      sourceNodeId,
      targetNodeId,
      label: edgeAttributes.label || '',
      ...edgeAttributes
    };

    console.debug('Opening edge modal with selectedEdge:', selectedEdge);

    // Prevent event from bubbling up to pan handler
    event.stopPropagation();

    this.setState({
      selectedEdge,
      edgeModalOpen: true
    });
  };

  // Fit the graph to the viewport
  fitGraphToViewport = () => {
    if (!this.graphRef.current) return;
    const container = this.graphRef.current;
    const svg = container.querySelector('svg');
    if (!svg) return;

    try {
      // Get the SVG's natural size
      const svgBBox = svg.getBBox();
      const containerRect = container.getBoundingClientRect();

      // Calculate the scale needed to fit the graph
      const containerWidth = containerRect.width || this.state.width || 800;
      const containerHeight = containerRect.height || this.state.height || 600;

      // Add padding (10% on each side)
      const padding = 0.1;
      const availableWidth = containerWidth * (1 - 2 * padding);
      const availableHeight = containerHeight * (1 - 2 * padding);

      const scaleX = availableWidth / svgBBox.width;
      const scaleY = availableHeight / svgBBox.height;
      const scale = Math.min(scaleX, scaleY, this.state.maxZoom);

      // Ensure minimum zoom
      const finalScale = Math.max(scale, this.state.minZoom);

      // Calculate center position
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      const graphCenterX = (svgBBox.x + svgBBox.width / 2) * finalScale;
      const graphCenterY = (svgBBox.y + svgBBox.height / 2) * finalScale;

      const panX = centerX - graphCenterX;
      const panY = centerY - graphCenterY;

      // Update state and apply transform
      this.setState({
        zoomLevel: finalScale,
        panX,
        panY
      }, () => {
        this.applyViewportTransform();
      });
    } catch (error) {
      console.warn('Error fitting graph to viewport:', error);
      // Fallback to default zoom
      this.setState({
        zoomLevel: 1,
        panX: 0,
        panY: 0
      }, () => {
        this.applyViewportTransform();
      });
    }
  };

  // Apply current viewport transform
  applyViewportTransform = () => {
    if (!this.graphRef.current) return;
    const svg = this.graphRef.current.querySelector('svg');
    if (!svg) return;
    const { zoomLevel, panX, panY } = this.state;
    console.debug('applyViewportTransform: panX:', panX, 'panY:', panY, 'zoomLevel:', zoomLevel);

    // Find or create a viewport wrapper group
    let viewportGroup = svg.querySelector('g.viewport-wrapper');
    let graphGroup = null;

    if (viewportGroup) {
      // If viewport wrapper exists, get the graph group inside it
      graphGroup = viewportGroup.querySelector('g');
    } else {
      // Otherwise, get the first g element that's not a viewport wrapper
      graphGroup = svg.querySelector('g:not(.viewport-wrapper)');
      if (!graphGroup) {
        // Fallback to first g element
        graphGroup = svg.querySelector('g');
      }
    }

    if (!viewportGroup && graphGroup) {
      // Create a wrapper group for viewport transforms
      viewportGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      viewportGroup.setAttribute('class', 'viewport-wrapper');

      // Move the original graph group inside the viewport wrapper
      svg.insertBefore(viewportGroup, graphGroup);
      viewportGroup.appendChild(graphGroup);

      console.debug('applyViewportTransform: created viewport wrapper');
    }

    if (viewportGroup) {
      const transformString = `translate(${panX}, ${panY}) scale(${zoomLevel})`;
      // Only update if transform has changed to avoid unnecessary reflows
      if (viewportGroup.getAttribute('transform') !== transformString) {
        console.debug('applyViewportTransform: applying transform to viewport wrapper:', transformString);
        viewportGroup.setAttribute('transform', transformString);
      }

      // Adjust SVG viewBox to accommodate the transform
      const containerRect = this.graphRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width || this.state.width || 800;
      const containerHeight = containerRect.height || this.state.height || 600;

      // Set viewBox to match container size so transforms work properly
      svg.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');

      console.debug('applyViewportTransform: updated viewBox to:', `0 0 ${containerWidth} ${containerHeight}`);
    }
  };

  // Zoom in/out methods
  zoomIn = () => {
    this.setState(prevState => {
      const newZoom = Math.min(prevState.zoomLevel * 1.2, prevState.maxZoom);
      return { zoomLevel: newZoom };
    }, this.applyViewportTransform);
  };

  zoomOut = () => {
    this.setState(prevState => {
      const newZoom = Math.max(prevState.zoomLevel / 1.2, prevState.minZoom);
      return { zoomLevel: newZoom };
    }, this.applyViewportTransform);
  };

  // Reset zoom to fit
  resetZoom = () => {
    this.fitGraphToViewport();
  };

  // Center the view at current zoom level
  centerView = () => {
    if (!this.graphRef.current) {
      console.debug('centerView: No graphRef.current');
      return;
    }

    const container = this.graphRef.current;
    const svg = container.querySelector('svg');
    if (!svg) {
      console.debug('centerView: No SVG found');
      return;
    }

    try {
      // Get the main graph group and temporarily reset its transform to get original bounding box
      const graphGroup = svg.querySelector('g');

      // Temporarily set transform to identity to get original bounding box
      if (graphGroup) {
        graphGroup.setAttribute('transform', 'translate(0,0) scale(1)');
      }

      const svgBBox = svg.getBBox();
      const containerRect = container.getBoundingClientRect();

      console.debug('centerView: original svgBBox:', svgBBox);
      console.debug('centerView: containerRect:', containerRect);

      const containerWidth = containerRect.width || this.state.width || 800;
      const containerHeight = containerRect.height || this.state.height || 600;

      const { zoomLevel } = this.state;

      // Calculate center position at current zoom level using original bounding box
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      const graphCenterX = (svgBBox.x + svgBBox.width / 2) * zoomLevel;
      const graphCenterY = (svgBBox.y + svgBBox.height / 2) * zoomLevel;

      const panX = centerX - graphCenterX;
      const panY = centerY - graphCenterY;

      console.debug('centerView: calculated panX:', panX, 'panY:', panY);

      // Validate the calculated values - if they're extreme, something went wrong
      const maxPan = Math.max(containerWidth, containerHeight) * 2; // Allow reasonable pan range
      if (Math.abs(panX) > maxPan || Math.abs(panY) > maxPan || !isFinite(panX) || !isFinite(panY)) {
        console.warn('centerView: Calculated pan values are extreme, using default position');
        this.setState({
          panX: 0,
          panY: 0,
          zoomLevel: 1,
          autoFit: false
        }, this.applyViewportTransform);
        return;
      }

      this.setState({
        panX,
        panY,
        autoFit: false // Disable auto-fit when manually centering
      }, this.applyViewportTransform);
    } catch (error) {
      console.warn('Error centering view:', error);
    }
  };

  // Toggle auto-fit
  toggleAutoFit = () => {
    this.setState(prevState => ({
      autoFit: !prevState.autoFit
    }), () => {
      if (this.state.autoFit) {
        this.fitGraphToViewport();
      }
    });
  };

  // Handle mouse wheel zoom
  handleWheelZoom = (event) => {
    event.preventDefault();

    const { zoomLevel, minZoom, maxZoom } = this.state;
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoomLevel * zoomFactor, minZoom), maxZoom);

    if (newZoom !== zoomLevel) {
      // Calculate zoom center based on mouse position
      const rect = this.graphRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Adjust pan to zoom toward mouse position
      const scaleDiff = newZoom / zoomLevel;
      const newPanX = mouseX - (mouseX - this.state.panX) * scaleDiff;
      const newPanY = mouseY - (mouseY - this.state.panY) * scaleDiff;

      this.setState({
        zoomLevel: newZoom,
        panX: newPanX,
        panY: newPanY,
        autoFit: false // Disable auto-fit when manually zooming
      }, this.applyViewportTransform);
    }
  };

  // Handle pan/drag
  handleMouseDown = (event) => {
    if (event.button !== 0) return; // Only left mouse button

    event.preventDefault();
    const startX = event.clientX - this.state.panX;
    const startY = event.clientY - this.state.panY;

    // Track initial mouse position to detect actual dragging
    const initialX = event.clientX;
    const initialY = event.clientY;
    let hasMoved = false;

    // Change cursor to grabbing
    if (this.graphRef.current) {
      this.graphRef.current.style.cursor = 'grabbing';
    }

    const handleMouseMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - initialX);
      const deltaY = Math.abs(moveEvent.clientY - initialY);

      // Consider it dragging if moved more than 5 pixels
      if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
        this.setState({ isDragging: true });
      }

      const newPanX = moveEvent.clientX - startX;
      const newPanY = moveEvent.clientY - startY;

      this.setState({
        panX: newPanX,
        panY: newPanY,
        autoFit: false // Disable auto-fit when manually panning
      }, this.applyViewportTransform);
    };

    const handleMouseUp = () => {
      // Reset cursor
      if (this.graphRef.current) {
        this.graphRef.current.style.cursor = 'grab';
      }

      // Reset dragging state after a short delay to prevent immediate node clicks
      setTimeout(() => {
        this.setState({ isDragging: false });
      }, 100);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle touch events for mobile
  handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      // Single touch - pan
      event.preventDefault();
      const touch = event.touches[0];
      const startX = touch.clientX - this.state.panX;
      const startY = touch.clientY - this.state.panY;

      // Track initial touch position to detect actual dragging
      const initialX = touch.clientX;
      const initialY = touch.clientY;
      let hasMoved = false;

      const handleTouchMove = (moveEvent) => {
        if (moveEvent.touches.length === 1) {
          const moveTouch = moveEvent.touches[0];

          const deltaX = Math.abs(moveTouch.clientX - initialX);
          const deltaY = Math.abs(moveTouch.clientY - initialY);

          // Consider it dragging if moved more than 10 pixels (higher threshold for touch)
          if (deltaX > 10 || deltaY > 10) {
            hasMoved = true;
            this.setState({ isDragging: true });
          }

          const newPanX = moveTouch.clientX - startX;
          const newPanY = moveTouch.clientY - startY;

          this.setState({
            panX: newPanX,
            panY: newPanY,
            autoFit: false
          }, this.applyViewportTransform);
        }
      };

      const handleTouchEnd = () => {
        // Reset dragging state after a short delay to prevent immediate node clicks
        setTimeout(() => {
          this.setState({ isDragging: false });
        }, 150); // Slightly longer delay for touch

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

    } else if (event.touches.length === 2) {
      // Two finger pinch - zoom
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const initialZoom = this.state.zoomLevel;

      // Set dragging state for pinch zoom
      this.setState({ isDragging: true });

      const handleTouchMove = (moveEvent) => {
        if (moveEvent.touches.length === 2) {
          const moveTouch1 = moveEvent.touches[0];
          const moveTouch2 = moveEvent.touches[1];
          const currentDistance = Math.sqrt(
            Math.pow(moveTouch2.clientX - moveTouch1.clientX, 2) +
            Math.pow(moveTouch2.clientY - moveTouch1.clientY, 2)
          );

          const scale = currentDistance / initialDistance;
          const newZoom = Math.min(
            Math.max(initialZoom * scale, this.state.minZoom),
            this.state.maxZoom
          );

          this.setState({
            zoomLevel: newZoom,
            autoFit: false
          }, this.applyViewportTransform);
        }
      };

      const handleTouchEnd = () => {
        // Reset dragging state after a delay
        setTimeout(() => {
          this.setState({ isDragging: false });
        }, 150);

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  async updateContentAndRender () {
    try {
      const newContent = toDot(this.digraph);
      // Parse and update AST first, before setState
      this.parseDotToAST(newContent);
      this.setState({ currentContent: newContent });
      await this.renderDotContent(newContent, false);
    } catch (error) {
      console.error('Error in updateContentAndRender:', error);
    }
  }

  handleTextareaChange = async (event) => {
    const newContent = event.target.value;
    this.setState({ currentContent: newContent });
    // Parse new content and update digraph if valid
    try {
      const ast = parser(newContent);
      this.setState({ ast, error: null });
      this.digraph = fromDot(newContent);
    } catch (error) {
      this.setState({ error: `Parse error: ${error.message}`, ast: null });
      // Do not update this.digraph
    }
    await this.renderDotContent(newContent, false); // Changed to false to trigger save
  };

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
    let digraph;
    try {
      digraph = fromDot(this.state.currentContent);
    } catch (error) {
      this.setState({ error: `Parse error: ${error.message}` });
      return;
    }
    this.digraph = digraph;

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
    console.debug(`addEdge called: ${fromNodeId} -> ${toNodeId}`);

    let digraph;
    try {
      digraph = fromDot(this.state.currentContent);
      console.debug('Successfully parsed digraph from current content');
      console.debug('Digraph nodes:', digraph.nodes.map(n => n.id));
    } catch (error) {
      console.error('Parse error in addEdge:', error);
      this.setState({ error: `Parse error: ${error.message}` });
      return;
    }
    this.digraph = digraph;

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

      // Try to find the nodes in the digraph
      let fromNode = this.digraph.getNode(fromNodeId);
      let toNode = this.digraph.getNode(toNodeId);

      console.debug('Node lookup results:', {
        fromNodeId,
        toNodeId,
        fromNodeFound: !!fromNode,
        toNodeFound: !!toNode
      });

      // If nodes don't exist, try to create them
      if (!fromNode) {
        console.warn(`addEdge: fromNode "${fromNodeId}" not found, creating it`);
        try {
          fromNode = new Node(fromNodeId, { label: fromNodeId });
          this.digraph.addNode(fromNode);
          console.debug('Successfully created fromNode');
        } catch (createError) {
          console.error('Failed to create fromNode:', createError);
          return;
        }
      }

      if (!toNode) {
        console.warn(`addEdge: toNode "${toNodeId}" not found, creating it`);
        try {
          toNode = new Node(toNodeId, { label: toNodeId });
          this.digraph.addNode(toNode);
          console.debug('Successfully created toNode');
        } catch (createError) {
          console.error('Failed to create toNode:', createError);
          return;
        }
      }

      // Double-check that we have both nodes
      if (!fromNode || !toNode) {
        console.error('addEdge: One or both nodes could not be found or created', {
          fromNodeId,
          toNodeId,
          fromNode: !!fromNode,
          toNode: !!toNode
        });
        return;
      }

      // Create edge using actual Node objects
      const edge = new Edge([fromNode, toNode], attributes || {});
      this.digraph.addEdge(edge);

      console.debug(`Successfully added edge: ${fromNodeId} -> ${toNodeId}`);

      // Update content and render using ts-graphviz
      this.updateContentAndRender();
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  }

  // Add a subgraph using ts-graphviz
  addSubgraph (label = 'Subgraph', nodes = []) {
    let digraph;
    try {
      digraph = fromDot(this.state.currentContent);
    } catch (error) {
      this.setState({ error: `Parse error: ${error.message}` });
      return;
    }
    this.digraph = digraph;
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

  // Update node attributes using ts-graphviz
  updateNodeAttributes = (nodeId, newAttributes) => {
    let digraph;
    try {
      digraph = fromDot(this.state.currentContent);
    } catch (error) {
      this.setState({ error: `Parse error: ${error.message}` });
      return;
    }
    this.digraph = digraph;

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
    let digraph;
    try {
      digraph = fromDot(this.state.currentContent);
    } catch (error) {
      this.setState({ error: `Parse error: ${error.message}` });
      return;
    }
    this.digraph = digraph;

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

      // Close modal and update content
      this.setState({ nodeModalOpen: false });
      this.updateContentAndRender();
    } catch (error) {
      console.error('Error removing node:', error);
    }
  };

  // Remove a specific edge
  removeEdge = (sourceId, targetId) => {
    console.debug(`removeEdge called: ${sourceId} -> ${targetId}`);

    // Ensure we have a valid digraph
    if (!this.digraph) {
      try {
        this.digraph = fromDot(this.state.currentContent);
      } catch (error) {
        console.warn('Could not parse current content in removeEdge');
        this.setState({ error: `Parse error: ${error.message}` });
        return;
      }
    }

    try {
      // Find the edge to remove using the same logic as updateEdgeAttributes
      const edgeToRemove = this.digraph.edges.find(edge => {
        if (!edge || !edge.targets || edge.targets.length < 2) return false;

        try {
          const edgeSource = edge.targets[0];
          const edgeTarget = edge.targets[1];

          const edgeSourceId = typeof edgeSource === 'object' ? edgeSource.id : String(edgeSource);
          const edgeTargetId = typeof edgeTarget === 'object' ? edgeTarget.id : String(edgeTarget);

          return edgeSourceId === sourceId && edgeTargetId === targetId;
        } catch (err) {
          console.warn('Error checking edge for removal:', err);
          return false;
        }
      });

      if (edgeToRemove) {
        console.debug(`Found edge to remove: ${sourceId} -> ${targetId}`);
        this.digraph.removeEdge(edgeToRemove);
        console.debug(`Successfully removed edge: ${sourceId} -> ${targetId}`);
        this.updateContentAndRender();
      } else {
        console.warn(`Edge not found for removal: ${sourceId} -> ${targetId}`);
        console.debug('Available edges:', this.digraph.edges.map(edge => {
          if (!edge || !edge.targets || edge.targets.length < 2) return 'invalid edge';
          const source = edge.targets[0];
          const target = edge.targets[1];
          const sourceId = typeof source === 'object' ? source.id : String(source);
          const targetId = typeof target === 'object' ? target.id : String(target);
          return `${sourceId} -> ${targetId}`;
        }));
      }
    } catch (error) {
      console.error('Error removing edge:', error);
      this.setState({ error: `Error removing edge: ${error.message}` });
    }
  };

  // Update edge attributes
  updateEdgeAttributes = (sourceNodeId, targetNodeId, newAttributes) => {
    console.debug(`updateEdgeAttributes called: ${sourceNodeId} -> ${targetNodeId}`, newAttributes);

    // Ensure we have a valid digraph
    if (!this.digraph) {
      try {
        this.digraph = fromDot(this.state.currentContent);
      } catch (error) {
        console.warn('Could not parse current content in updateEdgeAttributes');
        this.setState({ error: `Parse error: ${error.message}` });
        return;
      }
    }

    try {
      // Find the edge to update
      const edgeToUpdate = this.digraph.edges.find(edge => {
        if (!edge || !edge.targets || edge.targets.length < 2) return false;
        try {
          const edgeSource = edge.targets[0];
          const edgeTarget = edge.targets[1];

          const edgeSourceId = typeof edgeSource === 'object' ? edgeSource.id : String(edgeSource);
          const edgeTargetId = typeof edgeTarget === 'object' ? edgeTarget.id : String(edgeTarget);

          return edgeSourceId === sourceNodeId && edgeTargetId === targetNodeId;
        } catch (err) {
          console.warn('Error checking edge:', err);
          return false;
        }
      });

      if (edgeToUpdate) {
        // Ensure attributes object exists
        if (!edgeToUpdate.attributes) {
          edgeToUpdate.attributes = {};
        }

        // Update the edge attributes
        Object.assign(edgeToUpdate.attributes, newAttributes);
        console.debug(`Successfully updated edge attributes: ${sourceNodeId} -> ${targetNodeId}`, edgeToUpdate.attributes);

        // Close modal and update content
        this.setState({ edgeModalOpen: false });
        this.updateContentAndRender();
      } else {
        console.warn(`Edge not found: ${sourceNodeId} -> ${targetNodeId}`);
      }
    } catch (error) {
      console.error('Error updating edge attributes:', error);
      this.setState({ error: `Error updating edge attributes: ${error.message}` });
    }
  };

  // Delete an edge
  deleteEdge = (sourceNodeId, targetNodeId) => {
    console.debug(`deleteEdge called: ${sourceNodeId} -> ${targetNodeId}`);

    if (window.confirm(`Are you sure you want to delete the edge from "${sourceNodeId}" to "${targetNodeId}"?`)) {
      this.removeEdge(sourceNodeId, targetNodeId);
      this.setState({ edgeModalOpen: false });
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

    // Ensure digraph is up to date before creating node options
    try {
      this.digraph = fromDot(this.state.currentContent);
    } catch (error) {
      console.warn('Could not update digraph in renderNodeModal:', error);
    }

    // Get all available nodes except the current one
    const nodes = this.digraph ? [...this.digraph.nodes].filter(node => node.id !== selectedNode.id) : [];
    console.debug('Available nodes for connections:', nodes.map(n => ({ id: n.id, label: n.attributes?.label })));
    const nodeOptions = nodes.map(node => {
      let label = node.attributes?.label;
      if (!label) {
        const digraphNode = this.digraph.getNode(node.id);
        label = digraphNode?.attributes?.label;
      }

      // If still no label, try to extract from current content or use ID as fallback
      if (!label) {
        // Try to find the label in the raw DOT content
        const dotContent = this.state.currentContent || '';
        const nodePattern = new RegExp(`"?${node.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?\\s*\\[([^\\]]+)\\]`, 'i');
        const match = dotContent.match(nodePattern);
        if (match) {
          const attributesString = match[1];
          const labelMatch = attributesString.match(/label\s*=\s*"([^"]+)"/i);
          if (labelMatch) {
            label = labelMatch[1];
          }
        }
      }

      label = label || node.id;

      console.debug('Generated node option:', { nodeId: node.id, extractedLabel: label });

      return {
        key: node.id,
        text: `${label} (${node.id})`, // Show both label and ID
        value: node.id
      };
    });

    console.debug('Generated nodeOptions:', nodeOptions);

    // Get current inputs and outputs for this node
    const { inputs: currentInputs, outputs: currentOutputs } = this.getCurrentInputsOutputs(selectedNode.id);
    console.debug('Current connections:', { inputs: currentInputs, outputs: currentOutputs });

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
        <Header icon='sitemap' content={`Edit Node: ${selectedNode.id}${selectedNode.label ? ` (${selectedNode.label})` : ''}`} />
        <Modal.Content>
          <Form>
            <Form.Input
              label='Label'
              placeholder='Enter a human-readable label for this node'
              value={selectedNode.label || ''}
              onChange={(e, { value }) => {
                const updatedNode = { ...selectedNode };
                updatedNode.label = value;
                this.setState({ selectedNode: updatedNode });
              }}
            />
            <Form.Dropdown
              label='Inputs'
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
              label='Outputs'
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
              const displayName = selectedNode.label ? `"${selectedNode.label}" (${selectedNode.id})` : `"${selectedNode.id}"`;
              if (window.confirm(`Are you sure you want to remove the node ${displayName}? This will also remove all connected edges.`)) {
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

  renderEdgeModal () {
    const { edgeModalOpen, selectedEdge } = this.state;
    if (!selectedEdge) return null;
    return (
      <Modal
        open={edgeModalOpen}
        onClose={() => this.setState({ edgeModalOpen: false })}
        size='small'
      >
        <Header icon='arrow right' content={`Edge: ${selectedEdge.sourceNodeId} → ${selectedEdge.targetNodeId}`} />
        <Modal.Content>
          <Form>
            <Form.Input
              label='Edge Label'
              placeholder='Enter edge label'
              value={selectedEdge.label || ''}
              onChange={(e, { value }) => {
                const updatedEdge = { ...selectedEdge };
                updatedEdge.label = value;
                this.setState({ selectedEdge: updatedEdge });
              }}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='red' onClick={() => this.setState({ edgeModalOpen: false })}>
            <Icon name='remove' /> Cancel
          </Button>
          <Button
            color='orange'
            onClick={() => this.deleteEdge(selectedEdge.sourceNodeId, selectedEdge.targetNodeId)}
          >
            <Icon name='trash' /> Delete Edge
          </Button>
          <Button color='green' onClick={() => {
            const attrs = {
              label: this.state.selectedEdge.label || ''
            };
            this.updateEdgeAttributes(this.state.selectedEdge.sourceNodeId, this.state.selectedEdge.targetNodeId, attrs);
          }}>
            <Icon name='checkmark' /> Update
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  // Toggle animations on/off
  toggleAnimations = () => {
    this.setState(prevState => ({
      animationsEnabled: !prevState.animationsEnabled
    }));
  };

  renderViewportToolbar () {
    const { externalEditMode, editMode } = this.props;
    const { zoomLevel, autoFit, minZoom, maxZoom, animationsEnabled, animationDuration } = this.state;
    const zoomPercentage = Math.round(zoomLevel * 100);
    const currentEditMode = externalEditMode !== undefined ? externalEditMode : editMode;
    return (
      <div style={{
        marginBottom: '1em',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5em',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e9ecef'
      }}>
        <Button.Group size='small'>
          {currentEditMode && (
            <>
              <Popup
                content='Add Node'
                trigger={
                  <Button icon onClick={() => this.addNode('New Node')} disabled={!this.state.ast}>
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
                  }} disabled={!this.state.ast}>
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
                  }} disabled={!this.state.ast}>
                    <Icon name='object group' />
                  </Button>
                }
              />
            </>
          )}
        </Button.Group>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
          <div style={{ fontSize: '0.8em', color: '#666' }}>
            Scroll to zoom • Drag to pan
          </div>
          <Popup
            content='Center View (Ctrl/Cmd + C)'
            trigger={
              <Button
                icon
                onClick={this.centerView}
                size='small'
              >
                <Icon name='crosshairs' />
              </Button>
            }
          />
          <Button.Group size='small'>
            <Popup
              content='Zoom Out (Ctrl/Cmd + -)'
              trigger={
                <Button
                  icon
                  onClick={this.zoomOut}
                  disabled={zoomLevel <= minZoom}
                >
                  <Icon name='zoom out' />
                </Button>
              }
            />
            <Popup
              content='Reset Zoom (Ctrl/Cmd + 0)'
              trigger={
                <Button
                  onClick={this.resetZoom}
                  style={{ minWidth: '60px' }}
                >
                  {zoomPercentage}%
                </Button>
              }
            />
            <Popup
              content='Zoom In (Ctrl/Cmd + +)'
              trigger={
                <Button
                  icon
                  onClick={this.zoomIn}
                  disabled={zoomLevel >= maxZoom}
                >
                  <Icon name='zoom in' />
                </Button>
              }
            />
          </Button.Group>
        </div>
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
            transition: stroke-width 0.2s ease, stroke 0.2s ease;
          }

          .node:hover ellipse {
            stroke: #2185d0;
            stroke-width: 3px;
          }

          .node polygon {
            stroke: #d4d4d5;
            stroke-width: 2px;
            transition: stroke-width 0.2s ease, stroke 0.2s ease;
          }

          .node:hover polygon {
            stroke: #2185d0;
            stroke-width: 3px;
          }

          .cluster text,
          .node text {
            font-family: Arvo, 'Helvetica Neue', Arial, Helvetica, sans-serif;
            pointer-events: none; /* Prevent text from interfering with click events */
          }

          .node {
            transition: opacity 0.2s ease;
            cursor: pointer !important;
          }

          .node * {
            cursor: pointer !important;
          }

          g[title] {
            cursor: pointer !important;
          }

          g[title] * {
            cursor: pointer !important;
          }

          .graph-container {
            position: relative;
            border: 1px solid #e1e1e1;
            border-radius: 4px;
            overflow: hidden;
            background: #fff;
          }

          .graph-container svg {
            display: block;
            width: 100%;
            height: 100%;
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
          {this.renderViewportToolbar()}
          <div
            ref={this.graphRef}
            className="graph-container"
            style={{
              width: '100%',
              height: height,
              marginBottom: showRawContent ? '1em' : 0,
              cursor: 'grab',
              touchAction: 'none' // Prevent default touch behaviors
            }}
            onWheel={this.handleWheelZoom}
            onMouseDown={this.handleMouseDown}
            onTouchStart={this.handleTouchStart}
            onClick={(event) => {
              console.debug('Graph container clicked:', event.target);
            }}
            onMouseEnter={() => {
              if (this.graphRef.current) {
                this.graphRef.current.style.cursor = 'grab';
              }
            }}
            onMouseLeave={() => {
              if (this.graphRef.current) {
                this.graphRef.current.style.cursor = 'default';
              }
            }}
          />
          {this.renderNodeModal()}
          {this.renderEdgeModal()}
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
