/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('documents', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    user_id: { type: 'VARCHAR(50)', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    filename: { type: 'VARCHAR(255)', notNull: true },
    file_url: { type: 'TEXT', notNull: true },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('current_timestamp') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('documents');
};