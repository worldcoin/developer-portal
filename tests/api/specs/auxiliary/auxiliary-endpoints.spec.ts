import axios from 'axios';
import { authHelper } from '../../helpers/auth-helper';

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/$/, ''); // Убираем trailing slash

if (!API_BASE_URL) {
  console.warn('API_BASE_URL is not set. Skipping auxiliary endpoint tests.');
  console.warn('Please set API_BASE_URL environment variable to run these tests.');
}

describe('Auxiliary API Endpoints', () => {

  describe('GET /api/health', () => {
    it('Should return health status successfully', async () => {

      console.log('API_BASE_URL:', API_BASE_URL);

      const token = await authHelper();
      console.log('JWT Token:', token);
      
      // Health endpoint doesn't require authorization, let's try without it first
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true
      });
    });

    it('Should work with authorization as well', async () => {
      const token = await authHelper();
      console.log(token);
      
      const response = await axios.post(`${API_BASE_URL}/api/_delete-expired-auth-codes`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true
      });
    });
  });
}); 