import React, { useState, useEffect } from "react";

interface Album {
  title: string;
  artist: string;
  coverArtUrl?: string;
  _id?: string;
  albumId?: string;
}

interface Top3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (album: Album) => void;
  currentTop3: Album[];
  userRankings: Album[];
  selectedIndex: number | null;
}

export const Top3Modal: React.FC<Top3ModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentTop3,
  userRankings,
  selectedIndex,
}) => {
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Get the album ID at the selected index (if any) - this one should be allowed
      const selectedAlbumId = selectedIndex !== null && currentTop3[selectedIndex] 
        ? String(currentTop3[selectedIndex]._id || currentTop3[selectedIndex].albumId || '')
        : null;
      
      // Filter out albums that are already in top3, but allow the album at selectedIndex
      // Only include albums that have valid IDs
      const currentTop3Ids = currentTop3
        .map((album, index) => {
          // Exclude the album at selectedIndex from the filter
          if (index === selectedIndex) return null;
          const id = album?._id || album?.albumId;
          return id ? String(id) : null;
        })
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => String(id));
      
      const available = userRankings.filter(album => {
        const albumId = String(album._id || album.albumId || '');
        // Only include albums with valid IDs
        if (!albumId || albumId === '') return false;
        // Allow if it's not in the filtered list, or if it's the album at the selected index
        return !currentTop3Ids.includes(albumId) || albumId === selectedAlbumId;
      });
      
      setFilteredAlbums(available);
    }
  }, [isOpen, currentTop3, userRankings, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Select an Album</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredAlbums.map((album, index) => {
              const albumId = album._id || album.albumId;
              return (
                <div
                  key={albumId || index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  onClick={() => {
                    onSelect(album);
                    onClose();
                  }}
                >
                  {album.coverArtUrl ? (
                    <img
                      src={album.coverArtUrl}
                      alt={`${album.title} cover`}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-[#2a2a2a] flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Cover</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{album.title}</h3>
                    <p className="text-gray-400 text-sm">{album.artist}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No available albums. All your ranked albums are already in your top 3.
          </p>
        )}
      </div>
    </div>
  );
};

