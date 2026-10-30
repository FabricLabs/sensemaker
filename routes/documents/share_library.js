'use strict';

async function ownedFolder (db, userId, fabricId) {
  return db('documents')
    .where({ fabric_id: fabricId })
    .andWhere('status', '!=', 'deleted')
    .andWhere(function () {
      this.where('creator', '=', userId).orWhere('owner', '=', userId);
    })
    .first();
}

function peersFrom (body) {
  const raw = body && (body.peers || body.peer);
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

function sendError (res, error) {
  if (error === 'not_found') {
    return res.status(404).json({ status: 'error', message: 'Folder not found.' });
  }
  if (error === 'not_folder') {
    return res.status(400).json({ status: 'error', message: 'Only a folder can be shared as a data library.' });
  }
  if (error === 'no_peers') {
    return res.status(400).json({ status: 'error', message: 'Name a peer public key to share with.' });
  }
  if (error === 'no_peer') {
    return res.status(503).json({ status: 'error', message: 'Fabric peer is not available.' });
  }
  return res.status(500).json({ status: 'error', message: 'Could not update the data library.' });
}

async function read (req, res) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const folder = await ownedFolder(this.db, req.user.id, req.params.fabricID);
  if (!folder) return res.status(404).json({ status: 'error', message: 'Folder not found.' });
  if (folder.fabric_type !== 'Folder') {
    return res.status(400).json({ status: 'error', message: 'Only a folder can be shared as a data library.' });
  }
  const described = await this.describeDataLibrary(req.params.fabricID);
  return res.json(described);
}

async function share (req, res) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const folder = await ownedFolder(this.db, req.user.id, req.params.fabricID);
  if (!folder) return res.status(404).json({ status: 'error', message: 'Folder not found.' });
  try {
    const result = await this.shareDataLibrary(req.params.fabricID, peersFrom(req.body));
    if (result && result.error) return sendError(res, result.error);
    return res.json(result);
  } catch (err) {
    if (err && err.code === 'no_peer') return sendError(res, 'no_peer');
    console.error('[DOCUMENTS:SHARE]', err && err.message ? err.message : err);
    return res.status(500).json({ status: 'error', message: 'Could not share the data library.' });
  }
}

async function revoke (req, res) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const folder = await ownedFolder(this.db, req.user.id, req.params.fabricID);
  if (!folder) return res.status(404).json({ status: 'error', message: 'Folder not found.' });
  try {
    const result = await this.revokeDataLibrary(req.params.fabricID, peersFrom(req.body));
    if (result && result.error) return sendError(res, result.error);
    return res.json(result);
  } catch (err) {
    if (err && err.code === 'no_peer') return sendError(res, 'no_peer');
    console.error('[DOCUMENTS:SHARE]', err && err.message ? err.message : err);
    return res.status(500).json({ status: 'error', message: 'Could not revoke the data library share.' });
  }
}

module.exports = {
  read,
  share,
  revoke
};
