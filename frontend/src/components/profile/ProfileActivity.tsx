import React from "react";
import RankingCard from "../RankingCard";
import { useNavigate } from "react-router-dom";

interface Album {
  _id?: string;
  title: string;
  artist: string;
  coverUrl?: string;
  coverArtUrl?: string;
}

export interface ActivityItem {
  id: number;
  album: Album;
  ranking: number;
  comment: string;
  favoriteTrack?: string;
  createdAt?: string | Date;
}

export interface ProfileActivityProps {
  activity: ActivityItem[];
  avatarUrl: string;
  isCurrentUser: boolean;
  username: string;
}

export const ProfileActivity = ({ activity, avatarUrl, isCurrentUser, username }: ProfileActivityProps) => {
  const navigate = useNavigate();

  return (
    <section className="w-full text-left max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mt-6 mb-3 text-white">activity</h2>

      {activity.length === 0 ? (
        <div className="text-center p-10 bg-[#1e1e1e] rounded-lg">
          <p className="text-gray-500">No activity to show yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activity.map((item) => (
            <RankingCard
              key={item.id}
              ranking={{
                username: isCurrentUser ? "you" : username,
                rankValue: item.ranking,
                notes: item.comment,
                createdAt: item.createdAt || new Date(),
              }}
              album={{
                _id: item.album._id,
                title: item.album.title,
                artist: item.album.artist,
                coverArtUrl: item.album.coverArtUrl || item.album.coverUrl,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProfileActivity;
