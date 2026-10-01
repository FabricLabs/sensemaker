'use strict';

/**
 * Parse a settings row value as boolean (JSON, string, or number).
 * @param {*} value
 * @param {boolean} [defaultValue=false]
 * @returns {boolean}
 */
function parseGlobalSettingBoolean (value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'boolean') return parsed;
      if (typeof parsed === 'number') return parsed === 1;
    } catch (e) {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
    }
  }
  return defaultValue;
}

module.exports = parseGlobalSettingBoolean;
