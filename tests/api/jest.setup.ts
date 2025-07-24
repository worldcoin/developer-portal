import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.development', override: true });

console.log('Test environment setup complete');
console.log('API_BASE_URL:', process.env.API_BASE_URL); 
