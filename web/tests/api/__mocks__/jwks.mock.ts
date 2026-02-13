module.exports = {
  retrieveJWK: jest.fn().mockImplementation(() => ({
    kid: "kid_my_test_key",
    kms_id: "kms_my_test_id",
  })),
  fetchActiveJWK: jest.fn().mockImplementation(() => ({
    kid: "kid_my_test_key",
    kms_id: "kms_my_test_id",
  })),
};
