import React from 'react';

interface AlbumDisplayProps {
  album: {
    _id: string;
    title: string;
    artist: string;
    coverArtUrl?: string;
    releaseDate?: string;
    genre?: string;
    averageRanking?: number;
  };
  onClick?: () => void;
}

function AlbumDisplay({ album, onClick }: AlbumDisplayProps) {
  const getRankingBackgroundClass = (ranking: number): string => {
    if (ranking >= 8) return 'bg-green-500';  // Great (8-10)
    if (ranking >= 5) return 'bg-yellow-500'; // Average (5-7)
    return 'bg-red-500';                      // Poor (1-4)
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer group"
    >
      {/* Album Cover - Left Side */}
      <div className="flex-shrink-0">
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

      {/* Album Info - Middle */}
      <div className="flex flex-col items-start text-start min-w-0 flex-1">
        <h3 className="text-white font-bold text-base sm:text-xl truncate w-full group-hover:text-(--primary) transition-colors">
          {album.title}
        </h3>
        <p className="text-gray-400 text-sm sm:text-xl truncate mt-1 w-full">
          {album.artist}
        </p>
      </div>

      {/* Average Ranking - Far Right */}
      <div className="flex-shrink-0 text-right min-w-[50px] sm:min-w-[60px]">
        {album.averageRanking !== undefined && album.averageRanking > 0 ? (
          <>
            <div className={`${getRankingBackgroundClass(album.averageRanking)} text-white font-bold text-base sm:text-xl px-2 sm:px-3 py-1 rounded-lg inline-block`}>
              {album.averageRanking.toFixed(1)}
            </div>
            <div className="text-gray-400 text-xs mt-1 hidden sm:block">
              global ranking
            </div>
          </>
        ) : (
          <>
            <div className="text-gray-500 font-bold text-base sm:text-xl">
              —
            </div>
            <div className="text-gray-500 text-xs hidden sm:block">
              no rankings
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AlbumDisplay;

