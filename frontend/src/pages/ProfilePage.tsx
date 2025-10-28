// "use client"; // <-- Removed this
import React from "react";
// import Image from "next/image"; // <-- Removed this
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileActivity } from "../components/profile/ProfileActivity";
import { Button } from "../components/ui/Button";

// --- MOCK DATA ---
// (Mock data remains the same)
const userProfileData = {
  username: "andy",
  bio: "I like music!!!!!!!!!!!!!!",
  avatarUrl: "https://i.pravatar.cc/150?img=5", // A placeholder image
  isCurrentUser: true, // This is true, so it will show "Edit Profile"
  stats: {
    rankedAlbums: 42,
    followers: 1840,
    following: 215,
  },
  albums: [
    {
      id: 1,
      title: "good kid maad city",
      artist: "Kendrick Lamar",
      coverUrl: "https://i.pravatar.cc/300?img=10",
    },
    {
      id: 2,
      title: "Mr. Morale and the Big Steppers",
      artist: "Kendrick Lamar",
      coverUrl: "https://i.pravatar.cc/300?img=11",
    },
    {
      id: 3,
      title: "Take Care",
      artist: "Drake",
      coverUrl: "https://i.pravatar.cc/300?img=12",
    },
  ],
  activity: [
    {
      id: 1,
      album: {
        title: "Take Care",
        artist: "Drake",
        coverUrl: "https://i.pravatar.cc/300?img=12",
      },
      ranking: 9,
      comment: "its a classic, one of my favorites",
      favoriteTrack: "Lord Knows (ft. Rick Ross)",
    },
    {
      id: 2,
      album: {
        title: "MUSIC",
        artist: "Playboi Carti",
        coverUrl: "https://i.pravatar.cc/300?img=13",
      },
      ranking: 3,
      comment: "really bad and im Very mad i waited 5 years for this..",
      favoriteTrack: "EVIL J0RDAN",
    },
    {
      id: 3,
      album: {
        title: "Chemistry",
        artist: "Chris Lake",
        coverUrl: "https://i.pravatar.cc/300?img=14",
      },
      ranking: 10,
      comment: "SUCH A GOOD HOUSE ALBUM!!!",
      favoriteTrack: "On & On",
    },
    {
      id: 4,
      album: {
        title: "Hurry Up Tomorrow",
        artist: "The Weeknd",
        coverUrl: "https://i.pravatar.cc/300?img=15",
      },
      ranking: 7,
      comment: "he never misses",
      favoriteTrack: "Timeless (ft. Playboi Carti)",
    },
  ],
};
// --- END MOCK DATA ---

export default function ProfilePage() {
  // Destructure the data to pass it down
  const { username, bio, avatarUrl, isCurrentUser, stats, albums, activity } =
    userProfileData;

  return (
    <div className="mx-auto">
      {/* 1. Pass data to the ProfileHeader component */}
      <ProfileHeader
        username={username}
        bio={bio}
        avatarUrl={avatarUrl}
        isCurrentUser={isCurrentUser}
        rankedAlbumsCount={stats.rankedAlbums}
        followerCount={stats.followers}
        followingCount={stats.following}
      />

      {/* 2. Pass data to the ProfileStats component */}
      {/* <div className="mt-8">
        <ProfileStats
          postsCount={stats.rankedAlbums}
          followersCount={stats.followers}
          followingCount={stats.following}
        />
      </div> */}

      {/* 3. The rest of the page content, like a post grid */}
      <div className="">
        <div className="flex items-center gap-10 mt-6 mb-4">
          <h2 className="text-2xl font-bold">favorite albums</h2>
          <Button
            onClick={() => alert("Opening edit modal...")}
            variant="primary"
            size="sm"
          >
            view all rankings
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Map over the albums array */}
          {albums.map((album) => (
            <div
              key={album.id}
              className="relative aspect-square rounded-lg shadow-md overflow-hidden"
            >
              {/* --- CONVERTED <Image> TO <img> --- */}
              <img
                src={album.coverUrl}
                alt={album.title}
                // Added w-full and h-full to replicate 'fill'
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>

      <ProfileActivity
        activity={activity}
        isCurrentUser={isCurrentUser}
        avatarUrl={avatarUrl}
        username={username}
      />
    </div>
  );
}