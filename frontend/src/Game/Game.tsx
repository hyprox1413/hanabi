import { useState, useEffect } from "react";
import { socket } from "../socket";
import { styles } from "./Game.styles";
import { COLORS, getCardColor } from "./constants";
import { Card } from "./Card";

import type {
  GameState,
  CardInfo,
  PlayerInfo,
  RoomInfo,
} from "../../../util/types";
import type { Dispatch, SetStateAction } from "react";

interface GameProps {
  screen: string;
  setScreen: Dispatch<SetStateAction<string>>;
  room: RoomInfo;
  setRoom: Dispatch<SetStateAction<RoomInfo>>;
  currentPlayer: PlayerInfo;
  setCurrentPlayer: Dispatch<SetStateAction<PlayerInfo>>;
}

export function Game({ room, currentPlayer }: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(room.game);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedHintPlayer, setSelectedHintPlayer] = useState<number | null>(
    null,
  );
  const [selectedHintType, setSelectedHintType] = useState<
    "rank" | "color" | null
  >(null);
  const [selectedHintValue, setSelectedHintValue] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");

  // Initialize game state and listen for updates
  useEffect(() => {
    const handleGameUpdate = (data: { game: GameState }) => {
      setGameState(data.game);
      setError("");
    };

    socket.on("game-state", handleGameUpdate);
    socket.on("error", console.error);

    return () => {
      socket.off("game-state", handleGameUpdate);
    };
  });

  const playerTurn = room.players.findIndex((p) => p.id === currentPlayer.id);

  if (!gameState) {
    return <div style={styles.container}>Loading game...</div>;
  }

  const playCard = () => {
    if (selectedCard === null) {
      setError("Please select a card to play");
      return;
    }

    socket.emit("player-move", {
      playerId: currentPlayer.id,
      move: {
        action: "play",
        cardIndex: selectedCard,
      },
    });

    setSelectedCard(null);
  };

  const discardCard = () => {
    if (selectedCard === null) {
      setError("Please select a card to discard");
      return;
    }

    socket.emit("player-move", {
      playerId: currentPlayer.id,
      move: {
        action: "discard",
        cardIndex: selectedCard,
      },
    });

    setSelectedCard(null);
  };

  const giveHint = () => {
    if (
      selectedCard === null ||
      selectedHintPlayer === null ||
      selectedHintType === null ||
      selectedHintValue === null
    ) {
      setError("Please select a card, player, hint type, and hint value");
      return;
    }

    if (gameState.hintsRemaining <= 0) {
      setError("No hints remaining");
      return;
    }

    const action = selectedHintType === "rank" ? "hintRank" : "hintColor";

    socket.emit("player-move", {
      playerId: currentPlayer.id,
      move: {
        action,
        cardIndex: selectedCard,
        hintPlayerIndex: selectedHintPlayer,
        hintRank: selectedHintType === "rank" ? selectedHintValue : undefined,
        hintColor: selectedHintType === "color" ? selectedHintValue : undefined,
      }
    });

    setSelectedCard(null);
    setSelectedHintPlayer(null);
    setSelectedHintType(null);
    setSelectedHintValue(null);
  };

  const renderTableau = () => {
    return (
      <div style={styles.tableauContainer}>
        <h3 style={styles.sectionTitle}>Tableau</h3>
        <div style={styles.tableau}>
          {gameState.tableau.map((count: number, colorIndex: number) => (
            <div key={colorIndex} style={styles.tableauStack}>
              <div
                style={{
                  ...styles.tableauLabel,
                  color: getCardColor(colorIndex),
                }}
              >
                {COLORS[colorIndex]}
              </div>
              <div style={styles.tableauCount}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDiscardPile = () => {
    return (
      <div style={styles.discardContainer}>
        <h3 style={styles.sectionTitle}>Discard Pile</h3>
        <div style={styles.discardGrid}>
          {gameState.discarded.length === 0 ? (
            <p style={styles.emptyMessage}>No cards discarded yet</p>
          ) : (
            gameState.discarded.map((card, index) => (
              <div
                key={index}
                style={{
                  ...styles.discardCard,
                  backgroundColor: getCardColor(card.color),
                }}
              >
                <div style={styles.discardCardRank}>{card.rank}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderHands = () => {
    return (
      <div style={styles.allHandsContainer}>
        <h3 style={styles.sectionTitle}>All Hands</h3>
        <div style={styles.allHandsGrid}>
          {gameState.hands.map((hand, playerIndex) => {
            const playerName =
              room.players[playerIndex]?.name || `Player ${playerIndex}`;

            return (
              <div key={playerIndex} style={styles.playerHandContainer}>
                <h4 style={styles.playerName}>{playerName}</h4>
                <div style={styles.playerHand}>
                  {hand.map((card, cardIndex) => (
                    <Card
                      card={card}
                      index={cardIndex}
                      isOwnCard={playerIndex === playerTurn}
                      selectedCard={selectedCard}
                      setSelectedCard={setSelectedCard}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGameState = () => {
    return (
      <div style={styles.gameStateContainer}>
        <div style={styles.gameStatItem}>
          <span style={styles.gameStateLabel}>Hints:</span>
          <span style={styles.gameStateValue}>
            {gameState.hintsRemaining}/{gameState.maxHints}
          </span>
        </div>
        <div style={styles.gameStatItem}>
          <span style={styles.gameStateLabel}>Lives:</span>
          <span style={styles.gameStateValue}>{gameState.livesRemaining}</span>
        </div>
        <div style={styles.gameStatItem}>
          <span style={styles.gameStateLabel}>Deck:</span>
          <span style={styles.gameStateValue}>{gameState.deck.length}</span>
        </div>
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div style={styles.actionsContainer}>
        <div style={styles.actionGroup}>
          <h4 style={styles.actionTitle}>Actions</h4>
          <div style={styles.buttonGroup}>
            <button
              style={{
                ...styles.actionButton,
                ...(selectedCard === null ? styles.buttonDisabled : {}),
              }}
              onClick={playCard}
              disabled={selectedCard === null}
            >
              Play
            </button>
            <button
              style={{
                ...styles.actionButton,
                ...(selectedCard === null ? styles.buttonDisabled : {}),
              }}
              onClick={discardCard}
              disabled={selectedCard === null}
            >
              Discard
            </button>
          </div>
        </div>

        <div style={styles.actionGroup}>
          <h4 style={styles.actionTitle}>Give Hint</h4>
          <div style={styles.hintForm}>
            <select
              style={styles.select}
              value={selectedHintType || ""}
              onChange={(e) =>
                setSelectedHintType(
                  (e.target.value as "rank" | "color") || null,
                )
              }
            >
              <option value="">Select hint type</option>
              <option value="rank">Rank</option>
              <option value="color">Color</option>
            </select>

            {selectedHintType === "rank" && (
              <select
                style={styles.select}
                value={selectedHintValue || ""}
                onChange={(e) =>
                  setSelectedHintValue(parseInt(e.target.value) || null)
                }
              >
                <option value="">Select rank</option>
                {[1, 2, 3, 4, 5].map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            )}

            {selectedHintType === "color" && (
              <select
                style={styles.select}
                value={selectedHintValue || ""}
                onChange={(e) =>
                  setSelectedHintValue(parseInt(e.target.value) || null)
                }
              >
                <option value="">Select color</option>
                {COLORS.map((color, index) => (
                  <option key={index} value={index}>
                    {color}
                  </option>
                ))}
              </select>
            )}

            <select
              style={styles.select}
              value={selectedHintPlayer || ""}
              onChange={(e) =>
                setSelectedHintPlayer(parseInt(e.target.value) || null)
              }
            >
              <option value="">Select player</option>
              {room.players.map((player, index) => {
                if (index === playerTurn) return null;
                return (
                  <option key={index} value={index}>
                    {player.name}
                  </option>
                );
              })}
            </select>

            <button
              style={{
                ...styles.actionButton,
                ...(selectedHintType === null ||
                selectedHintValue === null ||
                selectedHintPlayer === null ||
                gameState.hintsRemaining <= 0
                  ? styles.buttonDisabled
                  : {}),
              }}
              onClick={giveHint}
              disabled={
                selectedHintType === null ||
                selectedHintValue === null ||
                selectedHintPlayer === null ||
                gameState.hintsRemaining <= 0
              }
            >
              Give Hint
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{room.name}</h1>

      {renderGameState()}
      {renderTableau()}
      {renderDiscardPile()}
      {renderHands()}
      {renderActions()}
    </div>
  );
}
