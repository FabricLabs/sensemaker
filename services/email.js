'use strict';

/**
 * Prefer Hub EmailService (single copy). Local fallback when published hub lags.
 */
try {
  module.exports = require('@fabric/hub/services/email');
} catch (_) {
  module.exports = require('./email.local');
}
