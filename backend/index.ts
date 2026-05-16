import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { newGame } from "../util/game";

import type { Move, Game, Room, Player } from "../util/types";

const app = express();
const server = createServer(app);
const io = new Server({
  cors: {
    origin: "http://localhost:5173"
  }
});

io.listen(4000);

const __dirname = dirname(fileURLToPath(import.meta.url));

const rooms = new Map<string, Room>();
const roomsByPlayer = new Map<string, Room>();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Serve static files
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// HTTP endpoint to create a room
app.post("/api/rooms", (req, res) => {
  const { name, maxPlayers } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Room name is required" });
  }

  const roomId = crypto.randomUUID();
  const room: Room = {
    id: roomId,
    name,
    players: [],
    maxPlayers: Math.min(maxPlayers, 8), // Cap at 8 players
    ready: [],
    createdAt: new Date(),
  };

  rooms.set(roomId, room);
  console.log(`Room created: ${roomId} (${name})`);

  res.status(201).json({
    success: true,
    room: {
      id: room.id,
      name: room.name,
      maxPlayers: room.maxPlayers,
      playerCount: room.players.length,
    },
  });
});

// HTTP endpoint to list all rooms
app.get("/api/rooms", (req, res) => {
  const roomList = Array.from(rooms.values()).map((room) => ({
    id: room.id,
    name: room.name,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    isFull: room.players.length >= room.maxPlayers,
  }));

  res.json({ rooms: roomList });
});

// HTTP endpoint to get a specific room
app.get("/api/rooms/:roomId", (req, res) => {
  const room = rooms.get(req.params.roomId);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.json({
    id: room.id,
    name: room.name,
    players: room.players,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    isFull: room.players.length >= room.maxPlayers,
  });
});

// HTTP endpoint to join a room (returns connection info)
app.post("/api/rooms/:roomId/join", (req, res) => {
  const { playerName } = req.body;
  const roomId = req.params.roomId;

  if (!playerName) {
    return res.status(400).json({ error: "Player name is required" });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: "Room is full" });
  }

  // Generate a player ID for this session
  const playerId = crypto.randomUUID();

  const player: Player = { id: playerId, name: playerName, ready: false };
  room.players.push(player);
  roomsByPlayer.set(playerId, room);

  res.json({
    success: true,
    player,
    message: "Use player to connect via WebSocket",
  });
});

app.get("/api/rooms/:roomId/enter", (req, res) => {
  
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Player joins a room via WebSocket
  socket.on(
    "enter-room",
    (data: { player: Player }) => {
      const { player } = data;

      const room = roomsByPlayer.get(player.id);
      if (!room) {
        socket.emit("error", { message: "You have not joined a room" });
        return;
      }

      // Join socket to a room namespace
      socket.join(room.id);

      console.log(`Player ${player.id} (${player.name}) joined!`);
      
      // Send current room state to the joining player
      socket.emit("room-state", {
        roomName: room.name,
        players: room.players,
        readyPlayers: room.ready,
        maxPlayers: room.maxPlayers,
      });
    },
  );
  
  socket.on("get-ready", (data: { playerId: string }) => {
    const { playerId } = data;
    
    const room = roomsByPlayer.get(playerId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    
    for (const player of room.players) {
      if (player.id == playerId) {
        player.ready = true;
      }
    }

    if (room.players.length > 1 && room.players.every((p: Player) => p.ready)) {
      newGame(room);
      io.to(room.id).emit("room-state", {
        roomName: room.name,
        players: room.players,
        playerCount: room.players.length,
        readyPlayers: room.ready,
        maxPlayers: room.maxPlayers,
        game: room.game,
      });
    }

    io.to(room.id).emit("room-state", {
      roomName: room.name,
      players: room.players,
      playerCount: room.players.length,
      readyPlayers: room.ready,
      maxPlayers: room.maxPlayers,
    });
  });

  socket.on("player-move", (data: { playerId: string, move: Move }) => {
    const { playerId, move } = data;
    const room = roomsByPlayer.get(playerId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
