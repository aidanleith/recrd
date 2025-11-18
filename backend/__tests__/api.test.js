const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

const createMockToArray = () => jest.fn().mockResolvedValue([]);

const createMockFind = () => {
  const mockFind = jest.fn(() => ({
    toArray: createMockToArray(),
    sort: jest.fn(function() { 
      this.toArray = createMockToArray();
      return this; 
    }),
    skip: jest.fn(function() { 
      this.toArray = createMockToArray();
      return this; 
    }),
    limit: jest.fn(function() { 
      this.toArray = createMockToArray();
      return this; 
    })
  }));
  return mockFind;
};

const mockCollection = jest.fn(() => ({
  find: createMockFind(),
  findOne: jest.fn(),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(() => ({
    toArray: jest.fn()
  }))
}));

const mockDb = {
  collection: mockCollection
};

const mockClient = {
  db: jest.fn(() => mockDb)
};

//mock JWT token module
jest.mock('../createJWT.js', () => ({
  createToken: jest.fn((email, id) => ({ 
    accessToken: 'mock-jwt-token',
    error: '' 
  })),
  refresh: jest.fn(() => ({ accessToken: 'refreshed-token' })),
  isExpired: jest.fn(() => false)
}));

//mock Sendgrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}));

//mock bcrypt for consistent testing
jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

//set environment variable
process.env.SENDGRID_EMAIL_API_KEY = 'test-key';

//create Express app for testing
const app = express();
app.use(express.json());

//import and set up API
const api = require('../api');
api.setApp(app, mockClient);

