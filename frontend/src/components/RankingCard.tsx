import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RankingCardProps {
  ranking: {
    username: string;
    rankValue: number;
    notes?: string;
    createdAt: string | Date;
  };
  album: {
    _id?: string;
    title: string;
    artist: string;
    coverArtUrl?: string;
  };
}

function RankingCard({ ranking, album }: RankingCardProps) {
  const navigate = useNavigate();

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

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click (album navigation)
    navigate(`/profile/${ranking.username}`);
  };

  const handleAlbumClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click if any
    if (album._id) {
      navigate(`/album/${album._id}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg group">
      {/* Header: [name] ranked a new album */}
      <div className="flex items-center gap-6">
        <div className='flex gap-2'>
        <span 
          className="text-white text-xl font-semibold cursor-pointer hover:text-(--primary) transition-colors"
          onClick={handleUsernameClick}
        >
          {ranking.username}
        </span>
        <span className="text-gray-400 text-xl">ranked an album</span>
        </div>

        {/* Ranking */}
        <span className={`${getRankingBackgroundClass(ranking.rankValue)} text-white font-bold text-xl px-3 py-1 rounded-lg inline-block`}>
          {ranking.rankValue}/10
        </span>
      </div>


      {/* Album info row - cover on left, title/artist on right */}
      <div className="flex flex-row gap-4 items-center">
        {/* Album cover - Left */}
        <div className="flex-shrink-0 cursor-pointer" onClick={handleAlbumClick}>
          {album.coverArtUrl ? (
            <img
              src={album.coverArtUrl}
              alt={`${album.title} cover`}
              className="w-24 h-24 rounded-md object-cover shadow-lg"
            />
          ) : (
            <div className="w-30 h-30 rounded-md bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Cover</span>
            </div>
          )}
        </div>

        {/* Album info - Right */}
        <div className="flex items-start min-w-0 flex-1 justify-between">
          <div className='flex items-start flex-col cursor-pointer' onClick={handleAlbumClick}>
            <h3 className="text-white font-bold text-xl truncate hover:text-(--primary) transition-colors">
              {album.title}
            </h3>
            <p className="text-gray-400 text-xl truncate mt-1">
              {album.artist}
            </p>
          </div>

          <div className='flex flex-col items-end'>
            {/* Comment/Notes */}
            {ranking.notes && ranking.notes.trim() && (
              <div className="mt-2">
                <p className="text-gray-300 italic">
                  "{ranking.notes}"
                </p>
              </div>
            )}

            {/* Date */}
            <div className="text-gray-500 text-xs mt-1">
              {formatDate(ranking.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RankingCard;

