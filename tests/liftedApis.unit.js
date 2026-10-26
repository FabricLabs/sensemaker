'use strict';

/**
 * Sensemaker coverage for Hub-lifted Fabric APIs (package imports, not deep path.join).
 */
const assert = require('assert');
const path = require('path');

describe('Sensemaker lifted Hub APIs', function () {
  it('imports Hub device-link / allowlist and the Passport relying party via package exports', function () {
    const deviceLink = require('@fabric/hub/functions/fabricDeviceLink');
    const allowlist = require('@fabric/hub/functions/fabricHubAllowlist');
    const shared = require('@fabric/hub/functions/httpSharedMode');
    const rp = require('@fabric/http/functions/passportRelyingParty');
    const passportHttp = require('@fabric/http/functions/passportHttp');

    assert.strictEqual(typeof deviceLink.mountFabricDeviceLinkHttp, 'function');
    assert.strictEqual(typeof rp.createPassportRelyingParty, 'function');
    assert.strictEqual(typeof passportHttp.createPassportHttp, 'function');
    assert.throws(() => require('@fabric/hub/functions/fabricDesktopAuth'), 'v1 desktop login is gone');
    assert.throws(() => require('@fabric/hub/functions/fabricDelegation'), 'delegation is gone');
    assert.strictEqual(allowlist.isAllowedFabricHub('https://hub.fabric.pub'), true);
    assert.strictEqual(allowlist.isAllowedFabricHub('https://phish.example'), false);
    assert.strictEqual(shared.resolveHttpListenHost({ mode: 'relay', env: {} }), '127.0.0.1');
  });

  it('EmailService re-exports @fabric/hub/services/email', function () {
    const local = require('../services/email');
    const hub = require('@fabric/hub/services/email');
    assert.strictEqual(local, hub);
    const svc = new local({ host: '127.0.0.1', port: 1025 });
    assert.strictEqual(typeof svc.send, 'function');
    if (typeof svc.getTransportMode === 'function') {
      assert.strictEqual(svc.getTransportMode(), 'smtp');
    }
  });

  it('services/fabric extends Hub FabricService without path.join deep-require', function () {
    const FabricNetwork = require('../services/fabric');
    const HubFabric = require('@fabric/hub/services/fabric');
    assert.ok(FabricNetwork.prototype instanceof HubFabric);
    const src = require('fs').readFileSync(
      path.join(__dirname, '..', 'services', 'fabric.js'),
      'utf8'
    );
    assert.ok(src.includes("@fabric/hub/services/fabric"));
    assert.ok(!src.includes("path.join(hubRoot"));
  });

  it('imports Hub bulkSecurityAdvisory via package export', function () {
    const hub = require('@fabric/hub/functions/bulkSecurityAdvisory');
    assert.strictEqual(typeof hub.looksLikeBulkSecurityAdvisory, 'function');
    assert.strictEqual(hub.looksLikeBulkSecurityAdvisory({
      ghsa_id: 'GHSA-aaaa-bbbb-cccc',
      summary: 'Malicious code in @zalastax/nolb-example'
    }), true);
    assert.strictEqual(hub.looksLikeBulkSecurityAdvisory({ title: 'ordinary note' }), false);
  });

  it('hubLifecycle is available for future super.start migration', function () {
    const life = require('@fabric/hub/functions/hubLifecycle');
    assert.ok(Array.isArray(life.HUB_START_PHASES));
    assert.ok(life.HUB_START_PHASES.includes('routes'));
    assert.strictEqual(typeof life.runHubStartPhase, 'function');
  });
});
