exports.up = (pgm) => {
  pgm.addColumns('users', {
    role: { type: 'VARCHAR(50)', notNull: true, default: 'user' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['role']);
}; 