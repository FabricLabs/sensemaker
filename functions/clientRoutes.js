'use strict';

// Must mirror every `<Route path>` in components/Dashboard.js, components/SensemakerUI.js and components/Splash.js
// (enforced by tests/functions/clientRoutes.unit.js).
const CLIENT_ROUTES = [
  '/',
  '/agents',
  '/agents/:id',
  '/alerts',
  '/applications',
  '/applications/authorized',
  '/applications/:id',
  '/contracts',
  '/contracts/terms-of-use',
  '/conversations',
  '/conversations/:id',
  '/documents',
  '/documents/:fabricID',
  '/features',
  '/groups',
  '/groups/:id',
  '/inquiries',
  '/invitations/:id',
  '/jobs',
  '/keys',
  '/network',
  '/oauth/authorize',
  '/peers',
  '/peers/:id',
  '/people',
  '/services/bitcoin',
  '/services/bitcoin/blocks',
  '/services/bitcoin/blocks/:blockhash',
  '/services/bitcoin/transactions',
  '/services/bitcoin/transactions/:txhash',
  '/services/discord',
  '/services/discord/channels',
  '/services/discord/channels/:id',
  '/services/discord/guilds',
  '/services/discord/guilds/:id',
  '/services/discord/guilds/:id/channels',
  '/services/discord/guilds/:id/members',
  '/services/discord/users',
  '/services/discord/users/:id',
  '/services/disk',
  '/services/disk/:path',
  '/services/fabric',
  '/services/fabric/documents/:fabricID',
  '/services/github',
  '/services/global',
  '/services/invitations/:invitationToken',
  '/services/invitations/decline/:invitationToken',
  '/services/passwords/:resetToken',
  '/sessions',
  '/settings',
  '/settings/admin',
  '/settings/library',
  '/sources',
  '/sources/:id',
  '/tasks',
  '/tasks/:id',
  '/updates',
  '/uploads',
  '/users/:username'
];

function splitPath (path) {
  return String(path || '').split('/').filter(Boolean);
}

const COMPILED = CLIENT_ROUTES.map(splitPath);

function matchesPattern (pattern, segments) {
  if (pattern.length !== segments.length) return false;
  return pattern.every((part, i) => part.startsWith(':') ? segments[i].length > 0 : part === segments[i]);
}

function isClientRoute (path) {
  const segments = splitPath(path);
  return COMPILED.some((pattern) => matchesPattern(pattern, segments));
}

function wantsDocument (req) {
  if (!req || (req.method !== 'GET' && req.method !== 'HEAD')) return false;
  const accept = String((req.headers && req.headers.accept) || '');
  if (!accept.includes('text/html')) return false;
  return typeof req.accepts !== 'function' || req.accepts(['json', 'html']) === 'html';
}

module.exports = {
  CLIENT_ROUTES,
  isClientRoute,
  wantsDocument
};
