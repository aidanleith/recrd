import { useState, useEffect } from "react";
import { buildPath } from "../components/Path";
import { retrieveToken } from "../tokenStorage";
import { useNavigate, useParams } from "react-router-dom";

interface Following {
  _id: string;
  username: string;
}

export default function FollowingListPage() {
  const { username } = useParams<{ username?: string }>();
  const [following, setFollowing] = useState<Following[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileUsername, setProfileUsername] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      setError("");

      // If username is provided, fetch that user's following
      // Otherwise, fetch current user's following
      if (username) {
        setProfileUsername(username);
        try {
          const response = await fetch(buildPath(`api/users/${encodeURIComponent(username)}/following`), {
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
            setFollowing(data);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load following");
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fetch current user's following
        const token = retrieveToken();
        if (!token) {
          setError("You must be logged in");
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch(buildPath("api/users/profile/following"), {
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
            setFollowing(data);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load following");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFollowing();
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
        {profileUsername ? `${profileUsername} is following` : "Following"}
      </h1>
      {following.length > 0 ? (
        <div className="flex flex-col gap-2 sm:gap-3">
          {following.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              onClick={() => {
                navigate(`/profile/${user.username}`);
              }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-base sm:text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white text-base sm:text-xl font-semibold truncate">{user.username}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          {profileUsername ? `${profileUsername} is not following anyone yet.` : "Not following anyone yet."}
        </p>
      )}
    </div>
  );
}

