
const jwt = require('jsonwebtoken');
const { createToken, isExpired, refresh } = require('../createJWT');

//mock env vars
process.env.ACCESS_TOKEN_SECRET = 'it-secret-key-for-jwt-testing';

describe('createJWT', () => {
  describe('createToken', () => {
    it('should create a valid JWT token with email and id', () => {
      const email = 'test@example.com';
      const id = '123456789';
      
      const result = createToken(email, id);
      
      expect(result).toHaveProperty('accessToken');
      expect(result.error).toBeUndefined();
      
      //verify token can be decoded
      const decoded = jwt.decode(result.accessToken);
      expect(decoded.email).toBe(email);
      expect(decoded.id).toBe(id);
    });

    it('should handle missing email gracefully', () => {
      const id = '123456789';
      
      const result = createToken(undefined, id);
      
      //should still create a token, but email will be undefined
      expect(result).toHaveProperty('accessToken');
      const decoded = jwt.decode(result.accessToken);
      expect(decoded.id).toBe(id);
    });

    it('should handle missing id gracefully', () => {
      const email = 'test@example.com';
      
      const result = createToken(email, undefined);
      
      //should still create a token, but id will be undefined
      expect(result).toHaveProperty('accessToken');
      const decoded = jwt.decode(result.accessToken);
      expect(decoded.email).toBe(email);
    });
  });

  describe('isExpired', () => {
    it('should return false for a valid token', () => {
      const email = 'test@example.com';
      const id = '123456789';
      const tokenResult = createToken(email, id);
      const token = tokenResult.accessToken;
      
      const expired = isExpired(token);
      
      expect(expired).toBe(false);
    });

    it('should return true for an invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      const expired = isExpired(invalidToken);
      
      expect(expired).toBe(true);
    });

    it('should return true for an expired token', () => {
      //create a token that expires immediately
      const expiredToken = jwt.sign(
        { email: 'test@example.com', id: '123' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '-1h' }
      );
      
      const expired = isExpired(expiredToken);
      
      expect(expired).toBe(true);
    });

    it('should return true for null/undefined token', () => {
      expect(isExpired(null)).toBe(true);
      expect(isExpired(undefined)).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should refresh a valid token and return new token', () => {
      const email = 'test@example.com';
      const id = '123456789';
      const tokenResult = createToken(email, id);
      const originalToken = tokenResult.accessToken;
      
      const refreshResult = refresh(originalToken);
      
      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult.error).toBeUndefined();
      
      //new token should have same email and id
      const decoded = jwt.decode(refreshResult.accessToken);
      expect(decoded.email).toBe(email);
      expect(decoded.id).toBe(id);
    });

    it('should create a new token with same user data', () => {
      const email = 'refresh@example.com';
      const id = '987654321';
      const tokenResult = createToken(email, id);
      const originalToken = tokenResult.accessToken;
      
      const refreshResult = refresh(originalToken);
      
      //verify refresh returns a valid token
      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult.error).toBeUndefined();
      
      //same user data
      const originalDecoded = jwt.decode(originalToken);
      const refreshedDecoded = jwt.decode(refreshResult.accessToken);
      expect(refreshedDecoded.email).toBe(originalDecoded.email);
      expect(refreshedDecoded.id).toBe(originalDecoded.id);
    });
  });
});