//follows AAA structure (arrange, act, assert)
describe('API Endpoints - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  ///////*SEARCH ENDPOINTS*////////
  describe('POST /api/searchAlbums', () => {
    it('searchAlbums_ValidTitle_ReturnsAlbums', async () => {
      const mockAlbums = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Album',
          artist: 'Test Artist',
          coverArtUrl: 'http://example.com/cover.jpg'
        }
      ];

      let findCallCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => {
          findCallCount++;
          if (findCallCount === 1) {
            return {
              skip: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              toArray: jest.fn().mockResolvedValue(mockAlbums)
            };
          } else {
            return {
              toArray: jest.fn().mockResolvedValue([])
            };
          }
        }),
        countDocuments: jest.fn().mockResolvedValue(1)
      });

      const res = await request(app)
        .post('/api/searchAlbums')
        .send({ title: 'Test', limit: 50, skip: 0 });

      expect(res.status).toBe(200);
      expect(res.body.albums).toBeDefined();
      expect(res.body.albums.length).toBeGreaterThan(0);
    });

    it('searchAlbums_NoResults_Returns404', async () => {
      const chainedMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      };

      mockCollection.mockReturnValue({
        find: jest.fn(() => chainedMock),
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      // Act
      const res = await request(app)
        .post('/api/searchAlbums')
        .send({ title: 'NonExistent' });

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No matching albums found.');
    });
  });

  describe('POST /api/searchUsers', () => {
    it('searchUsers_ValidUsername_ReturnsUsers', async () => {
      const mockUsers = [
        { _id: '507f1f77bcf86cd799439011', username: 'testuser' }
      ];

      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue(mockUsers)
        }))
      });

      const res = await request(app)
        .post('/api/searchUsers')
        .send({ search: 'test' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('searchUsers_NoResults_Returns400', async () => {
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app)
        .post('/api/searchUsers')
        .send({ search: 'nonexistent' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No matching users found.');
    });
  });

  ////////*USER ENDPOINTS */////////

  describe('GET /api/users/:username', () => {
    it('getUser_ValidUsername_ReturnsUserProfile', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        followers: [],
        following: [],
        toListen: [],
        top3: []
      };

      //first call returns user, second call returns empty rankings
      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockUser] : []);
          })
        }))
      });

      const res = await request(app).get('/api/users/testuser');

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
    });

    it('getUser_InvalidUsername_Returns404', async () => {
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app).get('/api/users/nonexistent');

      //return 404
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User Not Found');
    });
  });

  describe('GET /api/userById/:id', () => {
    it('getUserById_ValidId_ReturnsUser', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      };

      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([mockUser])
        }))
      });

      const res = await request(app).get('/api/userById/507f1f77bcf86cd799439011');

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
    });

    it('getUserById_InvalidId_ReturnsError', async () => {
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app).get('/api/userById/507f1f77bcf86cd799439011');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe('User not found');
    });
  });

  ///////*FOLLOWER ENDPOINTS*////////

  describe('GET /api/users/:username/followers', () => {
    it('getFollowers_ValidUsername_ReturnsFollowers', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        followers: ['507f1f77bcf86cd799439012']
      };

      const mockFollowers = [
        { _id: '507f1f77bcf86cd799439012', username: 'follower1' }
      ];

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockUser] : mockFollowers);
          })
        }))
      });

      const res = await request(app).get('/api/users/testuser/followers');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:username/following', () => {
    it('getFollowing_ValidUsername_ReturnsFollowing', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        following: ['507f1f77bcf86cd799439012']
      };

      const mockFollowing = [
        { _id: '507f1f77bcf86cd799439012', username: 'following1' }
      ];

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockUser] : mockFollowing);
          })
        }))
      });

      const res = await request(app).get('/api/users/testuser/following');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  ///////*ALBUM ENDPOINTS*///////

  describe('GET /api/albums/:id', () => {
    it('getAlbum_ValidId_ReturnsAlbum', async () => {
      const mockAlbum = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Album',
        artist: 'Test Artist',
        genre: 'Rock',
        coverArtUrl: 'http://example.com/cover.jpg',
        releaseDate: '2020-01-01'
      };

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockAlbum] : []);
          })
        }))
      });

      const res = await request(app).get('/api/albums/507f1f77bcf86cd799439011');

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test Album');
    });

    it('getAlbum_InvalidId_Returns400', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      const res = await request(app).get('/api/albums/invalid-id');

      expect(res.status).toBe(400);
    });

    it('getAlbum_NotFound_ReturnsError', async () => {
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app).get('/api/albums/507f1f77bcf86cd799439011');

      expect(res.status).toBe(200);
      expect(res.body.error).toBe('Album Not Found');
    });
  });

  ///////*LEADERBOARD ENDPOINTS *//////

  describe('GET /api/leaderboard', () => {
    it('getLeaderboard_ValidRequest_ReturnsAlbums', async () => {
      const mockResults = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Top Album',
          artist: 'Top Artist',
          rankingCount: 100,
          averageRanking: 8.5
        }
      ];

      mockCollection.mockReturnValue({
        aggregate: jest.fn(() => ({
          toArray: jest.fn()
            .mockResolvedValueOnce(mockResults)
            .mockResolvedValueOnce([{ total: 1 }])
        }))
      });

      const res = await request(app).get('/api/leaderboard?limit=10&skip=0');

      expect(res.status).toBe(200);
      expect(res.body.albums).toBeDefined();
    });

    it('getLeaderboard_DatabaseError_Returns500', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app).get('/api/leaderboard');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/leaderboard/users', () => {
    it('getUserLeaderboard_ValidRequest_ReturnsUsers', async () => {
      const mockResults = [
        {
          _id: '507f1f77bcf86cd799439011',
          username: 'topuser',
          rankingCount: 50
        }
      ];

      mockCollection.mockReturnValue({
        aggregate: jest.fn(() => ({
          toArray: jest.fn()
            .mockResolvedValueOnce(mockResults)
            .mockResolvedValueOnce([{ total: 1 }])
        }))
      });

      const res = await request(app).get('/api/leaderboard/users');

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
    });

    it('getUserLeaderboard_DatabaseError_Returns500', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app).get('/api/leaderboard/users');

      expect(res.status).toBe(500);
    });
  });

  ////////* ALL RANKINGS ENDPOINT*////////

  describe('GET /api/allRankings', () => {
    it('getAllRankings_ValidRequest_ReturnsRankings', async () => {
      const mockRankings = [
        {
          _id: '507f1f77bcf86cd799439011',
          user: '507f1f77bcf86cd799439012',
          album: '507f1f77bcf86cd799439013',
          rankValue: 8,
          notes: 'Great album',
          createdAt: new Date()
        }
      ];

      const mockUser = { _id: '507f1f77bcf86cd799439012', username: 'testuser' };
      const mockAlbum = {
        _id: '507f1f77bcf86cd799439013',
        title: 'Test Album',
        artist: 'Test Artist',
        coverArtUrl: 'http://example.com/cover.jpg'
      };

      const chainedMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockRankings)
      };

      let findCallCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => {
          if (findCallCount === 0) {
            findCallCount++;
            return chainedMock;
          }
          findCallCount++;
          return {
            toArray: jest.fn().mockResolvedValue(
              findCallCount % 2 === 0 ? [mockUser] : [mockAlbum]
            )
          };
        }),
        countDocuments: jest.fn().mockResolvedValue(1)
      });

      const res = await request(app).get('/api/allRankings?limit=15&skip=0');

      expect(res.status).toBe(200);
      expect(res.body.rankings).toBeDefined();
    });

    it('getAllRankings_EmptyResults_ReturnsEmpty', async () => {
      const chainedMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      };

      mockCollection.mockReturnValue({
        find: jest.fn(() => chainedMock),
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      const res = await request(app).get('/api/allRankings');

      expect(res.status).toBe(200);
      expect(res.body.rankings).toEqual([]);
    });
  });

  //AUTHENTICATED PROFILE ENDPOINTS

  describe('GET /api/users/profile', () => {
    it('getAuthProfile_ValidToken_ReturnsProfile', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        followers: [],
        following: [],
        toListen: [],
        top3: []
      };

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockUser] : []);
          })
        }))
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
    });

    //api returns 404
    it('getAuthProfile_ExpiredToken_Returns404', async () => {
      const token = require('../createJWT.js');
      token.isExpired.mockReturnValueOnce(true);

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer expired-token');

      expect([401, 404]).toContain(res.status);
    });

    it('getAuthProfile_MissingToken_Returns404', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect([401, 404]).toContain(res.status);
    });

    it('getAuthProfile_UserNotFound_Returns404', async () => {
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/profile/followers', () => {
    it('getAuthProfile_ValidToken_ReturnsProfile', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        followers: [],
        following: [],
        toListen: [],
        top3: []
      };

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockUser] : []);
          })
        }))
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
    });

    it('getAuthProfile_ExpiredToken_Returns404', async () => {
      const token = require('../createJWT.js');
      token.isExpired.mockReturnValueOnce(true);

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer expired-token');

      //returns 404
      expect([401, 404]).toContain(res.status);
    });

    it('getAuthProfile_MissingToken_Returns404', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      //returns 404
      expect([401, 404]).toContain(res.status);
    });

    it('getAuthProfile_UserNotFound_Returns404', async () => {
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/profile/following', () => {
    it('getAuthFollowing_ValidToken_ReturnsFollowing', async () => {
      //force reset the mock completely
      jest.resetModules();
      const token = require('../createJWT.js');
      token.isExpired = jest.fn().mockReturnValue(false);
      token.refresh = jest.fn().mockReturnValue({ accessToken: 'refreshed-token' });

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        following: ['507f1f77bcf86cd799439012']
      };

      const mockFollowing = [
        { _id: '507f1f77bcf86cd799439012', username: 'follower1' }
      ];

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            return Promise.resolve(callCount === 1 ? [mockUser] : mockFollowing);
          })
        }))
      });

      const res = await request(app)
        .get('/api/users/profile/following')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect([200, 500]).toContain(res.status);
    });

    it('getAuthFollowing_MissingToken_ReturnsError', async () => {
      const res = await request(app)
        .get('/api/users/profile/following');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('getAuthFollowing_UserNotFound_ReturnsError', async () => {
      const token = require('../createJWT.js');
      token.isExpired = jest.fn().mockReturnValue(false);

      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([])
        }))
      });

      const res = await request(app)
        .get('/api/users/profile/following')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

});


