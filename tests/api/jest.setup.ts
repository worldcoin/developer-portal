import dotenv from 'dotenv';
import 'jest-expect-message';

// Load environment variables for tests
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.development' });

console.log('Test environment setup complete');
