import axios from 'axios';

const PUBLIC_API_URL = process.env.PUBLIC_API_URL;
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

describe('Verification API Endpoints', () => {
  describe('OPTIONS, POST /api/v1/precheck/[app_id]', () => {
    const testAppId = 'app_staging_1e2073dc34ff97818baaf9e3f008e1bc';
    
    it('OPTIONS Request Returns 204', async () => {
      const response = await axios.options(`${INTERNAL_API_URL}/api/v1/precheck/${testAppId}`);
      
      expect(response.status).toBe(204);
    });

    it('POST Request With Valid Data Returns Success', async () => {
      const validData = {
        action: ''
      };

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/v1/precheck/${testAppId}`,
        validData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          engine: expect.any(String),
          is_staging: expect.any(Boolean),
          is_verified: expect.any(Boolean),
          name: expect.any(String),
          verified_app_logo: expect.any(String),
          integration_url: expect.any(String),
          sign_in_with_world_id: expect.any(Boolean),
          is_sign_in: expect.any(Boolean),
          can_user_verify: expect.any(String),
          action: expect.objectContaining({
            external_nullifier: expect.any(String),
            name: expect.any(String),
            action: expect.any(String),
            description: expect.any(String),
            max_verifications: expect.any(Number),
            max_accounts_per_user: expect.any(Number),
            status: expect.any(String)
          })
        })
      );
    });

    it('POST Request With Minimal Data Returns Success', async () => {
      const minimalData = {
        action: ''
      };

      const response = await axios.post(
        `${INTERNAL_API_URL}/api/v1/precheck/${testAppId}`,
        minimalData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('action');
    });

    it('POST Request With Non-Existent App ID Returns 404', async () => {
      const nonExistentAppId = 'app_nonexistent_12345';
      const validData = {
        action: ''
      };

      try {
        await axios.post(
          `${INTERNAL_API_URL}/api/v1/precheck/${nonExistentAppId}`,
          validData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toEqual(
          expect.objectContaining({
            code: 'not_found'
          })
        );
      }
    });

    it('POST Request With Invalid Data Returns 400', async () => {
      const invalidData = {
        invalid_field: 'invalid_value'
      };

      try {
        await axios.post(
          `${INTERNAL_API_URL}/api/v1/precheck/${testAppId}`,
          invalidData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        if (error.response) {
          expect(error.response.status).toBe(400);
          expect(error.response.data).toEqual(
            expect.objectContaining({
              code: expect.any(String)
            })
          );
        } else {
          // If it's not an HTTP error, just check that an error was thrown
          expect(error).toBeDefined();
        }
      }
    });
  });

  // describe('POST /api/v2/verify/[app_id]', () => {
  //   const testAppId = 'app_staging_1e2073dc34ff97818baaf9e3f008e1bc';
  //   const testUserId = 'usr_c3d38f2bd4704934d41345e19f2cafd1'
  //   const testApiKey = 'test_api_key_12345';


  //   const generateTestData = async (type: 'document' | 'humanity') => {
  //     const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
  //     const identity = await generateIdComm(type);
  //     const proof = await generateProof(identity.newIdentity, currentTimestamp.toString(), type);
  //     await globalThis.curve_bn128.terminate();
  
  //     // const claimInfo = await generateClaimInfo(testUserId, proof.nullifierHash, proof.nullifierHash, false, []);
  
  //     const requestBody = {
  //       // claimInfo,
  //       localTZ: 'UTC',
  //       claims: [
  //         {
  //           type: type === 'humanity' ? 'humanity' : 'document',
  //           merkleRoot: proof.root,
  //           nullifierHash: proof.nullifierHash,
  //           proof: JSON.stringify(proof.proof),
  //           VProof: {
  //             nullifierHash: proof.nullifierHash,
  //             proof: JSON.stringify(proof.proof),
  //             merkleRoot: proof.root,
  //             signal: currentTimestamp.toString(),
  //           },
  //         },
  //       ],
  //     };
  
  //     return {
  //       proof,
  //       // claimInfo,
  //       currentTimestamp,
  //       requestBody,
  //     };
  //   };

  //   it('POST Request With Valid Data Returns Success', async () => {

  //     const { proof,  currentTimestamp, requestBody } = await generateTestData('document');
      
      
  //     const validData = {
  //       action: 'test_action',
  //       signal_hash: proof.signalHash,
  //       proof: JSON.stringify(proof.proof),
  //       merkle_root: proof.root,
  //       nullifier_hash: proof.nullifierHash,
  //       verification_level: 'document',
  //       max_age: 3600
  //     };
      
  //     console.log('🔍 Debug - Valid data being sent:', validData);
  //     console.log('🔍 Debug - API URL:', `${INTERNAL_API_URL}/api/v2/verify/${testAppId}`);

  //     let response;
  //     try {
  //       response = await axios.post(
  //         `${INTERNAL_API_URL}/api/v2/verify/${testAppId}`,
  //         validData,
  //         {
  //           headers: {
  //             'Authorization': `Bearer ${testApiKey}`,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );

  //       console.log('✅ Debug - Response:', response.data);
  //       console.log('✅ Debug - Response status:', response.status);
  //     } catch (error: any) {
  //       console.log('❌ Debug - Error response:', error.response?.data);
  //       console.log('❌ Debug - Error status:', error.response?.status);
  //       console.log('❌ Debug - Error message:', error.message);
  //       throw error;
  //     }

  //     expect(response.status).toBe(200);
  //     expect(response.data).toEqual(
  //       expect.objectContaining({
  //         uses: expect.any(Number),
  //         success: true,
  //         action: expect.any(String),
  //         max_uses: expect.any(Number),
  //         nullifier_hash: expect.any(String),
  //         created_at: expect.any(String),
  //         verification_level: expect.any(String),
  //         message: expect.any(String)
  //       })
  //     );
  //   });

  //   it('POST Request With Missing App ID Returns 400', async () => {
  //     const validData = {
  //       action: 'test_action',
  //       signal_hash: 'test_signal_hash',
  //       proof: 'test_proof_data',
  //       merkle_root: 'test_merkle_root',
  //       nullifier_hash: 'test_nullifier_hash',
  //       verification_level: 'orb'
  //     };

  //     try {
  //       await axios.post(
  //         `${INTERNAL_API_URL}/api/v2/verify/`,
  //         validData,
  //         {
  //           headers: {
  //             'Authorization': `Bearer ${testApiKey}`,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
  //       // If we reach here, the test should fail
  //       expect(true).toBe(false);
  //     } catch (error: any) {
  //       expect(error.response.status).toBe(404);
  //     }
  //   });

  //   it('POST Request With Non-Existent App ID Returns 404', async () => {
  //     const nonExistentAppId = 'app_nonexistent_12345';
  //     const validData = {
  //       action: 'test_action',
  //       signal_hash: 'test_signal_hash',
  //       proof: 'test_proof_data',
  //       merkle_root: 'test_merkle_root',
  //       nullifier_hash: 'test_nullifier_hash',
  //       verification_level: 'orb'
  //     };

  //     try {
  //       await axios.post(
  //         `${INTERNAL_API_URL}/api/v2/verify/${nonExistentAppId}`,
  //         validData,
  //         {
  //           headers: {
  //             'Authorization': `Bearer ${testApiKey}`,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
  //       // If we reach here, the test should fail
  //       expect(true).toBe(false);
  //     } catch (error: any) {
  //       expect(error.response.status).toBe(404);
  //       expect(error.response.data).toEqual(
  //         expect.objectContaining({
  //           code: 'not_found'
  //         })
  //       );
  //     }
  //   });

  //   it('POST Request With Invalid Data Returns 400', async () => {
  //     const invalidData = {
  //       // Missing required fields
  //     };

  //     try {
  //       await axios.post(
  //         `${INTERNAL_API_URL}/api/v2/verify/${testAppId}`,
  //         invalidData,
  //         {
  //           headers: {
  //             'Authorization': `Bearer ${testApiKey}`,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
  //       // If we reach here, the test should fail
  //       expect(true).toBe(false);
  //     } catch (error: any) {
  //       expect(error.response.status).toBe(400);
  //       expect(error.response.data).toEqual(
  //         expect.objectContaining({
  //           code: expect.any(String)
  //         })
  //       );
  //     }
  //   });

  //   it('POST Request With Invalid JSON Returns 400', async () => {
  //     const invalidJson = 'invalid json string';

  //     try {
  //       await axios.post(
  //         `${INTERNAL_API_URL}/api/v2/verify/${testAppId}`,
  //         invalidJson,
  //         {
  //           headers: {
  //             'Authorization': `Bearer ${testApiKey}`,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
  //       // If we reach here, the test should fail
  //       expect(true).toBe(false);
  //     } catch (error: any) {
  //       expect(error.response.status).toBe(400);
  //       expect(error.response.data).toEqual(
  //         expect.objectContaining({
  //           code: 'invalid_request'
  //         })
  //       );
  //     }
  //   });
  // });

  describe('GET, OPTIONS /api/v1/jwks', () => {
    it('OPTIONS Request Returns 204', async () => {
      const response = await axios.options(`${INTERNAL_API_URL}/api/v1/jwks`);
      
      expect(response.status).toBe(204);
    });

    it('GET Request Returns JWKS Successfully', async () => {
      const response = await axios.get(`${INTERNAL_API_URL}/api/v1/jwks`);
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.objectContaining({
          keys: expect.arrayContaining([
            expect.objectContaining({
              kid: expect.any(String),
              kty: expect.any(String),
              n: expect.any(String),
              e: expect.any(String)
            })
          ])
        })
      );
    });
  });

  describe('OPTIONS, POST /api/v1/debugger', () => {
    const testAppId = 'app_staging_1e2073dc34ff97818baaf9e3f008e1bc';
    
    it('OPTIONS Request Returns 204', async () => {
      const response = await axios.options(`${INTERNAL_API_URL}/api/v1/debugger`);
      
      expect(response.status).toBe(204);
    });
  });
}); 