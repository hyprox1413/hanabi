import type { Card, Move, Game, Room } from "./types";

const COLORS = [ "red", "green", "blue", "yellow", "white" ];
const NUM_COPIES = [ 3, 2, 2, 2, 1 ];
const CARDS_PER_HAND = 4;

export function getTurnPlayer(game: Game): number {
  return game.moveHistory.length % game.hands.length;
}

function validateMove(game: Game, move: Move): boolean {
  const turnPlayer = getTurnPlayer(game);
  if (move.action == "play" || move.action == "discard") {
    if (game.hands[turnPlayer]![move.cardIndex] == undefined) return false;
  }
  if (move.action == "hintColor") {
    if (game.hintsRemaining < 1) return false;
    if (move.hintColor < 0 || move.hintColor >= COLORS.length) return false;
  }
  if (move.action == "hintRank") {
    if (game.hintsRemaining < 1) return false;
    if (move.hintRank < 0 || move.hintRank >= NUM_COPIES.length) return false;
  }
  return true;
}

function loseCard(game: Game, move: Move) {
  const turnPlayer = getTurnPlayer(game);
  game.hands[turnPlayer]!.splice(move.cardIndex, 1);
  const newCard = game.deck.pop();
  if (newCard) game.hands[turnPlayer]!.push(newCard);
}

export function makeMove(game: Game, move: Move): boolean {
  if (!validateMove(game, move)) return false;
  const turnPlayer = getTurnPlayer(game);
  
  if (move.action == "play") {
    const card = game.hands[turnPlayer]![move.cardIndex]!;
    loseCard(game, move);
    
    if (game.tableau[card.color] == card.rank - 1) {
      game.tableau[card.color] = card.rank;
    } else {
      game.livesRemaining--;
    }
  }
  
  if (move.action == "discard") {
    const card = game.hands[turnPlayer]![move.cardIndex]!;
    loseCard(game, move);
    game.discarded.push(card);
    if (game.hintsRemaining < game.maxHints) {
      game.hintsRemaining++;
    }
  }
  
  if (move.action == "hintRank") {
    game.hintsRemaining--;
    for (const card of game.hands[move.hintPlayerIndex]!) {
      if (card.rank == move.hintRank) card.rankKnown = true;
    }
  }
  
  if (move.action == "hintColor") {
    game.hintsRemaining--;
    for (const card of game.hands[move.hintPlayerIndex]!) {
      if (card.color == move.hintColor) card.colorKnown = true;
    }
  }
  return true;
}

function newDeck(deck: Card[]) {
  for (let color = 0; color < COLORS.length; color++) {
    for (let rank = 0; rank < NUM_COPIES.length; rank++) {
      for (let copy = 0; copy < NUM_COPIES[rank]!; copy++) {
        deck.push({
          rank,
          color,
          rankKnown: false,
          colorKnown: false,
        })
      }
    }
  }
  
  // shuffle
  deck.sort(() => Math.random() - 0.5);
}

function dealCards(deck: Card[], hands: Card[][]) {
  for (let i = 0; i < hands.length; i++) {
    hands[i] = [];
    for (let j = 0; j < CARDS_PER_HAND; j++) {
      hands[i]!.push(deck.pop()!);
    }
  }
}

export function newGame(room: Room) {
  room.game = {
    maxHints: 8,
    hintsRemaining: 8,
    livesRemaining: 3,
    deck: [],
    hands: [],
    tableau: [],
    discarded: [],
    moveHistory: [],
  };

  newDeck(room.game.deck);
  dealCards(room.game.deck, room.game.hands);
}