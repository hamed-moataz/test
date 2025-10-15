import React from "react";
import Header from "../components/Header";
import Messages from "../components/Messages";
import StreamControls from "../components/StreamControls";
import MembersList from "../components/MembersList";


const Room = () => {
  return (
    <div className="bg-gray-950 min-h-screen text-white flex flex-col">
      <Header />
      <main className="flex flex-1 gap-4 p-6">
        <MembersList />
        <div className="flex flex-col flex-1">
          <div id="stream__box" className="bg-gray-800 rounded-lg flex-1"></div>
          <StreamControls />
          <button
            id="join-btn"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg self-center"
          >
            Join Stream
          </button>
        </div>
        <Messages />
      </main>
    </div>
  );
};

export default Room;
