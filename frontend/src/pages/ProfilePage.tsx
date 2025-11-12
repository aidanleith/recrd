import { useState, useEffect } from "react";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileActivity } from "../components/profile/ProfileActivity";
import { Top3Modal } from "../components/profile/Top3Modal";
import { Button } from "../components/ui/Button";
import { buildPath } from "../components/Path";
import { retrieveToken } from "../tokenStorage";
import { useNavigate, useParams } from "react-router-dom";

interface ProfileData {
  id: string;
  username: string;
  email: string;
  toListen: any[];
  topThree: any[];
  followerCount: number;
  followingCount: number;
  albums: Array<{
    _id?: string;
    title: string;
    artist: string;
    coverArtUrl?: string;
    rankValue: number;
    notes?: string;
    createdAt: string | Date;
  }>;
  numRankings: number;
}

export default function ProfilePage() {
  const { username: urlUsername } = useParams<{ username?: string }>();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [topThreeAlbums, setTopThreeAlbums] = useState<Array<{ _id?: string; title: string; artist: string; coverArtUrl?: string }>>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const checkFollowingStatus = async (profileUserId: string) => {
    const token = retrieveToken();
    if (!token) return;

    try {
      const response = await fetch(buildPath("api/users/profile/following"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const following = await response.json();
        const isFollowingUser = following.some((user: any) => String(user._id) === String(profileUserId));
        setIsFollowing(isFollowingUser);
      }
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError("");

      // If username is provided in URL and not empty, fetch that user's profile
      // Otherwise, fetch current user's profile
      // Check if urlUsername exists and is not one of the reserved paths
      const reservedPaths = ['followers', 'following', 'rankings'];
      const isReservedPath = urlUsername && reservedPaths.includes(urlUsername);
      const isCurrentUserProfile = !urlUsername || urlUsername.trim() === '' || isReservedPath;
      
      console.log('ProfilePage - urlUsername:', urlUsername, 'isCurrentUserProfile:', isCurrentUserProfile, 'isReservedPath:', isReservedPath);
      
      if (isCurrentUserProfile) {
        const token = retrieveToken();
        if (!token) {
          setError("You must be logged in to view your profile");
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch(buildPath("api/users/profile"), {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Profile API response:', data);

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.error) {
            setError(data.error);
          } else {
            setProfileData(data);

            // topThree now contains album details from the API
            if (data.topThree && data.topThree.length > 0) {
              setTopThreeAlbums(
                data.topThree.map((album: any) => ({
                  title: album.title,
                  artist: album.artist,
                  coverArtUrl: album.coverArtUrl,
                }))
              );
            }
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load profile");
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fetch other user's profile by username
        if (!urlUsername || urlUsername.trim() === '') {
          setError("Invalid username");
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await fetch(buildPath(`api/users/${encodeURIComponent(urlUsername)}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.error) {
            setError(data.error);
          } else {
            setProfileData(data);

            // topThree now contains album details from the API
            if (data.topThree && data.topThree.length > 0) {
              setTopThreeAlbums(
                data.topThree.map((album: any) => ({
                  title: album.title,
                  artist: album.artist,
                  coverArtUrl: album.coverArtUrl,
                }))
              );
            }

            // Check if current user is following this profile
            if (!isCurrentUserProfile) {
              checkFollowingStatus(data.id);
            }
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load profile");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [urlUsername]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-white">Loading...</p>
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

  if (!profileData) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-white">Profile not found</p>
      </div>
    );
  }

  // Get current user ID to determine if this is the current user's profile
  // Compare the profile's ID with the current user's ID, regardless of URL
  const userData = localStorage.getItem("user_data");
  const currentUserId = userData ? JSON.parse(userData).id : null;
  // Convert both IDs to strings for comparison (MongoDB ObjectIds)
  const isCurrentUser = currentUserId && profileData.id && String(currentUserId) === String(profileData.id);

  const handleFollow = async () => {
    const token = retrieveToken();
    if (!token) {
      setError("You must be logged in to follow users");
      return;
    }

    setIsFollowingLoading(true);
    try {
      const response = await fetch(buildPath("api/followUser"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profileData.id,
          jwtToken: token,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setIsFollowing(true);
        setProfileData((prev) => prev ? { ...prev, followerCount: prev.followerCount + 1 } : null);
        // Update token if refreshed
        if (data.jwtToken) {
          localStorage.setItem("token_data", data.jwtToken);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to follow user");
      }
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleUnfollow = async () => {
    const token = retrieveToken();
    if (!token) {
      setError("You must be logged in to unfollow users");
      return;
    }

    setIsFollowingLoading(true);
    try {
      const response = await fetch(buildPath("api/unfollowUser"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profileData.id,
          jwtToken: token,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setIsFollowing(false);
        setProfileData((prev) => prev ? { ...prev, followerCount: Math.max(0, prev.followerCount - 1) } : null);
        // Update token if refreshed
        if (data.jwtToken) {
          localStorage.setItem("token_data", data.jwtToken);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to unfollow user");
      }
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleSquareClick = (index: number) => {
    if (!isCurrentUser) return; // Only allow editing own profile
    setSelectedIndex(index);
    setModalOpen(true);
  };

  const handleAlbumSelect = async (album: any) => {
    if (selectedIndex === null || !isCurrentUser || !profileData) return;

    // Always get fresh token before making request
    let token = retrieveToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }

    // Get album ID from the album object (should be included from API)
    let albumId = album._id || album.albumId;
    
    if (!albumId) {
      // Fallback: find it from the user's rankings
      const albumData = profileData.albums.find(
        (a: any) => a.title === album.title && a.artist === album.artist
      );
      albumId = albumData?._id;
    }
    
    if (!albumId) {
      // Last resort: try to find album by title/artist
      try {
        const response = await fetch(buildPath(`api/albums/${encodeURIComponent(album.title)}`));
        const data = await response.json();
        if (data.id) {
          albumId = data.id;
        }
      } catch (err) {
        setError("Could not find album ID");
        return;
      }
    }

    // Use functional update to ensure we have the latest state
    setTopThreeAlbums((currentTop3) => {
      // Create new top3 array - first remove the album from any other position if it exists
      let newTop3 = currentTop3.filter((existingAlbum, index) => {
        const existingId = String(existingAlbum._id || '');
        const newId = String(albumId || '');
        // Remove if it's the same album at a different position
        return existingId !== newId || index === selectedIndex;
      });

      // Now update or add at the selected index
      if (selectedIndex < newTop3.length) {
        // Replace existing
        newTop3[selectedIndex] = {
          _id: albumId,
          title: album.title,
          artist: album.artist,
          coverArtUrl: album.coverArtUrl,
        };
      } else {
        // Add new
        newTop3.push({
          _id: albumId,
          title: album.title,
          artist: album.artist,
          coverArtUrl: album.coverArtUrl,
        });
      }

      // Ensure we only have 3 items
      const finalTop3 = newTop3.slice(0, 3);

      // Update backend asynchronously
      (async () => {
        // Get fresh token again right before request
        let currentToken = retrieveToken();
        if (!currentToken) {
          setError("You must be logged in");
          return;
        }

        try {
          const response = await fetch(buildPath("api/users/profile/top3"), {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${currentToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              top3: finalTop3.map(album => album._id).filter(id => id),
            }),
          });

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            setError(`Server returned non-JSON response. Status: ${response.status}`);
            return;
          }

          const data = await response.json();

          if (data.error) {
            setError(data.error);
            // If JWT expired, try to refresh or redirect to login
            if (data.error.includes("JWT") || data.error.includes("token") || data.error.includes("valid")) {
              // Don't redirect immediately - try to refresh token first
              if (data.jwtToken) {
                localStorage.setItem("token_data", data.jwtToken);
                // Retry the request with new token
                const retryResponse = await fetch(buildPath("api/users/profile/top3"), {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${data.jwtToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    top3: finalTop3.map(album => album._id).filter(id => id),
                  }),
                });
                const retryData = await retryResponse.json();
                if (retryData.error) {
                  localStorage.removeItem("token_data");
                  localStorage.removeItem("user_data");
                  window.location.href = "/login";
                } else {
                  // Update token if refreshed
                  if (retryData.jwtToken) {
                    localStorage.setItem("token_data", retryData.jwtToken);
                  }
                  setError("");
                }
              } else {
                localStorage.removeItem("token_data");
                localStorage.removeItem("user_data");
                window.location.href = "/login";
              }
            }
          } else {
            // Update token if refreshed
            if (data.jwtToken) {
              localStorage.setItem("token_data", data.jwtToken);
            }
            setError(""); // Clear any previous errors
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to update favorite albums");
          }
        }
      })();

      return finalTop3;
    });
  };

  // Get recent reviews (last 5, sorted by createdAt descending)
  const recentReviews = [...profileData.albums]
    .sort((a, b) => {
      const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="mx-auto">
      <ProfileHeader
        username={profileData.username}
        bio={""} // API doesn't return bio yet
        avatarUrl={"https://i.pravatar.cc/150?img=5"} // Placeholder
        isCurrentUser={isCurrentUser}
        rankedAlbumsCount={profileData.numRankings}
        followerCount={profileData.followerCount}
        followingCount={profileData.followingCount}
        isFollowing={isFollowing}
        isFollowingLoading={isFollowingLoading}
        onFollowClick={handleFollow}
        onUnfollowClick={handleUnfollow}
        onFollowersClick={() => navigate(urlUsername ? `/profile/${urlUsername}/followers` : "/profile/followers")}
        onFollowingClick={() => navigate(urlUsername ? `/profile/${urlUsername}/following` : "/profile/following")}
      />

      <div className="">
        <div className="flex items-center gap-10 mt-6 mb-4">
          <h2 className="text-2xl font-bold text-white">favorite albums</h2>
          <Button
            onClick={() => navigate(urlUsername ? `/profile/${urlUsername}/rankings` : "/profile/rankings")}
            variant="primary"
            size="sm"
          >
            view all rankings
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full">
          {Array.from({ length: 3 }).map((_, index) => {
            const album = topThreeAlbums[index];
            const isEmpty = !album;
            
            return (
              <div
                key={index}
                className={`relative aspect-square rounded-lg shadow-md overflow-hidden ${
                  isCurrentUser ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-pointer"
                } ${isEmpty ? "bg-[#2a2a2a] border-2 border-dashed border-gray-600" : ""}`}
                onClick={() => {
                  if (isCurrentUser) {
                    handleSquareClick(index);
                  } else if (album) {
                    const urlTitle = album.title.replace(/\s+/g, "-").toLowerCase();
                    navigate(`/album/${urlTitle}`);
                  }
                }}
              >
                {album && album.coverArtUrl ? (
                  <img
                    src={album.coverArtUrl}
                alt={album.title}
                className="object-cover w-full h-full"
              />
                ) : album ? (
                  <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                    <span className="text-gray-500 text-xs text-center px-2">{album.title}</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">+</span>
                  </div>
                )}
            </div>
            );
          })}
        </div>
      </div>

      {isCurrentUser && (
        <Top3Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedIndex(null);
          }}
          onSelect={handleAlbumSelect}
          currentTop3={topThreeAlbums}
          selectedIndex={selectedIndex}
          userRankings={profileData.albums.map((album: any) => ({
            _id: album._id,
            title: album.title,
            artist: album.artist,
            coverArtUrl: album.coverArtUrl,
          }))}
        />
      )}

      <ProfileActivity
        activity={recentReviews.map((album, index) => ({
          id: index,
          album: {
            title: album.title,
            artist: album.artist,
            coverUrl: album.coverArtUrl || "",
          },
          ranking: album.rankValue,
          comment: album.notes || "",
          favoriteTrack: "", // Not in API response
        }))}
        isCurrentUser={isCurrentUser}
        avatarUrl={"https://i.pravatar.cc/150?img=5"}
        username={profileData.username}
      />
    </div>
  );
}
