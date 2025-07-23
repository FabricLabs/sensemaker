'use strict';

const {
  GLOBAL_SETTINGS
} = require('../../constants');

module.exports = async function (req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { setting } = req.params;

    if (!setting) {
      return res.status(400).json({ error: 'Setting name is required' });
    }

    console.debug('[SETTINGS]', `Getting setting ${setting} for user ${req.user.id}`);

    // First, check for user-specific setting
    let result = await this.db('settings').where({ name: setting, user_id: req.user.id }).first();

    // If not found and this is a global setting, check for global version
    if (!result && GLOBAL_SETTINGS.includes(setting)) {
      console.debug('[SETTINGS]', `User setting not found, checking for global setting ${setting}`);
      result = await this.db('settings').where({ name: setting, user_id: null }).first();
    }

    if (!result) {
      console.debug('[SETTINGS]', `Setting ${setting} not found for user ${req.user.id} or globally`);
      return res.status(404).json({
        error: 'Setting not found',
        setting: setting
      });
    }

    // Parse the value - it might be stored as a string
    let value = result.value;
    try {
      // Try to parse as JSON first (for objects, arrays, booleans)
      value = JSON.parse(result.value);
    } catch (e) {
      // If JSON parse fails, it's likely a plain string, keep as-is
    }

    console.debug('[SETTINGS]', `Found ${result.type || 'USER'} setting ${setting}:`, value);

    const response = {
      success: true,
      setting: setting,
      value: value,
      type: result.type || 'USER',
      created_at: result.created_at,
      updated_at: result.updated_at
    };

    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: () => {
        res.status(200).json(response);
      }
    });

  } catch (error) {
    console.error('[SETTINGS]', 'Error getting setting:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get setting',
      details: error.message
    });
  }
};