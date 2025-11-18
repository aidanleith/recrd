import { useState, useEffect } from 'react';
import { buildPath } from '../components/Path';
import RankingCard from '../components/RankingCard';
import { Button } from '../components/ui/Button';

interface Ranking {
  username: string;
  rankValue: number;
  notes?: string;
  createdAt: string | Date;
  album: {
    _id?: string;
    title: string;
    artist: string;
    coverArtUrl?: string;
  };
}

const HomePage = () => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const rankingsPerPage = 15;

  const fetchRankings = async (skip: number = 0, append: boolean = false) => {
    if (skip === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    try {
      const response = await fetch(buildPath(`api/allRankings?limit=${rankingsPerPage}&skip=${skip}`));
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.error) {
        setError(data.error);
      } else {
        // Handle new response format with rankings array and hasMore
        if (data.rankings) {
          if (append) {
            setRankings(prev => [...prev, ...data.rankings]);
          } else {
            setRankings(data.rankings);
          }
          setHasMore(data.hasMore || false);
        } else {
          // Fallback for old format (array directly)
          if (append) {
            setRankings(prev => [...prev, ...data]);
          } else {
            setRankings(data);
          }
          setHasMore(false);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load rankings');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRankings(0, false);
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    fetchRankings(rankings.length, true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-white">Loading...</p>
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

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* <h1 className="text-3xl font-bold text-white text-start">all rankings</h1> */}
      {rankings.length > 0 ? (
        <>
          <div className="flex flex-col gap-2 sm:gap-3">
            {rankings.map((ranking, index) => (
              <RankingCard
                key={index}
                ranking={{
                  username: ranking.username,
                  rankValue: ranking.rankValue,
                  notes: ranking.notes,
                  createdAt: ranking.createdAt
                }}
                album={ranking.album}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                aria-label='Loading...'
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="primary"
                size="md"
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No rankings yet.
        </p>
      )}

      {/* Temporary Debug Logout Button */}
      <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
        <Button
          aria-label='Log out'
          onClick={() => {
            localStorage.removeItem('user_data');
            localStorage.removeItem('token_data');
            window.location.href = '/login';
          }}
          variant="secondary"
          size="md"
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

export default HomePage;