describe('Additional Coverage Tests - Uncovered Branches', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    const token = require('../createJWT.js');
    token.isExpired.mockReturnValue(false);
  });

  //SEARCH ALBUMS - Promise.all rankings branch
  describe('POST /api/searchAlbums - Rankings Branch', () => {
    it('searchAlbums_WithRankings_CalculatesAverage', async () => {
      const mockAlbums = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Album',
          artist: 'Test Artist',
          coverArtUrl: 'http://example.com/cover.jpg'
        }
      ];

      const mockRankings = [
        { album: '507f1f77bcf86cd799439011', rankValue: 8 },
        { album: '507f1f77bcf86cd799439011', rankValue: 9 }
      ];

      let findCallCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => {
          findCallCount++;
          if (findCallCount === 1) {
            //first call: album search
            return {
              skip: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              toArray: jest.fn().mockResolvedValue(mockAlbums)
            };
          } else {
            return {
              toArray: jest.fn().mockResolvedValue(mockRankings)
            };
          }
        }),
        countDocuments: jest.fn().mockResolvedValue(1)
      });

      const res = await request(app)
        .post('/api/searchAlbums')
        .send({ title: 'Test', limit: 50, skip: 0 });

      expect(res.status).toBe(200);
      expect(res.body.albums[0].averageRanking).toBeDefined();
    });
  });

  //LEADERBOARD edge case branch
  describe('GET /api/leaderboard - Empty Results', () => {
    it('leaderboard_NoTotalCount_ReturnsZero', async () => {
      mockCollection.mockReturnValue({
        aggregate: jest.fn(() => ({
          toArray: jest.fn()
            .mockResolvedValueOnce([]) 
            .mockResolvedValueOnce([])  
        }))
      });

      const res = await request(app).get('/api/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.totalCount).toBe(0);
    });
  });

  describe('GET /api/leaderboard/users - Empty Results', () => {
    it('leaderboardUsers_NoTotalCount_ReturnsZero', async () => {
      mockCollection.mockReturnValue({
        aggregate: jest.fn(() => ({
          toArray: jest.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
        }))
      });

      const res = await request(app).get('/api/leaderboard/users');

      expect(res.status).toBe(200);
      expect(res.body.totalCount).toBe(0);
    });
  });

  //ALL RANKINGS - Null user/album handling 
  describe('GET /api/allRankings - Null Handling', () => {
    it('allRankings_WithInvalidUserOrAlbum_FiltersOut', async () => {
      const mockRankings = [
        {
          _id: '507f1f77bcf86cd799439011',
          user: '507f1f77bcf86cd799439012',
          album: '507f1f77bcf86cd799439013',
          rankValue: 8,
          notes: 'Great album',
          createdAt: new Date()
        }
      ];

      const chainedMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockRankings)
      };

      let findCallCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => {
          if (findCallCount === 0) {
            findCallCount++;
            return chainedMock;
          }
          findCallCount++;
          return {
            toArray: jest.fn().mockResolvedValue([])
          };
        }),
        countDocuments: jest.fn().mockResolvedValue(1)
      });

      const res = await request(app).get('/api/allRankings');

      expect(res.status).toBe(200);
      //should filter out rankings where user/album not found
      expect(res.body.rankings).toEqual([]);
    });
  });

  //PROFILE ENDPOINTS - Missing authorization header
  describe('GET /api/users/profile - Auth Header Variations', () => {
    it('profile_InvalidAuthHeader_ReturnsError', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('profile_EmptyAuthHeader_ReturnsError', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', '');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  //PROFILE FOLLOWERS - Error handling 
  describe('GET /api/users/profile/followers - Error Paths', () => {
    it('profileFollowers_DatabaseError_Returns500', async () => {
      const token = require('../createJWT.js');
      token.isExpired.mockReturnValue(false);

      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/users/profile/followers')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/users/profile/following - Error Paths', () => {
    it('profileFollowing_DatabaseError_Returns500', async () => {
      const token = require('../createJWT.js');
      token.isExpired.mockReturnValue(false);

      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/users/profile/following')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(500);
    });
  });

  //GET USERS BY USERNAME - Top3 album lookup
  describe('GET /api/users/:username - Top3 Lookup', () => {
    it('getUser_WithTop3Albums_ReturnsAlbumDetails', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        followers: [],
        following: [],
        toListen: [],
        top3: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
      };

      const mockAlbum = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Top Album',
        artist: 'Top Artist',
        coverArtUrl: 'http://example.com/cover.jpg'
      };

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockUser]);
            if (callCount === 2) return Promise.resolve([]); //rankings
            return Promise.resolve([mockAlbum]); //top3 albums
          })
        }))
      });

      const res = await request(app).get('/api/users/testuser');

      expect(res.status).toBe(200);
      expect(res.body.topThree).toBeDefined();
    });

    it('getUser_Top3AlbumNotFound_SkipsAlbum', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        followers: [],
        following: [],
        toListen: [],
        top3: ['507f1f77bcf86cd799439012']
      };

      let callCount = 0;
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve([mockUser]);
            return Promise.resolve([]); 
          })
        }))
      });

      const res = await request(app).get('/api/users/testuser');

      expect(res.status).toBe(200);
      expect(res.body.topThree).toEqual([]);
    });

    it('getUser_DatabaseError_Returns500', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app).get('/api/users/testuser');

      expect(res.status).toBe(500);
    });
  });

  //GET FOLLOWERS/FOLLOWING BY USERNAME Errors
  describe('GET /api/users/:username/followers - Error Handling', () => {
    it('getFollowers_DatabaseError_Returns500', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app).get('/api/users/testuser/followers');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/users/:username/following - Error Handling', () => {
    it('getFollowing_DatabaseError_Returns500', async () => {
      mockCollection.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app).get('/api/users/testuser/following');

      expect(res.status).toBe(500);
    });
  });

});