exports.up = (pgm) => {
  pgm.addColumns('jobs', {
    job_type: { type: 'VARCHAR(50)' },
    experience_level: { type: 'VARCHAR(50)' },
    location_type: { type: 'VARCHAR(50)' },
    location_city: { type: 'VARCHAR(255)' },
    salary_min: { type: 'BIGINT' },
    salary_max: { type: 'BIGINT' },
    is_salary_visible: { type: 'BOOLEAN', default: false },
    status: { type: 'VARCHAR(50)', default: 'open' }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('jobs', [
    'job_type', 'experience_level', 'location_type', 
    'location_city', 'salary_min', 'salary_max', 
    'is_salary_visible', 'status'
  ]);
};