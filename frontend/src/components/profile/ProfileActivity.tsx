import React from "react";

interface Album {
  title: string;
  artist: string;
  coverUrl: string;
}

export interface ActivityItem {
  id: number;
  album: Album;
  ranking: number;
  comment: string;
  favoriteTrack: string;
}

export interface ProfileActivityProps {
  activity: ActivityItem[];
  avatarUrl: string;
  isCurrentUser: boolean;
  username: string;
}

// (Helper function is standard and remains the same)
const getRankingColorClass = (ranking: number): string => {
  if (ranking >= 8) return 'text-green-500';  // Great (8-10)
  if (ranking >= 5) return 'text-yellow-500'; // Average (5-7)
  return 'text-red-500';                      // Poor (1-4)
};

// --- 2. Child Component (Single Activity Card) ---

interface ActivityCardProps {
  item: ActivityItem;
  avatarUrl: string;
  isCurrentUser: boolean;
  username: string;
}

const ActivityCard = ({
  item,
  isCurrentUser,
  avatarUrl,
  username,
}: ActivityCardProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex gap-4">
        {/* --- CONVERTED <Image> TO <img> --- */}
        <img
          src={avatarUrl}
          alt={`profile picture`}
          width={30}
          height={30}
          className="rounded-full shadow-lg"
          // priority prop removed
        />
        {isCurrentUser ? (
            <h1>you ranked an album</h1>
        ) : (
            <h1>{username} ranked an album</h1>
        )}
      </div>
      <li className="flex pl-12 pt-2 rounded-lg gap-4">
        {/* This <img> tag was already standard and correct */}
        <img
          src={item.album.coverUrl}
          alt={`${item.album.title} cover`}
          className="w-28 h-28 rounded-md object-cover flex-shrink-0"
        />

        {/* Activity Details */}
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-semibold text-white">
              {item.album.title}
            </h3>
            {/* --- FIXED TAILWIND CLASS --- */}
            <span className="text-sm text-subtext">
              {item.album.artist}
            </span>
          </div>

          <p className={`text-2xl font-bold my-1 ${getRankingColorClass(item.ranking)}`}>
            {item.ranking}/10
          </p>

          {/* --- FIXED TAILWIND CLASS --- */}
          <blockquote className="italic text-subtext">
            "{item.comment}"
          </blockquote>

          {/* --- FIXED TAILWIND CLASS --- */}
          <p className="mt-2 text-sm text-subtext">
            <span className="font-medium">Favorite Track:</span>{" "}
            {item.favoriteTrack}
          </p>
        </div>
      </li>
    </div>
  );
};

// --- 3. Main Component (The List) ---

export const ProfileActivity = ({ activity, avatarUrl, isCurrentUser, username }: ProfileActivityProps) => {
  return (
    <section className="w-full text-left max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mt-6 mb-3 text-white">activity</h2>

      {activity.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No activity to show yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {activity.map((item) => (
            <ActivityCard
              key={item.id}
              item={item}
              avatarUrl={avatarUrl}
              isCurrentUser={isCurrentUser}
              username={username}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default ProfileActivity;