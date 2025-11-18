import React from "react";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";

// 1. Define the props this component expects
interface ProfileHeaderProps {
  username: string;
  bio: string;
  avatarUrl: string;
  rankedAlbumsCount: number;
  followerCount: number;
  followingCount: number;
  isCurrentUser: boolean;
  isFollowing?: boolean;
  isFollowingLoading?: boolean;
  onFollowClick?: () => void;
  onUnfollowClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  leaderboardPosition?: number; // Position in top 50 users (1-50)
}

// 2. Use React.FC and destructure the props

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  bio,
  // @ts-ignore: avatarUrl is going to be implemented later
  avatarUrl,
  rankedAlbumsCount,
  followerCount,
  followingCount,
  isCurrentUser,
  isFollowing = false,
  isFollowingLoading = false,
  onFollowClick,
  onUnfollowClick,
  onFollowersClick,
  onFollowingClick,
  leaderboardPosition,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 p-2 sm:p-4">
      <Avatar username={username} size={160} />

      <div className="flex-grow text-center sm:text-left w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{username}</h1>

          {/* 3. Conditionally render a button based on props */}
          {isCurrentUser ? (
            <Button
              aria-label="Edit Profile"
              onClick={() => alert("Opening edit modal...")}
              variant="primary"
              size="sm"
            >
              edit profile
            </Button>
          ) : (
            <Button
              aria-label="Unfollow / Follow"
              onClick={isFollowing ? onUnfollowClick : onFollowClick}
              variant={isFollowing ? "secondary" : "primary"}
              size="sm"
              disabled={isFollowingLoading}
            >
              {isFollowingLoading ? "loading..." : isFollowing ? "unfollow" : "follow"}
            </Button>
          )}
        </div>

        {/* <p className="text-lg text-subtext mt-1">@{username}</p> */}
        <div className="flex flex-wrap gap-4 sm:gap-10 justify-center sm:justify-start mt-2">
          {/* --- FIXED TAILWIND CLASS --- */}
          <div className="flex flex-col">
            <p className="text-base text-subtext">
              <span className="font-bold">{rankedAlbumsCount}</span> ranked albums
            </p>
            {leaderboardPosition !== undefined && leaderboardPosition > 0 && (
              <p className="text-base text-[var(--primary)]">
                <span className="font-bold">#{leaderboardPosition}</span> on recrd
              </p>
            )}
          </div>
          <p 
            className={`text-base text-subtext ${onFollowersClick ? 'cursor-pointer hover:text-(--primary) transition-colors' : ''}`}
            onClick={onFollowersClick}
          >
            <span className="font-bold">{followerCount}</span> followers
          </p>
          <p 
            className={`text-base text-subtext ${onFollowingClick ? 'cursor-pointer hover:text-(--primary) transition-colors' : ''}`}
            onClick={onFollowingClick}
          >
            <span className="font-bold">{followingCount}</span> following
          </p>
        </div>
        {/* --- FIXED TAILWIND CLASS --- */}
        <p className="mt-3 text-base text-subtext">{bio}</p>
      </div>
    </div>
  );
};