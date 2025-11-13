import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildPath } from '../components/Path';
import { retrieveToken } from '../tokenStorage';
import { Button } from '../components/ui/Button';

interface AlbumData {
  id: string;
  title?: string;
  artist: string;
  releaseDate: string | Date;
  genre?: string;
  coverArtUrl?: string;
  averageRanking: number;
  rankings: Array<{
    username: string;
    rankValue: number;
    notes?: string;
    createdAt: string | Date;
  }>;
}

function RankAlbumPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rankValue, setRankValue] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRanking, setHasExistingRanking] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) {
        setError('No album ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(buildPath(`api/albums/${id}`));

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }

        setAlbumData(data);

        // Get current user's username and check if they have a ranking
        const userData = localStorage.getItem('user_data');
        if (userData && data.rankings) {
          try {
            const user = JSON.parse(userData);
            // Get username from API
            try {
              const userInfoResponse = await fetch(buildPath(`api/userById/${user.id}`));
              if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
                if (userInfo.username) {
                  setCurrentUsername(userInfo.username);
                  // Find user's ranking
                  const userRankingData = data.rankings.find(
                    (r: any) => r.username === userInfo.username
                  );
                  if (userRankingData) {
                    setHasExistingRanking(true);
                    setRankValue(userRankingData.rankValue);
                    setNotes(userRankingData.notes || '');
                  }
                }
              }
            } catch (e) {
              console.log('Could not fetch user info:', e);
            }
          } catch (e) {
            console.log('Error parsing user data:', e);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load album');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!albumData) {
      setError('Album data not loaded');
      return;
    }

    const token = retrieveToken();
    if (!token) {
      setError('You must be logged in to rank an album');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = hasExistingRanking ? 'api/editRanking' : 'api/createRanking';
      const method = hasExistingRanking ? 'PATCH' : 'POST';

      const response = await fetch(buildPath(endpoint), {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albumId: albumData.id,
          rankValue: rankValue,
          notes: notes,
          jwtToken: token,
        }),
      });

      const data = await response.json();

      if (data && data !== '') {
        setError(data);
      } else {
        // Success - navigate back to album page
        navigate(`/album/${albumData.id}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit ranking');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (error && !albumData) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-white">Album not found</p>
      </div>
    );
  }

  const albumTitle = albumData.title || 'Unknown Album';

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-2xl mx-auto w-full">
      {/* Album Info Header */}
      <div className="flex flex-row gap-4 sm:gap-6 items-center">
        {albumData.coverArtUrl ? (
          <img
            src={albumData.coverArtUrl}
            alt={`${albumTitle} cover`}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover shadow-lg flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
            <span className="text-gray-500 text-xs sm:text-sm">No Cover</span>
          </div>
        )}
        <div className="flex flex-col items-start min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-white truncate w-full">
            {albumTitle}
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 truncate w-full">
            {albumData.artist}
          </p>
        </div>
      </div>

      {/* Existing Ranking Notice */}
      {hasExistingRanking && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-yellow-400 font-semibold">
            You already have a ranking for this album. You can edit it below.
          </p>
        </div>
      )}

      {/* Ranking Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Ranking Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="rankValue" className="text-white font-semibold text-lg text-start">
            your rating
          </label>
          <input
            type="number"
            id="rankValue"
            min="1"
            max="10"
            value={rankValue}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= 10) {
                setRankValue(value);
              }
            }}
            className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[--primary]"
            required
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <Button
                key={num}
                type="button"
                onClick={() => setRankValue(num)}
                variant={rankValue === num ? "tertiary" : "secondary"}
                size="sm"
                className="min-w-[2.5rem] sm:min-w-[3rem]"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Notes Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className="text-white font-semibold text-lg text-start">
            notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[--primary] resize-none"
            placeholder="Share your thoughts about this album..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="tertiary"
            size="lg"
            className="flex-1 w-full sm:w-auto"
          >
            {isSubmitting ? 'Submitting...' : hasExistingRanking ? 'update ranking' : 'submit ranking'}
          </Button>
          <button
            type="button"
            onClick={() => {
              navigate(`/album/${albumData.id}`);
            }}
            className="px-6 py-3 bg-[#2a2a2a] text-white font-semibold rounded-lg hover:bg-[#3a3a3a] transition-colors w-full sm:w-auto"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default RankAlbumPage;

