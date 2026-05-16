import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { newGame, getTurnPlayer, makeMove } from "../util/game";

import type { MoveInfo, GameState, PlayerInfo, RoomInfo } from "../util/types";
import { couldStartTrivia } from "typescript";

const app = express();
const server = createServer(app);
const io = new Server({
  cors: {
    origin: "*",
  },
});

io.listen(4000);

const rooms = new Map<string, RoomInfo>();
const roomsByPlayer = new Map<string, RoomInfo>();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);

// HTTP endpoint to create a room
app.post("/api/rooms", (req, res) => {
  const { name, maxPlayers } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Room name is required" });
  }

  const roomId = crypto.randomUUID();
  const room: RoomInfo = {
    id: roomId,
    name,
    players: [],
    maxPlayers: Math.min(maxPlayers, 8), // Cap at 8 players
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

  res.json(room);
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

  const player: PlayerInfo = { id: playerId, name: playerName, ready: false };
  room.players.push(player);
  roomsByPlayer.set(playerId, room);

  res.json({
    success: true,
    player,
    message: "Use player to connect via WebSocket",
  });
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Player joins a room via WebSocket
  socket.on("enter-room", (data: { player: PlayerInfo }) => {
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
    socket.emit("room-state", { room });
  });

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

    if (room.players.length > 1 && room.players.every((p: PlayerInfo) => p.ready)) {
      newGame(room, room.players.length);
    }

    io.to(room.id).emit("room-state", { room });
  });

  socket.on("player-move", (data: { playerId: string; move: MoveInfo }) => {
    const { playerId, move } = data;
    const room = roomsByPlayer.get(playerId);
    
    if (!room) {
      socket.emit("error", { message: "Player not in room" });
      return;
    }
    if (!room.game) {
      socket.emit("error", { message: "Game not started" });
      return;
    }
    let playerTurn = -1;
    for (let i = 0; i < room.players.length; i++) {
      if (room.players[i]!.id === playerId) {
        playerTurn = i;
        break;
      }
    }
    
    // console.log("player turn: ", playerTurn);
    // console.log("received move: ", move);
    
    if (playerTurn !== getTurnPlayer(room.game)) {
      socket.emit("error", { message: "It's not your turn!" });
      return;
    }
    if (!makeMove(room.game, move)) {
      socket.emit("error", { message: "Illegal move." });
      return;
    }

    // console.log(`broadcasting following room state to ${room.id}: `, room);
    io.to(room.id).emit("game-state", { game: room.game });
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
