// Script to run Prisma migrations
const { execSync } = require('child_process');

console.log('Running Prisma migration to remove unencrypted fields...');
try {
  // Run the migration
  execSync('npx prisma migrate dev --name remove_unencrypted_fields', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Error running migration:', error);
  process.exit(1);
}