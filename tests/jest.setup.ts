import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env.test' });

// Check required variables
if (!process.env.API_BASE_URL) {
  throw new Error('API_BASE_URL is required in .env.test');
}

console.log('Test environment setup complete');
console.log('API_BASE_URL:', process.env.API_BASE_URL); 