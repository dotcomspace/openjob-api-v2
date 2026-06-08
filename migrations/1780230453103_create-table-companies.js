/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('companies', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    name: { type: 'VARCHAR(255)', notNull: true },
    description: { type: 'TEXT' },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('current_timestamp') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('companies');
};