import React, { useState, useEffect } from "react";
import { buildPath } from "../components/Path";
import { retrieveToken } from "../tokenStorage";
import { useNavigate, useParams } from "react-router-dom";
import RankingCard from "../components/RankingCard";

interface Ranking {
  title: string;
  artist: string;
  coverArtUrl?: string;
  rankValue: number;
  notes?: string;
  createdAt: string | Date;
}

export default function UserRankingsPage() {
  const { username } = useParams<{ username?: string }>();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileUsername, setProfileUsername] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      setError("");

      // If username is provided, fetch that user's rankings
      // Otherwise, fetch current user's rankings
      if (username) {
        setProfileUsername(username);
        try {
          const response = await fetch(buildPath(`api/users/${encodeURIComponent(username)}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.error) {
            setError(data.error);
          } else {
            // Sort rankings from highest (10) to lowest (1)
            const sortedRankings = [...data.albums].sort((a: Ranking, b: Ranking) => {
              return b.rankValue - a.rankValue;
            });
            setRankings(sortedRankings);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load rankings");
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fetch current user's rankings
        const token = retrieveToken();
        if (!token) {
          setError("You must be logged in");
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
            throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.error) {
            setError(data.error);
          } else {
            // Sort rankings from highest (10) to lowest (1)
            const sortedRankings = [...data.albums].sort((a: Ranking, b: Ranking) => {
              return b.rankValue - a.rankValue;
            });
            setRankings(sortedRankings);
          }
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load rankings");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchRankings();
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

  // Get current user's username to determine if viewing own profile
  const userData = localStorage.getItem("user_data");
  const currentUser = userData ? JSON.parse(userData) : null;
  
  // Determine display username
  const displayUsername = profileUsername || (currentUser ? "you" : "");

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white text-start">
        {profileUsername ? `${profileUsername}'s rankings` : "all rankings"}
      </h1>
      {rankings.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rankings.map((ranking, index) => (
            <div
              key={index}
              onClick={() => {
                if (ranking._id) {
                  navigate(`/album/${ranking._id}`);
                }
              }}
              className="cursor-pointer"
            >
              <RankingCard
                ranking={{
                  username: displayUsername,
                  rankValue: ranking.rankValue,
                  notes: ranking.notes,
                  createdAt: ranking.createdAt,
                }}
                album={{
                  _id: ranking._id,
                  title: ranking.title,
                  artist: ranking.artist,
                  coverArtUrl: ranking.coverArtUrl,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          {profileUsername ? `${profileUsername} has no rankings yet.` : "No rankings yet."}
        </p>
      )}
    </div>
  );
}

