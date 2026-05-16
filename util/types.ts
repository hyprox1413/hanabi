export interface Card {
  rank: number;
  color: number;
  rankKnown: boolean;
  colorKnown: boolean;
}

export interface Move {
  action: "play" | "discard" | "hintRank" | "hintColor";
  cardIndex: number;
  hintPlayerIndex: number;
  hintRank: number;
  hintColor: number;
}

export interface Game {
  maxHints: number;
  hintsRemaining: number;
  livesRemaining: number;
  deck: Card[];
  hands: Card[][];
  tableau: Number[];
  discarded: Card[];
  moveHistory: Move[];
}

export interface Player {
  id: string;
  name: string;
  ready: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  createdAt: Date;
  game?: Game;
}