'use strict';

const settings = require('../settings/local');

module.exports = async function handleSensemakerLog (log) {
  if (!settings.debug) return;
  console.log('[SENSEMAKER]', '[LOG]', log);
};
