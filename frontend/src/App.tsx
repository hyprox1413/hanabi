import { useState } from "react";
import { socket } from "./socket";
import { Lobby } from "./Lobby";
import { Game } from "./Game";

import type { Room, Player } from "../../util/types";

import "./App.css";

const SCREENS = {
  LOBBY: "LOBBY",
  GAME: "GAME",
};

function App() {
  const [screen, setScreen] = useState(SCREENS.LOBBY);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

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
