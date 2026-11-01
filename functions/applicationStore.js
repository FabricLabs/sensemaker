'use strict';

/**
 * Knex-backed storage for Applications, user authorizations, and refresh tokens.
 * List columns (`redirect_uris`, `grant_types`, `scopes`) are JSON text.
 */

const LIST_COLUMNS = ['redirect_uris', 'grant_types', 'scopes'];

function parseList (value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function fromRow (row) {
  if (!row) return null;
  const out = Object.assign({}, row);
  for (const column of LIST_COLUMNS) out[column] = parseList(row[column]);
  return out;
}

function toRow (fields) {
  const out = Object.assign({}, fields);
  for (const column of LIST_COLUMNS) {
    if (out[column] !== undefined) out[column] = JSON.stringify(out[column] || []);
  }
  return out;
}

function fromAuthorization (row) {
  if (!row) return null;
  return Object.assign({}, row, { scopes: parseList(row.scopes) });
}

/**
 * @param {Function} db knex instance
 */
function createApplicationStore (db) {
  return {
    async findApplication (id) {
      return fromRow(await db('applications').where('id', id).first());
    },

    async findApplicationByClientId (clientId) {
      return fromRow(await db('applications').where('client_id', String(clientId)).first());
    },

    async listApplications (filter = {}) {
      const query = db('applications').orderBy('id', 'desc');
      if (filter.ownerId != null) query.where('owner_id', filter.ownerId);
      return (await query).map(fromRow);
    },

    async insertApplication (fields) {
      const ids = await db('applications').insert(toRow(fields));
      return this.findApplication(ids[0]);
    },

    async updateApplication (id, fields) {
      await db('applications').where('id', id).update(toRow(Object.assign({}, fields, { updated_at: new Date() })));
      return this.findApplication(id);
    },

    async findAuthorization (userId, applicationId) {
      return fromAuthorization(await db('application_authorizations')
        .where({ user_id: userId, application_id: applicationId })
        .whereNull('revoked_at')
        .first());
    },

    async saveAuthorization (userId, applicationId, scopes) {
      const existing = await this.findAuthorization(userId, applicationId);
      if (existing) {
        await db('application_authorizations').where('id', existing.id).update({
          scopes: JSON.stringify(scopes),
          updated_at: new Date()
        });
      } else {
        await db('application_authorizations').insert({
          user_id: userId,
          application_id: applicationId,
          scopes: JSON.stringify(scopes)
        });
      }
      return this.findAuthorization(userId, applicationId);
    },

    async listAuthorizations (userId) {
      const rows = await db('application_authorizations')
        .where('user_id', userId)
        .whereNull('revoked_at')
        .orderBy('updated_at', 'desc');
      return rows.map(fromAuthorization);
    },

    async revokeAuthorization (userId, applicationId) {
      await db('application_authorizations')
        .where({ user_id: userId, application_id: applicationId })
        .whereNull('revoked_at')
        .update({ revoked_at: new Date() });
    },

    async insertRefreshToken (fields) {
      await db('application_tokens').insert(fields);
    },

    async findRefreshToken (tokenHash) {
      return db('application_tokens').where('token_hash', tokenHash).first();
    },

    async markRefreshTokenReplaced (tokenHash, replacedBy) {
      await db('application_tokens').where('token_hash', tokenHash).update({
        replaced_by: replacedBy,
        revoked_at: new Date()
      });
    },

    async revokeRefreshTokens (filter) {
      const query = db('application_tokens').whereNull('revoked_at').where('application_id', filter.applicationId);
      if (filter.userId !== undefined) {
        if (filter.userId === null) query.whereNull('user_id');
        else query.where('user_id', filter.userId);
      }
      await query.update({ revoked_at: new Date() });
    },

    async findUser (id) {
      return db('users').where('id', id).first();
    }
  };
}

module.exports = {
  createApplicationStore,
  fromRow,
  parseList
};
