import { useState } from "react";
import { socket } from "./socket";
import { Lobby } from "./Lobby";
// import { Game } from "./Game";

import "./App.css";

const SCREENS = {
  LOBBY: "LOBBY",
  GAME: "GAME",
};

function App() {
  const [screen, setScreen] = useState(SCREENS.LOBBY);

  return (
    <>
      {screen === SCREENS.LOBBY && <Lobby screen={screen} setScreen={setScreen} />}
      {/*{screen === SCREENS.GAME && <Game screen={screen} setScreen={setScreen} />}*/}
    </>
  );
}

export default App;
