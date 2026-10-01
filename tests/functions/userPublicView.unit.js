'use strict';

const assert = require('assert');
const { publicUserView, privilegedUserView } = require('../../functions/userPublicView');

const row = {
  id: 7,
  username: 'alice',
  display_name: 'Alice',
  email: 'alice@example.com',
  password: '$2b$10$not-a-real-hash',
  is_admin: 1,
  is_compliant: 1,
  is_beta: 0,
  first_name: 'Alice',
  last_name: 'Example',
  created_at: '2026-01-01',
  updated_at: '2026-08-01',
  discord_token_id: 99
};

describe('userPublicView', function () {
  it('omits password, email, and admin flags', function () {
    const view = publicUserView(row);
    assert.strictEqual(view.username, 'alice');
    assert.strictEqual(view.password, undefined);
    assert.strictEqual(view.email, undefined);
    assert.strictEqual(view.is_admin, undefined);
    assert.strictEqual(view.discord_token_id, undefined);
  });

  it('privileged view still omits password', function () {
    const view = privilegedUserView(row);
    assert.strictEqual(view.email, 'alice@example.com');
    assert.strictEqual(view.is_admin, 1);
    assert.strictEqual(view.password, undefined);
    assert.strictEqual(view.discord_token_id, undefined);
  });
});
