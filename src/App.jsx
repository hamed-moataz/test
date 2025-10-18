import { Route, Routes ,Navigate  } from "react-router-dom";
import Lobby from "./page/Lobby";
import MeetingRoom from "./page/MeetingRoom";

const App = () => {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/room" />} />
        <Route path="/lobby" element={<Lobby />} />
      <Route path="/room" element={<MeetingRoom />} />
    </Routes>
  );
};

export default App;
