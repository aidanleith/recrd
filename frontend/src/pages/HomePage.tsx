import React, { useState, useEffect } from 'react';
import { buildPath } from '../components/Path';
import RankingCard from '../components/RankingCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

interface Ranking {
  username: string;
  rankValue: number;
  notes?: string;
  createdAt: string | Date;
  album: {
    title: string;
    artist: string;
    coverArtUrl?: string;
  };
}

const HomePage = () => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(buildPath('api/allRankings'));
        
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
          setRankings(data);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load rankings');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

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
    <div className="flex flex-col gap-6">
      {/* <h1 className="text-3xl font-bold text-white text-start">all rankings</h1> */}
      {rankings.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rankings.map((ranking, index) => (
            <div
              key={index}
              onClick={() => {
                const urlTitle = ranking.album.title.replace(/\s+/g, '-').toLowerCase();
                navigate(`/album/${urlTitle}`);
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <RankingCard
                ranking={{
                  username: ranking.username,
                  rankValue: ranking.rankValue,
                  notes: ranking.notes,
                  createdAt: ranking.createdAt
                }}
                album={ranking.album}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No rankings yet.
        </p>
      )}

      {/* Temporary Debug Logout Button */}
      <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
        <Button
          onClick={() => {
            localStorage.removeItem('user_data');
            localStorage.removeItem('token_data');
            window.location.href = '/login';
          }}
          variant="secondary"
          size="md"
          className="w-full"
        >
          [DEBUG] Logout
        </Button>
      </div>
    </div>
  );
}

export default HomePage;