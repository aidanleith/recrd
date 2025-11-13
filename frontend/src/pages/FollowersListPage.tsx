import React, { useState, useEffect } from "react";
import { buildPath } from "../components/Path";
import { retrieveToken } from "../tokenStorage";
import { useNavigate, useParams } from "react-router-dom";

interface Follower {
  _id: string;
  username: string;
}

export default function FollowersListPage() {
  const { username } = useParams<{ username?: string }>();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileUsername, setProfileUsername] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      setError("");

      // If username is provided, fetch that user's followers
      // Otherwise, fetch current user's followers
      if (username) {
        setProfileUsername(username);
        try {
          const response = await fetch(buildPath(`api/users/${encodeURIComponent(username)}/followers`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.error) {
            setError(data.error);
          } else {
            setFollowers(data);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load followers");
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fetch current user's followers
        const token = retrieveToken();
        if (!token) {
          setError("You must be logged in");
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch(buildPath("api/users/profile/followers"), {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.error) {
            setError(data.error);
          } else {
            setFollowers(data);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load followers");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFollowers();
  }, [username]);

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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">
        {profileUsername ? `${profileUsername}'s followers` : "Followers"}
      </h1>
      {followers.length > 0 ? (
        <div className="flex flex-col gap-2 sm:gap-3">
          {followers.map((follower) => (
            <div
              key={follower._id}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              onClick={() => {
                navigate(`/profile/${follower.username}`);
              }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-base sm:text-lg">
                  {follower.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white text-base sm:text-xl font-semibold truncate">{follower.username}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          {profileUsername ? `${profileUsername} has no followers yet.` : "No followers yet."}
        </p>
      )}
    </div>
  );
}

