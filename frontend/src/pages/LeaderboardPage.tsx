import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { buildPath } from '../components/Path';
import AlbumDisplay from '../components/AlbumDisplay';

interface Album {
  _id: string;
  title: string;
  artist: string;
  coverArtUrl?: string;
  releaseDate?: string;
  genre?: string;
  averageRanking?: number;
  rankingCount?: number;
}

interface User {
  _id: string;
  username: string;
  rankingCount?: number;
  averageRanking?: number;
}

function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<'albums' | 'users'>('albums');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const limit = 50;

  const loadAlbums = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(buildPath(`api/leaderboard?limit=${limit}&skip=0`));

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.albums) {
        setAlbums(data.albums);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(buildPath(`api/leaderboard/users?limit=${limit}&skip=0`));

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.users) {
        setUsers(data.users);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leaderboardType === 'albums') {
      loadAlbums();
    } else {
      loadUsers();
    }
  }, [leaderboardType]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-4xl font-bold text-white text-start">leaderboard</h2>
      {/* <p className="text-gray-400">
        {leaderboardType === 'albums' 
          ? 'Albums ranked by number of rankings. Showing the most popular albums on the platform.'
          : 'Users ranked by number of rankings. Showing the most active users on the platform.'}
      </p> */}

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setLeaderboardType('albums')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            leaderboardType === 'albums'
              ? 'bg-yellow-400 text-black'
              : 'bg-transparent text-white hover:bg-[#2a2a2a]'
          }`}
        >
          top albums
        </button>
        <button
          type="button"
          onClick={() => setLeaderboardType('users')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            leaderboardType === 'users'
              ? 'bg-yellow-400 text-black'
              : 'bg-transparent text-white hover:bg-[#2a2a2a]'
          }`}
        >
          top users
        </button>
      </div>

      {isLoading && ((leaderboardType === 'albums' && albums.length === 0) || (leaderboardType === 'users' && users.length === 0)) ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-(--darktext)">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : leaderboardType === 'albums' && albums.length > 0 ? (
        <>
          <div className="mt-6">
            <div className="space-y-1">
              {albums.map((album, index) => {
                return (
                  <div key={album._id} className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm font-medium w-8 text-right">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <AlbumDisplay
                        album={album}
                        onClick={() => {
                          const urlTitle = album.title.replace(/\s+/g, '-').toLowerCase();
                          navigate(`/album/${urlTitle}`);
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-white text-sm font-semibold">
                        {album.rankingCount} {album.rankingCount === 1 ? 'ranking' : 'rankings'}
                      </span>
                      {album.averageRanking !== undefined && album.averageRanking > 0 && (
                        <span className="text-gray-400 text-xs">
                          Avg: {album.averageRanking.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : leaderboardType === 'users' && users.length > 0 ? (
        <>
          <div className="mt-6">
            <div className="space-y-2">
              {users.map((user, index) => {
                return (
                  <div 
                    key={user._id} 
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                    onClick={() => navigate(`/profile/${user.username}`)}
                  >
                    <span className="text-gray-400 text-sm font-medium w-8 text-right">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">{user.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-white text-sm font-semibold">
                        {user.rankingCount} {user.rankingCount === 1 ? 'ranking' : 'rankings'}
                      </span>
                      {user.averageRanking !== undefined && user.averageRanking > 0 && (
                        <span className="text-gray-400 text-xs">
                          Avg: {user.averageRanking.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center py-12">
          <p className="text-(--darktext)">
            {leaderboardType === 'albums' ? 'No albums found.' : 'No users found.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;

