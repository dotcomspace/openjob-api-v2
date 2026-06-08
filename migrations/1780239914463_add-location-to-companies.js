exports.up = (pgm) => {
  pgm.addColumns('companies', {
    location: { type: 'VARCHAR(255)' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('companies', ['location']);
};