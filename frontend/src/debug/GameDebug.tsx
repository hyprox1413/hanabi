import { Game } from "../Game/Game";
import type { GameState as GameState, RoomInfo, PlayerInfo } from "../../../util/types";

function createDebugGame(): { room: RoomInfo; currentPlayer: PlayerInfo } {
  const players: PlayerInfo[] = [
    { id: "player1", name: "Alice", ready: true },
    { id: "player2", name: "Bob", ready: true },
    { id: "player3", name: "Charlie", ready: true },
  ];

  const game: GameState = {
    maxHints: 8,
    hintsRemaining: 5,
    livesRemaining: 2,
    deck: [
      { rank: 1, color: 0, rankKnown: false, colorKnown: false },
      { rank: 2, color: 1, rankKnown: false, colorKnown: false },
    ],
    hands: [
      [
        { rank: 1, color: 0, rankKnown: true, colorKnown: false },
        { rank: 2, color: 1, rankKnown: false, colorKnown: true },
        { rank: 3, color: 2, rankKnown: true, colorKnown: true },
        { rank: 4, color: 3, rankKnown: false, colorKnown: false },
      ],
      [
        { rank: 1, color: 1, rankKnown: true, colorKnown: false },
        { rank: 2, color: 2, rankKnown: false, colorKnown: true },
        { rank: 3, color: 3, rankKnown: true, colorKnown: true },
        { rank: 5, color: 4, rankKnown: false, colorKnown: false },
      ],
      [
        { rank: 2, color: 0, rankKnown: true, colorKnown: false },
        { rank: 3, color: 1, rankKnown: false, colorKnown: true },
        { rank: 4, color: 2, rankKnown: true, colorKnown: true },
        { rank: 5, color: 3, rankKnown: false, colorKnown: false },
      ],
    ],
    tableau: [1, 2, 0, 1, 0],
    discarded: [
      { rank: 5, color: 0, rankKnown: true, colorKnown: true },
      { rank: 4, color: 1, rankKnown: true, colorKnown: true },
    ],
    moveHistory: [],
  };

  const room: RoomInfo = {
    id: "debug-room",
    name: "Debug Game",
    players,
    maxPlayers: 3,
    createdAt: new Date(),
    game,
  };

  return { room, currentPlayer: players[0] };
}

export function GameDebug() {
  const { room, currentPlayer } = createDebugGame();

  return (
    <Game
      screen="game"
      setScreen={() => {}}
      room={room}
      setRoom={() => {}}
      currentPlayer={currentPlayer}
      setCurrentPlayer={() => {}}
    />
  );
}