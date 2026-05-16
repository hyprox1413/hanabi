import { useState, useEffect } from "react";
import { socket, HTTP_URL } from "./socket";
import type { Player, Room } from "../../util/types";

interface LobbyProps {
  screen: string;
  setScreen: (screen: string) => void;
}

interface RoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isFull: boolean;
}

export function Lobby({ setScreen }: LobbyProps) {
  const [view, setView] = useState<"menu" | "create" | "join" | "room">("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const joinResponse = await fetch(
        `${HTTP_URL}/api/rooms/${roomId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName }),
        },
      );

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
      const joinResponse = await fetch(
        `${HTTP_URL}/api/rooms/${roomId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName }),
        },
      );

      if (!joinResponse.ok) {
        throw new Error("Failed to join room");
      }

      const joinData = await joinResponse.json();
      const player = joinData.player;

      // Get room details
      const roomResponse = await fetch(
        `${HTTP_URL}/api/rooms/${roomId}`,
      );
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

  // Listen for room state updates
  useEffect(() => {
    const handleRoomState = (data: {room: Room}) => {
      const { room } = data;
      if (room.game) {
        // Game has started
        setScreen("GAME");
      } else {
        // Update room state
        setCurrentRoom((prev) =>
          prev
            ? {
                ...prev,
                players: room.players,
              }
            : null,
        );
      }
    };

    socket.on("room-state", handleRoomState);

    return () => {
      socket.off("room-state", handleRoomState);
    };
  }, [setScreen]);

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

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "40px",
    color: "#333",
  },
  menu: {
    display: "flex",
    gap: "20px",
    flexDirection: "column" as const,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
    width: "100%",
    maxWidth: "400px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontFamily: "inherit",
  },
  slider: {
    width: "100%",
    cursor: "pointer",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500" as const,
    color: "#666",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold" as const,
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  secondaryButton: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold" as const,
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  error: {
    color: "#d32f2f",
    backgroundColor: "#ffebee",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
    maxWidth: "400px",
  },
  joinView: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
    width: "100%",
    maxWidth: "500px",
  },
  roomsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto" as const,
  },
  roomCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    margin: "0 0 5px 0",
    fontSize: "18px",
    color: "#333",
  },
  roomDetails: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
  noRooms: {
    textAlign: "center" as const,
    color: "#999",
    padding: "20px",
  },
  roomView: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  roomTitle: {
    margin: "0 0 20px 0",
    fontSize: "28px",
    color: "#333",
  },
  playersList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  playerItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    border: "1px solid #eee",
  },
  readyBadge: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold" as const,
  },
  waitingMessage: {
    textAlign: "center" as const,
    padding: "15px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    borderRadius: "4px",
    fontWeight: "500" as const,
  },
};
