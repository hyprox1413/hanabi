import { useState, useEffect } from "react";
import { socket, HTTP_URL } from "../socket";
import { styles } from "./Lobby.styles";

import type { PlayerInfo, RoomInfo } from "../../../util/types";
import type { Dispatch, SetStateAction } from "react";

interface LobbyProps {
  screen: string;
  setScreen: Dispatch<SetStateAction<string>>;
  currentRoom: RoomInfo | null;
  setCurrentRoom: Dispatch<SetStateAction<RoomInfo | null>>;
  currentPlayer: PlayerInfo | null;
  setCurrentPlayer: Dispatch<SetStateAction<PlayerInfo | null>>;
}

interface RoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isFull: boolean;
}

export function Lobby({ setScreen, currentRoom, setCurrentRoom, currentPlayer, setCurrentPlayer }: LobbyProps) {
  const [view, setView] = useState<"menu" | "create" | "join" | "room">("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const handleRoomState = (data: { room: RoomInfo }) => {
      const { room } = data;
      setCurrentRoom(room);
      if (room.game) {
        // Game has started
        setScreen("GAME");
      }
    };

    socket.on("room-state", handleRoomState);

    return () => {
      socket.off("room-state", handleRoomState);
    };
  }, [setCurrentRoom, setScreen]);

  // Fetch available rooms
  const fetchRooms = async () => {
    try {
      const response = await fetch(`${HTTP_URL}/api/rooms`);
      const data = await response.json();
      setRooms(data.rooms);
    } catch (err) {
      setError("Failed to fetch rooms");
      console.error(err);
    }
  };

  // Create a new room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) {
      setError("Please enter both player name and room name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create room
      const createResponse = await fetch(`${HTTP_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName, maxPlayers }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create room");
      }

      const createData = await createResponse.json();
      const roomId = createData.room.id;

      // Join room
      const joinResponse = await fetch(`${HTTP_URL}/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      });

      if (!joinResponse.ok) {
        throw new Error("Failed to join room");
      }

      const joinData = await joinResponse.json();
      const player = joinData.player;

      setCurrentPlayer(player);
      setCurrentRoom({
        id: roomId,
        name: roomName,
        players: [player],
        maxPlayers,
        createdAt: new Date(),
      });

      // Connect via WebSocket
      socket.emit("enter-room", { player });
      setView("room");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Join an existing room
  const handleJoinRoom = async (roomId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!playerName.trim()) {
      setError("Please enter your player name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Join room
      const joinResponse = await fetch(`${HTTP_URL}/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      });

      if (!joinResponse.ok) {
        throw new Error("Failed to join room");
      }

      const joinData = await joinResponse.json();
      const player = joinData.player;

      // Get room details
      const roomResponse = await fetch(`${HTTP_URL}/api/rooms/${roomId}`);
      if (!roomResponse.ok) {
        throw new Error("Failed to get room details");
      }

      const roomData = await roomResponse.json();

      setCurrentPlayer(player);
      setCurrentRoom(roomData);

      // Connect via WebSocket
      socket.emit("enter-room", { player });
      setView("room");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mark player as ready
  const handleReady = () => {
    if (currentPlayer) {
      socket.emit("get-ready", { playerId: currentPlayer.id });
      setIsReady(true);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Hanabi</h1>

      {error && <div style={styles.error}>{error}</div>}

      {view === "menu" && (
        <div style={styles.menu}>
          <button
            style={styles.button}
            onClick={() => {
              setView("create");
              setError("");
            }}
          >
            Create Room
          </button>
          <button
            style={styles.button}
            onClick={() => {
              setView("join");
              setError("");
              fetchRooms();
            }}
          >
            Join Room
          </button>
        </div>
      )}

      {view === "create" && (
        <form onSubmit={handleCreateRoom} style={styles.form}>
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <div style={styles.formGroup}>
            <label style={styles.label}>Max Players: {maxPlayers}</label>
            <input
              type="range"
              min="2"
              max="8"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              style={styles.slider}
              disabled={loading}
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              setView("menu");
              setError("");
            }}
            disabled={loading}
          >
            Back
          </button>
        </form>
      )}

      {view === "join" && (
        <div style={styles.joinView}>
          <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <button
              type="button"
              style={styles.button}
              onClick={() => fetchRooms()}
              disabled={loading}
            >
              Refresh Rooms
            </button>
          </form>

          <div style={styles.roomsList}>
            {rooms.length === 0 ? (
              <p style={styles.noRooms}>No rooms available</p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} style={styles.roomCard}>
                  <div style={styles.roomInfo}>
                    <h3 style={styles.roomName}>{room.name}</h3>
                    <p style={styles.roomDetails}>
                      {room.playerCount}/{room.maxPlayers} players
                    </p>
                  </div>
                  <button
                    style={{
                      ...styles.button,
                      opacity: room.isFull ? 0.5 : 1,
                      cursor: room.isFull ? "not-allowed" : "pointer",
                    }}
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.isFull || loading}
                  >
                    {room.isFull ? "Full" : "Join"}
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              setView("menu");
              setError("");
            }}
            disabled={loading}
          >
            Back
          </button>
        </div>
      )}

      {view === "room" && currentRoom && (
        <div style={styles.roomView}>
          <h2 style={styles.roomTitle}>{currentRoom.name}</h2>
          <div style={styles.playersList}>
            <h3>
              Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
            </h3>
            {currentRoom.players.map((player) => (
              <div key={player.id} style={styles.playerItem}>
                <span>{player.name}</span>
                {player.ready && <span style={styles.readyBadge}>Ready</span>}
              </div>
            ))}
          </div>

          {!isReady && (
            <button style={styles.button} onClick={handleReady}>
              Mark as Ready
            </button>
          )}
          {isReady && (
            <div style={styles.waitingMessage}>
              Waiting for other players...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
