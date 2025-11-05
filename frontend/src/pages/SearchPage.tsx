import React, { useState } from 'react';

// 1. Define the "shape" of your data
interface Album {
  _id: string; // Or 'number', whatever your ID type is
  title: string;
  // Add any other properties you might use, e.g., 'artist'
}

interface User {
  _id: string;
  username: string;
  // Add any other properties, e.g., 'profilePic'
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('albums');
  
  // 2. Use separate, typed state for results
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    // Clear both result sets
    setAlbumResults([]);
    setUserResults([]);

    let apiUrl = '';
    let requestBody = {};

    if (searchType === 'albums') {
      apiUrl = '/api/searchAlbums';
      requestBody = { title: query };
    } else {
      apiUrl = '/api/searchUsers';
      requestBody = { search: query };
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 4. Set the correct state based on the search
      if (searchType === 'albums') {
        setAlbumResults(data);
      } else {
        setUserResults(data);
      }

    } catch (err) {
      // 5. Safely handle the 'unknown' error type
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (isLoading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // 6. Render based on the specific, typed result arrays
    if (searchType === 'albums' && albumResults.length > 0) {
      return (
        <div>
          <h3>Album Results</h3>
          <ul>
            {/* TS now knows 'album' is of type 'Album' */}
            {albumResults.map((album) => (
              <li key={album._id}>{album.title}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    if (searchType === 'users' && userResults.length > 0) {
      return (
        <div>
          <h3>User Results</h3>
          <ul>
            {/* TS now knows 'user' is of type 'User' */}
            {userResults.map((user) => (
              <li key={user._id}>{user.username}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    // If no results (and not loading/error), show nothing
    return null; 
  };

  return (
    <div>
      <h2>Search</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          <input
            type="radio"
            value="albums"
            checked={searchType === 'albums'}
            onChange={(e) => setSearchType(e.target.value)}
          />
          Search Albums
        </label>
        <label>
          <input
            type="radio"
            value="users"
            checked={searchType === 'users'}
            onChange={(e) => setSearchType(e.target.value)}
          />
          Search Users
        </label>
      </div>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === 'albums' ? 'Enter album title...' : 'Enter username...'}
          style={{ width: '300px' }}
        />
        {/* 1. Fixed 'typeS' to 'type' */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem' }}>
        {renderResults()}
      </div>
    </div>
  );
}

export default SearchPage;