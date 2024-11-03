'use strict';

module.exports = async function (req, res, next) {
  let result = {};

  console.debug('[COMPLIANCE]', 'Signer', req.user.id, 'signed Terms of Use');

  if (req.user.id) {
    await this.db('users').update({
      is_compliant: true
    }).where({
      id: req.user.id
    });

    result.message = 'Update complete.';
    result.isCompliant = true;
  } else {
    result.message = 'Failed.'
  }

  res.send(result);
};
