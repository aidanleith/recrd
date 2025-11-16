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
      <div className="flex flex-row items-center justify-between gap-5 sm:gap-6">
        <div className='flex flex-wrap gap-2 items-center'>
        <span 
          className="text-white text-base sm:text-xl font-semibold cursor-pointer hover:text-(--primary) transition-colors"
          onClick={handleUsernameClick}
        >
          {ranking.username}
        </span>
        <span className="text-gray-400 text-base sm:text-xl">ranked an album</span>
        </div>

        {/* Ranking */}
        <span className={`${getRankingBackgroundClass(ranking.rankValue)} text-white font-bold text-lg sm:text-xl px-2 sm:px-3 py-1 rounded-lg inline-block md:hidden w-16 sm:w-20 text-center ml-auto flex-shrink-0`}>
          {ranking.rankValue}/10
        </span>
      </div>


      {/* Album info row - cover on left, title/artist on right */}
      <div className="flex flex-row gap-3 sm:gap-4 items-start sm:items-center min-w-0 overflow-hidden">
        {/* Album cover - Left */}
        <div className="flex-shrink-0 cursor-pointer" onClick={handleAlbumClick}>
          {album.coverArtUrl ? (
            <img
              src={album.coverArtUrl}
              alt={`${album.title} cover`}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-md object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-md bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Cover</span>
            </div>
          )}
        </div>

        {/* Album info - Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-start min-w-0 flex-1 justify-between gap-2 sm:gap-0 overflow-hidden">
          <div className='flex items-start flex-col cursor-pointer min-w-0 flex-1 overflow-hidden' onClick={handleAlbumClick}>
            <h3 className="text-white font-bold text-start text-base sm:text-xl truncate w-full max-w-full hover:text-(--primary) transition-colors">
              {album.title}
            </h3>
            <p className="text-gray-400 text-sm text-start sm:text-xl truncate mt-1 w-full max-w-full">
              {album.artist}
            </p>
          </div>

          <div className='flex flex-col items-start text-start sm:text-end sm:items-end gap-1'>
            {/* Comment/Notes */}
            {ranking.notes && ranking.notes.trim() && (
              <div className="mt-0 sm:mt-2">
                <p className="text-gray-300 italic text-sm sm:text-base">
                  "{ranking.notes}"
                </p>
              </div>
            )}

            {/* Date */}
            <div className="text-gray-500 flex flex-col gap-2 text-xs mt-0 sm:mt-1 items-end">
              <span className={`${getRankingBackgroundClass(ranking.rankValue)} text-white font-bold text-lg sm:text-xl px-2 sm:px-3 py-1 rounded-lg md:inline-block hidden w-16 sm:w-20 text-center flex-shrink-0`}>
                {ranking.rankValue}/10
              </span>
              {formatDate(ranking.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RankingCard;

