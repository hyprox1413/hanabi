export interface CardInfo {
  rank: number;
  color: number;
  rankKnown: boolean;
  colorKnown: boolean;
}

export interface MoveInfo {
  action: "play" | "discard" | "hintRank" | "hintColor";
  cardIndex?: number;
  hintPlayerIndex?: number;
  hintRank?: number;
  hintColor?: number;
}

export interface GameState {
  maxHints: number;
  hintsRemaining: number;
  livesRemaining: number;
  deck: CardInfo[];
  hands: CardInfo[][];
  tableau: Number[];
  discarded: CardInfo[];
  moveHistory: MoveInfo[];
}

export interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  players: PlayerInfo[];
  maxPlayers: number;
  createdAt: Date;
  game?: GameState;
}
