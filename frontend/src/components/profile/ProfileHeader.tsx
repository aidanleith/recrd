import React from "react";
import { Button } from "../../components/ui/Button";

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
}

// 2. Use React.FC and destructure the props
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  bio,
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
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 p-4">
      {/* --- CONVERTED <Image> TO <img> --- */}
      <img
        src={avatarUrl}
        alt={`${username}'s profile picture`}
        width={160}
        height={160}
        className="rounded-full shadow-lg"
        // priority prop removed
      />

      <div className="flex-grow text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-white">{username}</h1>

          {/* 3. Conditionally render a button based on props */}
          {isCurrentUser ? (
            <Button
              onClick={() => alert("Opening edit modal...")}
              variant="primary"
              size="sm"
            >
              edit profile
            </Button>
          ) : (
            <Button
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
        <div className="flex gap-10">
          {/* --- FIXED TAILWIND CLASS --- */}
          <p className="text-base text-subtext">
            <span className="font-bold">{rankedAlbumsCount}</span> ranked albums
          </p>
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