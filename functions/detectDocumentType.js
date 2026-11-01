'use strict';

/**
 * Document types a file upload may become, in the order shown to the user.
 * `text: true` types are stored as UTF-8 document content so the viewer
 * and editor can use them.
 */
const FILE_DOCUMENT_TYPES = [
  { name: 'Text', text: true, mime: 'text/plain', description: 'Plain text.' },
  { name: 'Markdown', text: true, mime: 'text/markdown', description: 'Markdown formatted text.' },
  { name: 'HTML', text: true, mime: 'text/html', description: 'HTML document.' },
  { name: 'Canvas', text: true, mime: 'text/x-cursor-canvas', description: 'Cursor canvas (.canvas.tsx).' },
  { name: 'Graph', text: true, mime: 'text/vnd.graphviz', description: 'Graphviz DOT graph.' },
  { name: 'List', text: true, mime: 'application/json', description: 'JSON list of items.' },
  { name: 'Image', text: false, mime: 'image/png', description: 'Picture.' },
  { name: 'Audio', text: false, mime: 'audio/mpeg', description: 'Sound recording.' },
  { name: 'Video', text: false, mime: 'video/mp4', description: 'Video recording.' },
  { name: 'File', text: false, mime: 'application/octet-stream', description: 'Opaque file (PDF, archive, other binary).' }
];

/** Empty canvas stored when one is created without a body. */
const CANVAS_STARTER = [
  'import { H1, Stack, Text } from "cursor/canvas";',
  '',
  'export default function Canvas() {',
  '  return (',
  '    <Stack gap={8}>',
  '      <H1>Canvas</H1>',
  '      <Text>Empty canvas.</Text>',
  '    </Stack>',
  '  );',
  '}',
  ''
].join('\n');

