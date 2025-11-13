import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { buildPath } from '../components/Path';
import AlbumDisplay from '../components/AlbumDisplay';

// 1. Define the "shape" of your data
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
  // Add any other properties, e.g., 'profilePic'
}

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('albums');
  
  // 2. Use separate, typed state for results
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Load more state for albums
  const [albumsLoaded, setAlbumsLoaded] = useState(0);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(false);
  const [totalAlbumCount, setTotalAlbumCount] = useState(0);
  const albumsPerPage = 50;
  
  // Pagination state (for users, keep existing pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sort state
  const [sortBy, setSortBy] = useState<string>('most-rankings');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    // Clear both result sets
    setAlbumResults([]);
    setUserResults([]);
    // Reset to first page when searching
    setCurrentPage(1);
    setAlbumsLoaded(0);
    setHasMoreAlbums(false);
    setTotalAlbumCount(0);

    let apiUrl = '';
    let requestBody = {};

    if (searchType === 'albums') {
      apiUrl = 'api/searchAlbums';
      requestBody = { title: query, limit: albumsPerPage, skip: 0 };
    } else {
      apiUrl = 'api/searchUsers';
      requestBody = { search: query };
    }

    try {
      const response = await fetch(buildPath(apiUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 4. Set the correct state based on the search
      if (searchType === 'albums') {
        console.log('Album results with rankings:', data);
        // Handle new response format with pagination info
        if (data.albums) {
          setAlbumResults(data.albums);
          setAlbumsLoaded(data.albums.length);
          setHasMoreAlbums(data.hasMore || false);
          setTotalAlbumCount(data.totalCount || 0);
        } else {
          // Fallback for old format (shouldn't happen, but just in case)
          setAlbumResults(data);
          setAlbumsLoaded(data.length);
          setHasMoreAlbums(false);
          setTotalAlbumCount(data.length);
        }
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

  const handleLoadMore = async () => {
    if (!hasMoreAlbums || isLoadingMore) return;
    
    setIsLoadingMore(true);
    setError('');

    try {
      const response = await fetch(buildPath('api/searchAlbums'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: query, 
          limit: albumsPerPage, 
          skip: albumsLoaded 
        }),
      });

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
        // Append new albums to existing results
        setAlbumResults(prev => [...prev, ...data.albums]);
        setAlbumsLoaded(prev => prev + data.albums.length);
        setHasMoreAlbums(data.hasMore || false);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Sort results (for albums, sort all loaded albums; for users, sort and paginate)
  const getSortedResults = () => {
    let results = searchType === 'albums' ? [...albumResults] : [...userResults];
    
    // Apply sorting for albums
    if (searchType === 'albums' && sortBy !== 'none') {
      results.sort((a, b) => {
        const albumA = a as Album;
        const albumB = b as Album;
        
        switch (sortBy) {
          case 'highest-ranking':
            // Highest to lowest average ranking
            const avgA = albumA.averageRanking || 0;
            const avgB = albumB.averageRanking || 0;
            return avgB - avgA;
            
          case 'lowest-ranking':
            // Lowest to highest average ranking
            const avgA2 = albumA.averageRanking || 0;
            const avgB2 = albumB.averageRanking || 0;
            return avgA2 - avgB2;
            
          case 'most-rankings':
            // Most rankings to least
            const countA = albumA.rankingCount || 0;
            const countB = albumB.rankingCount || 0;
            return countB - countA;
            
          case 'least-rankings':
            // Least rankings to most
            const countA2 = albumA.rankingCount || 0;
            const countB2 = albumB.rankingCount || 0;
            return countA2 - countB2;
            
          case 'alphabetical-az':
            // Alphabetical A-Z by title
            const titleA = albumA.title.toLowerCase();
            const titleB = albumB.title.toLowerCase();
            if (titleA < titleB) return -1;
            if (titleA > titleB) return 1;
            return 0;
            
          case 'alphabetical-za':
            // Alphabetical Z-A by title
            const titleA2 = albumA.title.toLowerCase();
            const titleB2 = albumB.title.toLowerCase();
            if (titleA2 > titleB2) return -1;
            if (titleA2 < titleB2) return 1;
            return 0;
            
          case 'newest-release':
            // Newest to oldest release date
            const dateA = albumA.releaseDate ? new Date(albumA.releaseDate).getTime() : 0;
            const dateB = albumB.releaseDate ? new Date(albumB.releaseDate).getTime() : 0;
            return dateB - dateA; // Newest first (larger date value first)
            
          case 'oldest-release':
            // Oldest to newest release date
            const dateA2 = albumA.releaseDate ? new Date(albumA.releaseDate).getTime() : 0;
            const dateB2 = albumB.releaseDate ? new Date(albumB.releaseDate).getTime() : 0;
            return dateA2 - dateB2; // Oldest first (smaller date value first)
            
          default:
            return 0;
        }
      });
    }
    
    return results;
  };

  // For users, apply pagination
  const getPaginatedUserResults = () => {
    const results = getSortedResults();
    if (searchType === 'users') {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return results.slice(startIndex, endIndex);
    }
    return results;
  };

  const getTotalPages = () => {
    if (searchType === 'users') {
      return Math.ceil(userResults.length / itemsPerPage);
    }
    return 1;
  };

  const totalPages = getTotalPages();
  const sortedResults = getSortedResults();
  const paginatedUserResults = getPaginatedUserResults();

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-[#1e1e1e] border border-(--primary) text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors"
        >
          previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-2 rounded-lg bg-[#1e1e1e] border border-(--primary) text-white hover:bg-[#2a2a2a] transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              currentPage === page
                ? 'bg-(--primary) border-(--primary) text-white'
                : 'bg-[#1e1e1e] border-(--primary) text-white hover:bg-[#2a2a2a]'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 rounded-lg bg-[#1e1e1e] border border-(--primary) text-white hover:bg-[#2a2a2a] transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-[#1e1e1e] border border-(--primary) text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors"
        >
          next
        </button>
      </div>
    );
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-(--darktext)">Loading...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    // 6. Render based on the specific, typed result arrays
    if (searchType === 'albums' && albumResults.length > 0) {
      return (
        <div className="mt-6">
          {/* <h3 className="text-2xl font-bold text-white mb-4">
            Album Results ({albumResults.length} {albumResults.length === 1 ? 'result' : 'results'})
          </h3> */}
          <div className="space-y-1">
            {sortedResults.map((album, index) => {
              return (
                <div key={album._id} className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm font-medium w-8 text-right">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <AlbumDisplay
                      album={album as Album}
                      onClick={() => {
                        // Navigate to album detail page
                        navigate(`/album/${(album as Album)._id}`);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {hasMoreAlbums && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 rounded-lg bg-(--primary) text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoadingMore ? 'Loading...' : `Load More (${albumsLoaded} of ${totalAlbumCount})`}
              </button>
            </div>
          )}
        </div>
      );
    }
    
    if (searchType === 'users' && userResults.length > 0) {
      return (
        <div className="mt-6">
          <h3 className="text-2xl font-bold text-white mb-4">
            user results ({userResults.length} {userResults.length === 1 ? 'result' : 'results'})
          </h3>
          <div className="space-y-2">
            {paginatedUserResults.map((user) => (
              <div
                key={user._id}
                className="p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              >
                <p className="text-white font-semibold">{(user as User).username}</p>
              </div>
            ))}
          </div>
          {renderPagination()}
        </div>
      );
    }
    
    // If no results (and not loading/error), show nothing
    return null; 
  };

  return (
    <div className="flex flex-col gap-6">
      {/* <h2 className="text-4xl font-bold text-white">Search</h2> */}

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => setSearchType('albums')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            searchType === 'albums'
              ? 'bg-yellow-400 text-black'
              : 'bg-transparent text-white hover:bg-[#2a2a2a]'
          }`}
        >
          albums
        </button>
        <button
          type="button"
          onClick={() => setSearchType('users')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            searchType === 'users'
              ? 'bg-yellow-400 text-black'
              : 'bg-transparent text-white hover:bg-[#2a2a2a]'
          }`}
        >
          users
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === 'albums' ? 'enter album title or artist...' : 'enter username...'}
            className="flex-1 max-w-md h-12 px-4 rounded-lg bg-[#1e1e1e] border border-(--primary) text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--primary)"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 h-12 rounded-lg bg-(--primary) text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? 'searching...' : 'search'}
          </button>
        </form>
        
        {searchType === 'albums' && albumResults.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
            className="h-12 px-4 rounded-lg bg-[#1e1e1e] border border-(--primary) text-white focus:outline-none focus:ring-2 focus:ring-(--primary) cursor-pointer"
          >
            <option value="none">Sort by...</option>
            <option value="highest-ranking">Highest Ranking ↓</option>
            <option value="lowest-ranking">Lowest Ranking ↑</option>
            <option value="most-rankings">Most Rankings ↓</option>
            <option value="least-rankings">Least Rankings ↑</option>
            <option value="alphabetical-az">Alphabetical A-Z</option>
            <option value="alphabetical-za">Alphabetical Z-A</option>
            <option value="newest-release">Newest Release ↓</option>
            <option value="oldest-release">Oldest Release ↑</option>
          </select>
        )}
      </div>

      <div>
        {renderResults()}
      </div>
    </div>
  );
}

export default SearchPage;