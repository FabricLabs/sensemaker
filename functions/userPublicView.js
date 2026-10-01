'use strict';

/**
 * Fields safe to return on `GET /users/:username` without a privileged session.
 * Never includes password hashes or tokens.
 * @param {object} user
 * @returns {object|null}
 */
function publicUserView (user) {
  if (!user || typeof user !== 'object') return null;
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    created_at: user.created_at
  };
}

/**
 * Self or admin JSON. Still omits `password` and credential columns.
 * @param {object} user
 * @returns {object|null}
 */
function privilegedUserView (user) {
  const pub = publicUserView(user);
  if (!pub) return null;
  return {
    ...pub,
    email: user.email,
    is_admin: user.is_admin,
    is_compliant: user.is_compliant,
    is_beta: user.is_beta,
    first_name: user.first_name,
    last_name: user.last_name,
    updated_at: user.updated_at
  };
}

module.exports = {
  publicUserView,
  privilegedUserView
};
