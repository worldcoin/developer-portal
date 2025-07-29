import axios from 'axios';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL

describe('Auxiliary API Endpoints', () => {

  describe('GET /api/health', () => {
    it('Should return health status successfully', async () => {

      console.log('API_BASE_URL:', INTERNAL_API_URL);
      
      // Health endpoint doesn't require authorization
      const response = await axios.get(`${INTERNAL_API_URL}/api/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true
      });
    });

    it('Should work with authorization as well', async () => {
    
      
      const token = process.env.INTERNAL_ENDPOINTS_SECRET
      
      if (!token) {
        console.warn('INTERNAL_ENDPOINTS_SECRET is not set. Skipping test.');
        return;
      }
      

        const response = await axios.post(`${INTERNAL_API_URL}/api/_delete-expired-auth-codes`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('response', response);
        
        expect(response.status).toBe(204); // This endpoint returns 204 No Content
        expect(response.data).toBe(''); // Empty response body
    });
  });
}); 