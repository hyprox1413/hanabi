import { useState } from "react";
import { socket } from "./socket";
import { Lobby } from "./Lobby/Lobby";
import { Game } from "./Game/Game";
import { GameDebug } from "./debug/GameDebug";

import type { RoomInfo, PlayerInfo } from "../../util/types";

import "./App.css";

const SCREENS = {
  LOBBY: "LOBBY",
  GAME: "GAME",
};

function App() {
  const [screen, setScreen] = useState(SCREENS.LOBBY);
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerInfo | null>(null);
  
  if (import.meta.env.MODE === "debug") {
    return <GameDebug />;
  }

  return (
    <>
      {screen === SCREENS.LOBBY && (
        <Lobby
          screen={screen}
          setScreen={setScreen}
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          currentPlayer={currentPlayer}
          setCurrentPlayer={setCurrentPlayer}
        />
      )}
      {screen === SCREENS.GAME && (
        <Game
          screen={screen}
          setScreen={setScreen}
          room={currentRoom}
          setRoom={setCurrentRoom}
          currentPlayer={currentPlayer}
          setCurrentPlayer={setCurrentPlayer}
        />
      )}
    </>
  );
}

export default App;
