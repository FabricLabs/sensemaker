exports.up = function (knex) {
    return knex.schema.table('invitations', function (table) {
      table.integer('invitation_count').defaultTo(1);
    })
    .then(function () {
      return knex('invitations').update({ invitation_count: 1 });
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.table('invitations', function (table) {
      table.dropColumn('invitation_count');
    });
  };
  