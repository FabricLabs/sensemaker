exports.up = function (knex) {
    return knex.schema.table('users', function (table) {
        table.string('first_name');
        table.string('last_name');
        table.string('firm_name');
        table.integer('firm_size');
    });
};

exports.down = function (knex) {
    return knex.schema.table('users', function (table) {
        table.dropColumn('first_name');
        table.dropColumn('last_name');
        table.dropColumn('firm_name');
        table.dropColumn('firm_size');
    });
};
