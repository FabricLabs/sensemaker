'use strict';

const assert = require('assert');
const EmailService = require('../services/email');

describe('@jeeves/email', function () {
  describe('@jeeves/core/services/email', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof EmailService, 'function');
    });

    it('can send mail', async function () {
      const service = new EmailService();

      service.on('debug', console.debug);
      service.on('error', console.error);

      const result = await service.send({
        to: 'test@localhost',
        subject: 'Test',
        text: 'Test'
      });

      assert.ok(result);
    });
  });
});