const CANVAS_IMPORT = /from\s+['"]cursor\/canvas['"]/;

const FILE_DOCUMENT_TYPE_NAMES = FILE_DOCUMENT_TYPES.map((t) => t.name);

/** Bytes to read from the start of a file for sniffing. */
const SNIFF_BYTES = 4096;

const EXTENSIONS = {
  txt: ['Text', 'text/plain'],
  text: ['Text', 'text/plain'],
  log: ['Text', 'text/plain'],
  csv: ['Text', 'text/csv'],
  tsv: ['Text', 'text/tab-separated-values'],
  md: ['Markdown', 'text/markdown'],
  markdown: ['Markdown', 'text/markdown'],
  html: ['HTML', 'text/html'],
  htm: ['HTML', 'text/html'],
  xhtml: ['HTML', 'application/xhtml+xml'],
  dot: ['Graph', 'text/vnd.graphviz'],
  gv: ['Graph', 'text/vnd.graphviz'],
  json: ['List', 'application/json'],
  png: ['Image', 'image/png'],
  jpg: ['Image', 'image/jpeg'],
  jpeg: ['Image', 'image/jpeg'],
  gif: ['Image', 'image/gif'],
  webp: ['Image', 'image/webp'],
  bmp: ['Image', 'image/bmp'],
  tif: ['Image', 'image/tiff'],
  tiff: ['Image', 'image/tiff'],
  svg: ['Image', 'image/svg+xml'],
  mp3: ['Audio', 'audio/mpeg'],
  wav: ['Audio', 'audio/wav'],
  ogg: ['Audio', 'audio/ogg'],
  oga: ['Audio', 'audio/ogg'],
  opus: ['Audio', 'audio/opus'],
  m4a: ['Audio', 'audio/mp4'],
  flac: ['Audio', 'audio/flac'],
  aac: ['Audio', 'audio/aac'],
  wma: ['Audio', 'audio/x-ms-wma'],
  mp4: ['Video', 'video/mp4'],
  m4v: ['Video', 'video/mp4'],
  mov: ['Video', 'video/quicktime'],
  mkv: ['Video', 'video/x-matroska'],
  webm: ['Video', 'video/webm'],
  avi: ['Video', 'video/x-msvideo'],
  wmv: ['Video', 'video/x-ms-wmv'],
  flv: ['Video', 'video/x-flv'],
  '3gp': ['Video', 'video/3gpp'],
  ogv: ['Video', 'video/ogg'],
  pdf: ['File', 'application/pdf'],
  zip: ['File', 'application/zip']
};

function toBytes (input) {
  if (!input) return new Uint8Array(0);
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return new Uint8Array(0);
}

function ascii (bytes, start, length) {
  let out = '';
  for (let i = start; i < start + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function startsWith (bytes, signature, offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Identify a binary format from its leading bytes.
 * @param {Uint8Array} bytes
 * @returns {{ type: string, mime: string }|null}
 */
function sniffMagic (bytes) {
  if (startsWith(bytes, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return { type: 'Image', mime: 'image/png' };
  if (startsWith(bytes, [0xFF, 0xD8, 0xFF])) return { type: 'Image', mime: 'image/jpeg' };
  if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') return { type: 'Image', mime: 'image/gif' };
  if (ascii(bytes, 0, 2) === 'BM' && bytes.length > 14) return { type: 'Image', mime: 'image/bmp' };
  if (startsWith(bytes, [0x49, 0x49, 0x2A, 0x00]) || startsWith(bytes, [0x4D, 0x4D, 0x00, 0x2A])) return { type: 'Image', mime: 'image/tiff' };
  if (ascii(bytes, 0, 4) === 'RIFF') {
    const form = ascii(bytes, 8, 4);
    if (form === 'WEBP') return { type: 'Image', mime: 'image/webp' };
    if (form === 'WAVE') return { type: 'Audio', mime: 'audio/wav' };
    if (form === 'AVI ') return { type: 'Video', mime: 'video/x-msvideo' };
  }
  if (ascii(bytes, 0, 5) === '%PDF-') return { type: 'File', mime: 'application/pdf' };
  if (ascii(bytes, 0, 4) === 'fLaC') return { type: 'Audio', mime: 'audio/flac' };
  if (ascii(bytes, 0, 3) === 'ID3') return { type: 'Audio', mime: 'audio/mpeg' };
  if (bytes.length > 1 && bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0 && (bytes[1] & 0x06) !== 0) {
    return { type: 'Audio', mime: 'audio/mpeg' };
  }
  if (ascii(bytes, 0, 4) === 'OggS') {
    const head = ascii(bytes, 0, Math.min(bytes.length, 64));
    if (head.includes('theora')) return { type: 'Video', mime: 'video/ogg' };
    if (head.includes('OpusHead')) return { type: 'Audio', mime: 'audio/opus' };
    return { type: 'Audio', mime: 'audio/ogg' };
  }
  if (startsWith(bytes, [0x1A, 0x45, 0xDF, 0xA3])) {
    const head = ascii(bytes, 0, Math.min(bytes.length, 64));
    return head.includes('webm') ? { type: 'Video', mime: 'video/webm' } : { type: 'Video', mime: 'video/x-matroska' };
  }
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    if (brand === 'M4A ' || brand === 'M4B ') return { type: 'Audio', mime: 'audio/mp4' };
    if (brand === 'qt  ') return { type: 'Video', mime: 'video/quicktime' };
    if (brand.startsWith('3g')) return { type: 'Video', mime: 'video/3gpp' };
    return { type: 'Video', mime: 'video/mp4' };
  }
  if (startsWith(bytes, [0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11])) return { type: 'Video', mime: 'video/x-ms-asf' };
  if (ascii(bytes, 0, 3) === 'FLV') return { type: 'Video', mime: 'video/x-flv' };
  if (startsWith(bytes, [0x50, 0x4B, 0x03, 0x04])) return { type: 'File', mime: 'application/zip' };
  if (startsWith(bytes, [0x1F, 0x8B])) return { type: 'File', mime: 'application/gzip' };
  return null;
}

/**
 * True when the sample has no NUL bytes and decodes as UTF-8. A multi-byte
 * sequence cut off at the end of the sample is allowed.
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
function looksLikeText (bytes) {
  if (!bytes.length) return true;
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b === 0) return false;
    let extra = 0;
    if (b < 0x80) extra = 0;
    else if ((b & 0xE0) === 0xC0) extra = 1;
    else if ((b & 0xF0) === 0xE0) extra = 2;
    else if ((b & 0xF8) === 0xF0) extra = 3;
    else return false;
    if (i + extra >= bytes.length) return true;
    for (let j = 1; j <= extra; j++) {
      if ((bytes[i + j] & 0xC0) !== 0x80) return false;
    }
    i += extra + 1;
  }
  return true;
}

function decodeText (bytes) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return Buffer.from(bytes).toString('utf8');
}

/**
 * Identify a text format from its opening characters.
 * @param {string} text
 * @returns {{ type: string, mime: string }|null}
 */
function sniffText (text) {
  const head = text.replace(/^\uFEFF/, '').trimStart().slice(0, 512);
  const lower = head.toLowerCase();
  if (lower.startsWith('<!doctype html') || lower.startsWith('<html') || /^<(head|body)[\s>]/.test(lower)) {
    return { type: 'HTML', mime: 'text/html' };
  }
  if (lower.startsWith('<svg') || (lower.startsWith('<?xml') && lower.includes('<svg'))) {
    return { type: 'Image', mime: 'image/svg+xml' };
  }
  if (/^(strict\s+)?(di)?graph\b[^{]*\{/.test(lower)) return { type: 'Graph', mime: 'text/vnd.graphviz' };
  if (head.startsWith('[')) return { type: 'List', mime: 'application/json' };
  if (/^#{1,6}\s/.test(head) || /^---\s*\n[\s\S]*?\n---/.test(head)) return { type: 'Markdown', mime: 'text/markdown' };
  return null;
}

function basename (name) {
  return String(name || '').split(/[\\/]/).pop();
}

function extensionOf (name) {
  const base = basename(name);
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/**
 * True when the file name is a Cursor canvas, whatever the last extension is.
 * `report.canvas.tsx` would otherwise look like plain TypeScript.
 * @param {string} name
 * @returns {boolean}
 */
function isCursorCanvasName (name) {
  return basename(name).toLowerCase().endsWith('.canvas.tsx');
}

/**
 * True when the text imports the Cursor canvas SDK.
 * @param {string} text
 * @returns {boolean}
 */
function isCursorCanvasSource (text) {
  return CANVAS_IMPORT.test(String(text || ''));
}

/**
 * True when a path or its text is a Cursor canvas.
 * @param {string} name
 * @param {string} [text]
 * @returns {boolean}
 */
function isCursorCanvasFile (name, text) {
  return isCursorCanvasName(name) || isCursorCanvasSource(text);
}

/**
 * Sidecar Cursor writes beside `name.canvas.tsx`. Null for any other name.
 * @param {string} name
 * @returns {string|null}
 */
function canvasStateSidecar (name) {
  if (!isCursorCanvasName(name)) return null;
  return String(name).replace(/\.canvas\.tsx$/i, '.canvas.data.json');
}

/**
 * Mark LangChain documents that are canvases so a directory ingest is not
 * anonymous text. Embeddings stay the file text.
 * @param {Array<Object>} docs
 * @returns {Array<Object>}
 */
function tagIngestedCanvases (docs) {
  if (!Array.isArray(docs)) return docs;
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (!doc) continue;
    const name = doc.metadata && doc.metadata.source ? doc.metadata.source : '';
    const text = typeof doc.pageContent === 'string' ? doc.pageContent : '';
    if (isCursorCanvasFile(name, text)) {
      doc.metadata = Object.assign({}, doc.metadata, { fabric_type: 'Canvas' });
    }
  }
  return docs;
}

/**
 * File types plus Folder, for the document type list.
 * @returns {Array<{ name: string, description: string, mime: string, text: boolean, file: boolean }>}
 */
function documentTypes () {
  const fileTypes = FILE_DOCUMENT_TYPES.map((t) => ({
    name: t.name,
    description: t.description,
    mime: t.mime,
    text: !!t.text,
    file: true
  }));
  fileTypes.push({
    name: 'Folder',
    description: 'Collection of documents.',
    mime: 'application/json',
    text: true,
    file: false
  });
  return fileTypes;
}

/**
 * Default MIME type for a catalog name.
 * @param {string} name
 * @returns {string}
 */
function mimeForDocumentType (name) {
  const entry = documentTypes().find((t) => t.name === name);
  return entry ? entry.mime : 'text/plain';
}

function typeFromMime (mime) {
  const m = String(mime || '').toLowerCase().split(';')[0].trim();
  if (!m || m === 'application/octet-stream') return null;
  if (m === 'image/svg+xml' || m.startsWith('image/')) return 'Image';
  if (m.startsWith('audio/')) return 'Audio';
  if (m.startsWith('video/')) return 'Video';
  if (m === 'text/markdown' || m === 'text/x-markdown') return 'Markdown';
  if (m === 'text/html' || m === 'application/xhtml+xml') return 'HTML';
  if (m === 'text/x-cursor-canvas') return 'Canvas';
  if (m === 'text/vnd.graphviz') return 'Graph';
  if (m === 'application/json') return 'List';
  if (m.startsWith('text/')) return 'Text';
  return 'File';
}

/**
 * Pick a document type for an uploaded file from its leading bytes, file
 * extension, and the MIME type the browser reported, strongest hint first.
 * @param {Object} input
 * @param {string} [input.name] Original file name.
 * @param {string} [input.mime] MIME type reported by the browser or multer.
 * @param {Uint8Array|ArrayBuffer|Buffer} [input.bytes] Leading bytes (or the whole file).
 * @returns {{ type: string, mime: string, source: string }}
 */
function detectDocumentType (input = {}) {
  const bytes = toBytes(input.bytes);
  const ext = extensionOf(input.name);
  const byExtension = EXTENSIONS[ext] || null;
  const reported = String(input.mime || '').split(';')[0].trim().toLowerCase();

  const magic = sniffMagic(bytes);
  if (magic) return { ...magic, source: 'content' };

  if (isCursorCanvasName(input.name)) {
    return { type: 'Canvas', mime: 'text/x-cursor-canvas', source: 'extension' };
  }

  const sample = bytes.subarray(0, SNIFF_BYTES);
  const isText = bytes.length > 0 && looksLikeText(sample);

  if (isText && isCursorCanvasSource(decodeText(bytes))) {
    return { type: 'Canvas', mime: 'text/x-cursor-canvas', source: 'content' };
  }

  if (isText) {
    const sniffed = sniffText(decodeText(sample));
    if (byExtension && FILE_DOCUMENT_TYPES.find((t) => t.name === byExtension[0]).text) {
      return { type: byExtension[0], mime: byExtension[1], source: 'extension' };
    }
    if (sniffed) return { ...sniffed, source: 'content' };
    if (byExtension) return { type: byExtension[0], mime: byExtension[1], source: 'extension' };
    const fromMime = typeFromMime(reported);
    if (fromMime && FILE_DOCUMENT_TYPES.find((t) => t.name === fromMime).text) {
      return { type: fromMime, mime: reported, source: 'mime' };
    }
    return { type: 'Text', mime: 'text/plain', source: 'content' };
  }

  if (byExtension) return { type: byExtension[0], mime: byExtension[1], source: 'extension' };

  const fromMime = typeFromMime(reported);
  if (fromMime) return { type: fromMime, mime: reported, source: 'mime' };

  return { type: 'File', mime: reported || 'application/octet-stream', source: 'default' };
}

/**
 * True when `name` is a document type a file upload may be stored as.
 * @param {string} name
 * @returns {boolean}
 */
function isFileDocumentType (name) {
  return FILE_DOCUMENT_TYPE_NAMES.includes(name);
}

/**
 * True when `name` is a type whose content is stored as UTF-8 text.
 * @param {string} name
 * @returns {boolean}
 */
function isTextDocumentType (name) {
  const entry = FILE_DOCUMENT_TYPES.find((t) => t.name === name);
  return !!(entry && entry.text);
}

module.exports = {
  FILE_DOCUMENT_TYPES,
  FILE_DOCUMENT_TYPE_NAMES,
  CANVAS_STARTER,
  SNIFF_BYTES,
  detectDocumentType,
  isFileDocumentType,
  isTextDocumentType,
  looksLikeText,
  isCursorCanvasName,
  isCursorCanvasSource,
  isCursorCanvasFile,
  canvasStateSidecar,
  tagIngestedCanvases,
  documentTypes,
  mimeForDocumentType
};
