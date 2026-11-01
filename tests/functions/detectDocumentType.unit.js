'use strict';

const assert = require('assert');
const {
  detectDocumentType,
  documentTypes,
  isFileDocumentType,
  isTextDocumentType,
  looksLikeText,
  canvasStateSidecar,
  tagIngestedCanvases
} = require('../../functions/detectDocumentType');

function text (s) {
  return Buffer.from(s, 'utf8');
}

describe('detectDocumentType', function () {
  it('trusts leading bytes over a misleading extension', function () {
    const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]);
    const out = detectDocumentType({ name: 'notes.txt', mime: 'text/plain', bytes: png });
    assert.deepStrictEqual(out, { type: 'Image', mime: 'image/png', source: 'content' });
  });

  it('recognizes common binary signatures', function () {
    const cases = [
      [Buffer.from('%PDF-1.7\n'), 'File', 'application/pdf'],
      [Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')]), 'Audio', 'audio/wav'],
      [Buffer.from('ID3\x04\x00'), 'Audio', 'audio/mpeg'],
      [Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from('ftypisom')]), 'Video', 'video/mp4'],
      [Buffer.concat([Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), Buffer.from('....webm')]), 'Video', 'video/webm'],
      [Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'Image', 'image/jpeg']
    ];
    for (const [bytes, type, mime] of cases) {
      const out = detectDocumentType({ name: 'upload.bin', bytes });
      assert.strictEqual(out.type, type, mime);
      assert.strictEqual(out.mime, mime);
    }
  });

  it('uses the extension for text files', function () {
    assert.strictEqual(detectDocumentType({ name: 'README.md', bytes: text('Hello') }).type, 'Markdown');
    assert.strictEqual(detectDocumentType({ name: 'flow.dot', bytes: text('digraph { a -> b }') }).type, 'Graph');
    assert.strictEqual(detectDocumentType({ name: 'page.htm', bytes: text('hi') }).type, 'HTML');
  });

  it('sniffs text content when the extension says nothing', function () {
    assert.strictEqual(detectDocumentType({ name: 'page', bytes: text('<!DOCTYPE html><html></html>') }).type, 'HTML');
    assert.strictEqual(detectDocumentType({ name: 'g', bytes: text('strict digraph G {\n a -> b\n}') }).type, 'Graph');
    assert.strictEqual(detectDocumentType({ name: 'notes', bytes: text('# Title\n\nbody') }).type, 'Markdown');
    assert.strictEqual(detectDocumentType({ name: 'icon', bytes: text('<svg xmlns="http://www.w3.org/2000/svg"></svg>') }).type, 'Image');
    assert.deepStrictEqual(detectDocumentType({ name: 'plain', bytes: text('just words') }), { type: 'Text', mime: 'text/plain', source: 'content' });
  });

  it('falls back to extension, then browser MIME, for unknown binary', function () {
    const junk = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    assert.strictEqual(detectDocumentType({ name: 'clip.mov', bytes: junk }).type, 'Video');
    assert.deepStrictEqual(detectDocumentType({ name: 'x', mime: 'audio/x-foo', bytes: junk }), { type: 'Audio', mime: 'audio/x-foo', source: 'mime' });
    assert.deepStrictEqual(detectDocumentType({ name: 'x', bytes: junk }), { type: 'File', mime: 'application/octet-stream', source: 'default' });
  });

  it('tolerates a multi-byte character cut off at the end of the sample', function () {
    const euro = text('price: €');
    assert.strictEqual(looksLikeText(euro.subarray(0, euro.length - 1)), true);
    assert.strictEqual(looksLikeText(Buffer.from([0x41, 0x00, 0x42])), false);
    assert.strictEqual(looksLikeText(Buffer.from([0xC3, 0x28])), false);
  });

  it('classifies the selectable types', function () {
    assert.strictEqual(isFileDocumentType('Markdown'), true);
    assert.strictEqual(isFileDocumentType('Canvas'), true);
    assert.strictEqual(isFileDocumentType('Folder'), false);
    assert.strictEqual(isTextDocumentType('Graph'), true);
    assert.strictEqual(isTextDocumentType('Canvas'), true);
    assert.strictEqual(isTextDocumentType('Image'), false);
  });

  it('recognizes a Cursor canvas by its compound name', function () {
    const out = detectDocumentType({ name: 'reports/billing.canvas.tsx', bytes: text('export default function Canvas() { return null; }') });
    assert.deepStrictEqual(out, { type: 'Canvas', mime: 'text/x-cursor-canvas', source: 'extension' });
    assert.strictEqual(detectDocumentType({ name: 'notes.tsx', bytes: text('export const n = 1;') }).type, 'Text');
  });

  it('recognizes a canvas import when the name is not .canvas.tsx', function () {
    const source = 'import { Stack } from "cursor/canvas";\nexport default function C() { return null; }\n';
    assert.strictEqual(detectDocumentType({ name: 'widget.tsx', bytes: text(source) }).type, 'Canvas');
    assert.strictEqual(detectDocumentType({ name: 'readme.md', bytes: text(source) }).source, 'content');
    assert.strictEqual(detectDocumentType({ name: 'plain.txt', bytes: text("from 'cursor/canvas'") }).type, 'Canvas');
  });

  it('lets a real file signature win over a canvas name', function () {
    const png = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13]);
    assert.strictEqual(detectDocumentType({ name: 'shot.canvas.tsx', bytes: png }).type, 'Image');
  });

  it('lists every file type plus Folder from one catalog', function () {
    const types = documentTypes();
    const names = types.map((type) => type.name);
    ['Text', 'Markdown', 'HTML', 'Canvas', 'Graph', 'List', 'Image', 'Audio', 'Video', 'File', 'Folder'].forEach((name) => {
      assert.ok(names.includes(name), name);
    });
    const canvas = types.find((type) => type.name === 'Canvas');
    assert.strictEqual(canvas.mime, 'text/x-cursor-canvas');
    assert.strictEqual(canvas.file, true);
    assert.ok(canvas.description);
    const folder = types.find((type) => type.name === 'Folder');
    assert.strictEqual(folder.file, false);
    assert.strictEqual(types.filter((type) => !type.description).length, 0);
  });

  it('names the canvas state sidecar and tags ingested canvases', function () {
    assert.strictEqual(canvasStateSidecar('dir/weekly.canvas.tsx'), 'dir/weekly.canvas.data.json');
    assert.strictEqual(canvasStateSidecar('notes.md'), null);
    const docs = [
      { pageContent: 'hello', metadata: { source: '/tmp/weekly.canvas.tsx' } },
      { pageContent: 'import { H1 } from \'cursor/canvas\';\n', metadata: { source: '/tmp/other.tsx' } },
      { pageContent: 'export const n = 1;', metadata: { source: '/tmp/plain.tsx' } }
    ];
    tagIngestedCanvases(docs);
    assert.strictEqual(docs[0].metadata.fabric_type, 'Canvas');
    assert.strictEqual(docs[1].metadata.fabric_type, 'Canvas');
    assert.strictEqual(docs[2].metadata.fabric_type, undefined);
  });
});
