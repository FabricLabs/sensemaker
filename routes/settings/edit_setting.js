'use strict';

const crypto = require('crypto');
const { GLOBAL_SETTINGS, HOSTED_LLM_POOL_SETTING_NAMES, DOCUMENT_RETRIEVAL_SETTING_NAME } = require('../../constants');

module.exports = async function (req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { setting } = req.params;
    const { value } = req.body;

    if (!setting) {
      return res.status(400).json({ error: 'Setting name is required' });
    }

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Setting value is required' });
    }

    if (HOSTED_LLM_POOL_SETTING_NAMES.includes(setting)) {
      const allowed = await this._userHasAdminAccess(req);
      if (!allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin session required to change a hosted LLM pool setting.'
        });
      }
    }

    // Determine if this is a global/system setting or user setting
    const isGlobalSetting = GLOBAL_SETTINGS.includes(setting);
    const settingType = isGlobalSetting ? 'GLOBAL' : 'USER';
    const userId = isGlobalSetting ? null : req.user.id;

    console.debug('[SETTINGS]', `Updating ${settingType} setting ${setting}${userId ? ` for user ${userId}` : ' (system-wide)'}:`, value);

    // Build the query condition
    const whereCondition = { name: setting };
    if (isGlobalSetting) {
      whereCondition.user_id = null;
    } else {
      whereCondition.user_id = req.user.id;
    }

    const existing = await this.db('settings').where(whereCondition).first();

    if (existing) {
      await this.db('settings').where({ id: existing.id }).update({
        value: typeof value === 'string' ? value : JSON.stringify(value),
        updated_at: this.db.fn.now()
      });
      console.debug('[SETTINGS]', `Updated existing ${settingType} setting ${setting}`);
    } else {
      const fabric_id = crypto.randomBytes(32).toString('hex');
      await this.db('settings').insert({
        fabric_id,
        name: setting,
        user_id: userId,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        type: settingType,
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      });
      console.debug('[SETTINGS]', `Created new ${settingType} setting ${setting}`);
    }

    if (HOSTED_LLM_POOL_SETTING_NAMES.includes(setting) && typeof this.refreshPoolMembersAfterGlobalSettings === 'function') {
      try {
        await this.refreshPoolMembersAfterGlobalSettings();
      } catch (poolErr) {
        console.error('[SETTINGS]', 'Pool refresh after hosted LLM toggle failed:', poolErr);
      }
    }

    if (setting === DOCUMENT_RETRIEVAL_SETTING_NAME && typeof this._syncDocumentRetrievalFlagFromDb === 'function') {
      try {
        await this._syncDocumentRetrievalFlagFromDb();
      } catch (pipelineErr) {
        console.error('[SETTINGS]', 'Document retrieval sync failed:', pipelineErr);
      }
    }

    const result = {
      success: true,
      setting: setting,
      value: value,
      type: settingType,
      message: `Setting ${setting} updated successfully`
    };

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(200).json(result);
      }
    });

  } catch (error) {
    console.error('[SETTINGS]', 'Error updating setting:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update setting',
      details: error.message
    });
  }
};