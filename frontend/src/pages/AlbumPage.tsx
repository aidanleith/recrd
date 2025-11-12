import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildPath } from '../components/Path';
import { retrieveToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import RankingCard from '../components/RankingCard';
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

function AlbumPage() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!title) {
        setError('No album title provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Convert URL title (with dashes) back to regular title
        const albumTitle = title.replace(/-/g, ' ');
        const response = await fetch(buildPath(`api/albums/${encodeURIComponent(albumTitle)}`));

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }

        setAlbumData(data);

        // Get current user's ranking by finding their username in rankings
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
                    setUserRanking(userRankingData.rankValue);
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
  }, [title]);

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

  if (!albumData) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-(--darktext)">Album not found</p>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRankingBackgroundClass = (ranking: number): string => {
    if (ranking >= 8) return 'bg-green-500';  // Great (8-10)
    if (ranking >= 5) return 'bg-yellow-500'; // Average (5-7)
    return 'bg-red-500';                      // Poor (1-4)
  };

  // Get album title from albumData if available, otherwise from URL
  const albumTitle = albumData ? (albumData as any).title || (title ? title.replace(/-/g, ' ') : 'Unknown Album') : (title ? title.replace(/-/g, ' ') : 'Unknown Album');

  return (
    <div className="flex flex-col gap-8">
      <div className='flex gap-6 justify-between'>
        <div className='flex gap-6'>
        <div className="flex justify-center">
          {albumData.coverArtUrl ? (
            <img
              src={albumData.coverArtUrl}
              alt={`${albumTitle} cover`}
              className="w-60 h-60 rounded-lg object-cover shadow-2xl"
            />
          ) : (
            <div className="w-60 h-60 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-gray-500 text-lg">No Cover</span>
            </div>
          )}
        </div>

        {/* Album Info */}
        <div className='flex flex-row justify-between'>
          <div className='flex flex-col justify-between'>
            <div className="flex flex-col items-start">
              <h1 className="text-4xl font-bold text-white text-start">
                {albumData.title || albumTitle}
              </h1>
              <p className="text-2xl text-gray-400 text-start">
                {albumData.artist}
              </p>
              {albumData.releaseDate && (
                <p className="text-lg text-gray-500 text-start">
                  {formatDate(albumData.releaseDate)}
                </p>
              )}
            </div>

            <div className="flex justify-start">
              <Button
                onClick={() => {
                  const urlTitle = albumData.title ? albumData.title.replace(/\s+/g, '-').toLowerCase() : title;
                  navigate(`/album/${urlTitle}/rank`);
                }}
                variant="tertiary"
                size="md"
              >
                {userRanking !== null ? 'edit ranking' : 'rank this album'}
              </Button>
            </div>
          </div>
        </div>
          </div>
          <div className="flex flex-col justify-between gap-8 items-end">
            <div className="flex flex-col items-end gap-2">
              <span className="text-gray-400 text-xl">your ranking</span>
              {userRanking !== null ? (
                <span className={`${getRankingBackgroundClass(userRanking)} text-white font-bold text-2xl px-4 py-2 rounded-lg`}>
                  {userRanking}/10
                </span>
              ) : (
                <span className="text-gray-500 font-bold text-2xl">
                  —
                </span>
              )}
            </div>
            <div className="flex flex-col items-end text-end gap-2">
              <span className="text-gray-400 text-xl">global ranking</span>
              {albumData.averageRanking > 0 ? (
                <span className={`${getRankingBackgroundClass(albumData.averageRanking)} text-white font-bold text-2xl px-4 py-2 rounded-lg`}>
                  {albumData.averageRanking.toFixed(1)}/10
                </span>
              ) : (
                <span className="text-gray-500 font-bold text-2xl">
                  —
                </span>
              )}
            </div>
        </div>
      </div>

      {/* All Rankings */}
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-white text-start">all rankings</h2>
        {albumData.rankings && albumData.rankings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {albumData.rankings.map((ranking, index) => (
              <RankingCard
                key={index}
                ranking={ranking}
                album={{
                  title: albumData.title || albumTitle,
                  artist: albumData.artist,
                  coverArtUrl: albumData.coverArtUrl
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No rankings yet. Be the first to rank this album!
          </p>
        )}
      </div>
    </div>
  );
}

export default AlbumPage;

