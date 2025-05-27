// This is a simple script to run migrations and seed the database
// Run with: node prisma/migrations/manual-setup.js

const { exec } = require('child_process');

console.log('Setting up database...');

// Run Prisma migrations
exec('npx prisma migrate dev --name add_modules_and_lessons', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running migrations: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
  }
  console.log(`Migration stdout: ${stdout}`);
  
  // Seed the database after migration
  console.log('Seeding database...');
  exec('npm run db:seed', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error seeding database: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Seeding stderr: ${stderr}`);
    }
    console.log(`Seeding stdout: ${stdout}`);
    
    console.log('Database setup and seeding complete!');
    console.log('You can now run the application with: npm run dev');
  });
});