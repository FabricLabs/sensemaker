'use strict';

/**
 * Sensemaker application-namespace types.
 * Merges `@fabric/core` generic ARC types with Sensemaker product-local body
 * types. AI Conversation / JSONPatch stream fragments stay on HTTP — they are
 * intentionally **not** listed here (must not overload the mesh shoutbox).
 *
 * @see @fabric/core docs/APPLICATION_NAMESPACES.md
 * @see docs/FABRIC_MESSAGE_CONVERGENCE.md
 */

const core = require('@fabric/core/functions/applicationNamespaces');

/**
 * Product-only CONTRACT_MESSAGE body types (not in @fabric/core).
 * Keep empty unless a Sensemaker domain event is deliberately mesh-scoped.
 * Downstream gameplay / mission types belong in those apps’ catalogs, not here.
 */
const APP_CONTRACT_BODY_TYPES = Object.freeze({
  // Reserved for Sensemaker mesh-scoped product bodies (none yet).
});

const CONTRACT_BODY_TYPES = Object.freeze(Object.assign(
  {},
  core.CONTRACT_BODY_TYPES,
  APP_CONTRACT_BODY_TYPES
));

const ACTIVITY_TYPES = Object.freeze(Object.assign({}, core.ACTIVITY_TYPES));

function isKnownContractBodyType (type) {
  return Object.prototype.hasOwnProperty.call(CONTRACT_BODY_TYPES, String(type || ''));
}

module.exports = {
  OUTER: core.OUTER,
  OUTER_ALIASES: core.OUTER_ALIASES,
  OUTER_OPCODES: core.OUTER_OPCODES,
  CONTRACT_BODY_TYPES,
  APP_CONTRACT_BODY_TYPES,
  ACTIVITY_TYPES,
  LOG_TYPES: core.LOG_TYPES,
  isApplicationOuterType: core.isApplicationOuterType.bind(core),
  isKnownContractBodyType,
  fromCore: true
};
