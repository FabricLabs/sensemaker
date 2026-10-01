'use strict';

const fs = require('fs');
const path = require('path');

// Constants
const GENERICS = ['Actor', 'Key', 'Message'];
const IMPLEMENTATIONS = {
  Actor: [
    'Service', 'Chain', 'Block', 'Peer', 'State', 'Store',
    'Circuit', 'Machine', 'Tree', 'Label', 'Queue', 'Logger',
    'Federation', 'Contract', 'Swarm'
  ],
  Key: ['Identity', 'WalletKey'],
  Message: []
};
const OUTPUT_PATH = path.join('contracts', 'generics.dot');

/**
 * Generates a GraphViz DOT file showing relationships between Fabric's Generic types.
 * @returns {String} The generated DOT file content.
 */
function generateDOT () {
  const lines = [
    'digraph FabricGenerics {',
    '  // Layout',
    '  rankdir=LR;',
    '',
    '  // Generic types',
    ...GENERICS.map(type => `  ${type};`),
    '',
    '  // Core relationships',
    '  Actor -> Message [label="uses"];',
    '  Actor -> Key [label="uses"];',
    '  Message -> Actor [label="uses"];',
    '  Message -> Key [label="uses"];',
    '',
    '  // Implementations',
    ...Object.entries(IMPLEMENTATIONS).flatMap(([parent, children]) =>
      children.map(child => `  ${child} -> ${parent} [label="extends"];`)
    ),
    '}'
  ];

  return lines.join('\n');
}

/**
 * Main function to generate and write the DOT file.
 */
async function main () {
  try {
    // Generate DOT content
    const dot = generateDOT();

    // Ensure contracts directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write DOT file
    fs.writeFileSync(OUTPUT_PATH, dot);
    console.log(`Generated GraphViz DOT file at: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error generating generics diagram:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateDOT
}; 