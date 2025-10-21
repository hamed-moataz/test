import { Route, Routes ,Navigate  } from "react-router-dom";
import MeetingRoom from "./page/MeetingRoom";

const App = () => {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/room" />} />
      <Route path="/room" element={<MeetingRoom />} />
    </Routes>
  );
};

export default App;
