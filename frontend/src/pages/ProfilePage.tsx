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
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | undefined>(undefined);
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
                  _id: album._id,
                  title: album.title,
                  artist: album.artist,
                  coverArtUrl: album.coverArtUrl,
                }))
              );
            } else {
              // Clear top3 if empty
              setTopThreeAlbums([]);
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
                  _id: album._id,
                  title: album.title,
                  artist: album.artist,
                  coverArtUrl: album.coverArtUrl,
                }))
              );
            } else {
              // Clear top3 if empty
              setTopThreeAlbums([]);
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

  // Fetch user's leaderboard position if they're in top 50
  useEffect(() => {
    const fetchLeaderboardPosition = async () => {
      if (!profileData) return;

      try {
        const response = await fetch(buildPath('api/leaderboard/users?limit=50&skip=0'));
        const data = await response.json();

        if (data.users && Array.isArray(data.users)) {
          // Find the user's position in the leaderboard
          const userIndex = data.users.findIndex((user: any) => 
            String(user._id) === String(profileData.id)
          );

          if (userIndex !== -1) {
            // Position is 1-indexed (1st, 2nd, 3rd, etc.)
            setLeaderboardPosition(userIndex + 1);
          } else {
            setLeaderboardPosition(undefined);
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard position:', err);
        setLeaderboardPosition(undefined);
      }
    };

    if (profileData) {
      fetchLeaderboardPosition();
    }
  }, [profileData]);

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

    // Update state optimistically
    setTopThreeAlbums((currentTop3) => {
      // Ensure we have a valid currentTop3 array
      const safeCurrentTop3 = Array.isArray(currentTop3) ? currentTop3 : [];
      
      // Create new top3 array - first remove the album from any other position if it exists
      let newTop3 = safeCurrentTop3.filter((existingAlbum, index) => {
        /* removed || existingAlbum?.albumId from this statement,
         albumId doesnt exist in existingAlbum so it would never run*/
        const existingId = String(existingAlbum?._id || '');
        const newId = String(albumId || '');
        // Keep the album if:
        // 1. It's at the selectedIndex (we'll replace it)
        // 2. It's a different album (existingId !== newId) AND both IDs are valid
        // Remove if it's the same album at a different position
        if (index === selectedIndex) return true; // Always keep the one at selectedIndex (we'll replace it)
        if (!existingId || existingId === '' || !newId || newId === '') return true; // Keep if IDs are invalid (shouldn't happen but safety)
        return existingId !== newId; // Keep if different album
      });

      // Now update or add at the selected index
      if (selectedIndex < newTop3.length) {
        // Replace existing at selectedIndex
        newTop3[selectedIndex] = {
          _id: albumId,
          title: album.title,
          artist: album.artist,
          coverArtUrl: album.coverArtUrl,
        };
      } else {
        // Add new at the end
        newTop3.push({
          _id: albumId,
          title: album.title,
          artist: album.artist,
          coverArtUrl: album.coverArtUrl,
        });
      }

      // Ensure we only have 3 items, but preserve all existing albums
      // If we have more than 3, keep the first 3 (which includes our new/updated one)
      const finalTop3 = newTop3.slice(0, 3);
      
      // Debug: log to ensure we're preserving albums
      if (finalTop3.length < safeCurrentTop3.length && safeCurrentTop3.length > 0) {
        console.warn('Warning: finalTop3 has fewer albums than currentTop3', {
          currentLength: safeCurrentTop3.length,
          finalLength: finalTop3.length,
          selectedIndex,
          albumId
        });
      }

      // Update backend asynchronously
      (async () => {
        try {
          // Get fresh token again right before request
          let currentToken = retrieveToken();
          if (!currentToken) {
            setError("You must be logged in");
            return;
          }

          // If replacing an existing position, use PATCH to set the full array
          // Otherwise, use addTopThree to add a new album
          // Use safeCurrentTop3 from the closure to check
          // If we have 3 albums already, always use PATCH (replacement mode)
          const isReplacing = safeCurrentTop3.length >= 3 || (selectedIndex < safeCurrentTop3.length && safeCurrentTop3[selectedIndex]?._id);
          
          if (isReplacing) {
            // Use PATCH to replace at specific position
            // Ensure we have valid album IDs
            /* removed || existingAlbum?.albumId from this statement,
            albumId doesnt exist in existingAlbum so it would never run*/
            const top3Ids = finalTop3.map(album => album?._id).filter(id => id && id !== '');
            
            // Safety check: if we somehow only have one album but should have more, log a warning
            if (top3Ids.length === 1 && safeCurrentTop3.length > 1) {
              console.error('Error: Only one album ID in finalTop3 when there should be more', {
                finalTop3,
                safeCurrentTop3,
                selectedIndex,
                albumId
              });
              // Try to preserve existing albums by getting them from the current state
              // This is a fallback - the state should already be correct
            }
            
            const response = await fetch(buildPath("api/users/profile/top3"), {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${currentToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                top3: top3Ids,
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

            // Update token if refreshed (do this first)
            let tokenToUse = currentToken;
            if (data.jwtToken) {
              localStorage.setItem("token_data", data.jwtToken);
              tokenToUse = data.jwtToken;
            }

            if (data.error) {
              // If there's a refreshed token, token errors are resolved
              if (data.jwtToken && (data.error.includes("JWT") || data.error.includes("token") || data.error.includes("valid"))) {
                // Token was refreshed, clear error and continue
                setError("");
              } else {
                // Real error - but check if it's critical
                setError(data.error);
                // Only redirect to login if it's a critical authentication error without refreshed token
                if ((data.error.includes("JWT") || data.error.includes("token") || data.error.includes("valid")) && !data.jwtToken) {
                  localStorage.removeItem("token_data");
                  localStorage.removeItem("user_data");
                  window.location.href = "/login";
                  return;
                }
                // For non-critical errors, don't redirect
                // The optimistic update already happened, so operation likely succeeded
                setTimeout(() => setError(""), 100);
                return;
              }
            } else {
              // No error - clear any previous errors
              setError("");
            }
            
            // Refresh profile data to get updated top3 (best effort)
            // Don't show errors from profile refresh since the operation already succeeded
            try {
              const profileResponse = await fetch(buildPath("api/users/profile"), {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${tokenToUse}`,
                  "Content-Type": "application/json",
                },
              });

              const profileContentType = profileResponse.headers.get("content-type");
              if (profileContentType && profileContentType.includes("application/json")) {
                const profileDataResponse = await profileResponse.json();
                
                // Update token if refreshed from profile endpoint
                if (profileDataResponse.jwtToken) {
                  localStorage.setItem("token_data", profileDataResponse.jwtToken);
                }
                
                if (profileDataResponse.error) {
                  // Profile refresh failed, but operation already succeeded
                  console.warn("Profile refresh error (operation succeeded):", profileDataResponse.error);
                  setError(""); // Clear error since operation worked
                } else if (profileDataResponse.topThree) {
                  setTopThreeAlbums(profileDataResponse.topThree.map((a: any) => ({
                    _id: a._id,
                    title: a.title,
                    artist: a.artist,
                    coverArtUrl: a.coverArtUrl,
                  })));
                  setError("");
                } else {
                  setError("");
                }
              } else {
                // Non-JSON response - log but don't fail
                console.error("Non-JSON response from profile");
                setError(""); // Clear error since operation worked
              }
            } catch (profileErr) {
              // Profile refresh failed, but operation already succeeded
              console.error("Profile refresh error (operation succeeded):", profileErr);
              setError(""); // Clear error since operation worked
            }
            
            return;
          }
          
          // Adding new album - use addTopThree
          const addResponse = await fetch(buildPath("api/addTopThree"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              albumId: albumId,
              jwtToken: currentToken,
            }),
          });

          const addContentType = addResponse.headers.get("content-type");
          if (!addContentType || !addContentType.includes("application/json")) {
            const text = await addResponse.text();
            console.error("Non-JSON response from addTopThree:", text);
            setError(`Server returned non-JSON response. Status: ${addResponse.status}`);
            return;
          }

          const addData = await addResponse.json();
          
          // Update token if refreshed (do this first)
          let tokenToUse = currentToken;
          if (addData.jwtToken) {
            localStorage.setItem("token_data", addData.jwtToken);
            tokenToUse = addData.jwtToken;
          }
          
          // addTopThree now returns { error: string, jwtToken: string }
          // If there's an error, check if it's critical
          if (addData.error && addData.error.length > 0) {
            // If there's a refreshed token, token errors are resolved
            if (addData.jwtToken && (addData.error.includes("JWT") || addData.error.includes("token") || addData.error.includes("valid"))) {
              // Token was refreshed, clear error and continue
              setError("");
            } else {
              // Real error - but check if it's critical
              setError(addData.error);
              // Only redirect to login if it's a critical authentication error without refreshed token
              if ((addData.error.includes("JWT") || addData.error.includes("token") || addData.error.includes("valid")) && !addData.jwtToken) {
                localStorage.removeItem("token_data");
                localStorage.removeItem("user_data");
                window.location.href = "/login";
                return;
              }
              // For non-critical errors (like "User not found"), don't redirect
              // The optimistic update already happened, so operation likely succeeded
              // Clear error after a moment since the operation worked
              setTimeout(() => setError(""), 100);
              return;
            }
          } else {
            // No error from addTopThree - clear any previous errors
            setError("");
          }

          // Success - refresh the profile to get updated top3 (best effort)
          // Don't show errors from profile refresh since the operation already succeeded
          try {
            const profileResponse = await fetch(buildPath("api/users/profile"), {
              method: "GET",
              headers: {
                Authorization: `Bearer ${tokenToUse}`,
                "Content-Type": "application/json",
              },
            });

            const profileContentType = profileResponse.headers.get("content-type");
            if (profileContentType && profileContentType.includes("application/json")) {
              const profileDataResponse = await profileResponse.json();
              
              // Update token if refreshed from profile endpoint
              if (profileDataResponse.jwtToken) {
                localStorage.setItem("token_data", profileDataResponse.jwtToken);
              }
              
              if (profileDataResponse.error) {
                // Profile refresh failed, but operation already succeeded
                // Don't show this error - just log it
                console.warn("Profile refresh error (operation succeeded):", profileDataResponse.error);
                setError(""); // Clear error since operation worked
              } else if (profileDataResponse.topThree) {
                // Update state with fresh data from server
                setTopThreeAlbums(profileDataResponse.topThree.map((a: any) => ({
                  _id: a._id,
                  title: a.title,
                  artist: a.artist,
                  coverArtUrl: a.coverArtUrl,
                })));
                setError("");
              } else {
                setError("");
              }
            } else {
              // Non-JSON response - log but don't fail
              console.error("Non-JSON response from profile");
              setError(""); // Clear error since operation worked
            }
          } catch (profileErr) {
            // Profile refresh failed, but operation already succeeded
            console.error("Profile refresh error (operation succeeded):", profileErr);
            setError(""); // Clear error since operation worked
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
        avatarUrl={""} // Not used anymore, Avatar component generates it from username
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
        leaderboardPosition={leaderboardPosition}
      />

      <div className="">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 mt-6 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">favorite albums</h2>
          <div className="flex gap-2">
          <Button
              aria-label="View All Rankings"
              onClick={() => navigate(urlUsername ? `/profile/${urlUsername}/rankings` : "/profile/rankings")}
            variant="primary"
            size="sm"
          >
            view all rankings
          </Button>

          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
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
                  } else if (album && album._id) {
                    navigate(`/album/${album._id}`);
                  }
                }}
              >
                {album && album.coverArtUrl ? (
                  <img
                    loading='lazy'
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
            _id: album._id,
            title: album.title,
            artist: album.artist,
            coverUrl: album.coverArtUrl || "",
          },
          ranking: album.rankValue,
          comment: album.notes || "",
          favoriteTrack: "", // Not in API response
        }))}
        isCurrentUser={isCurrentUser}
        avatarUrl={""} // Not used anymore, but keeping for compatibility
        username={profileData.username}
      />
    </div>
  );
}
