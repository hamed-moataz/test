import React from "react";

const StreamControls = () => {
  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button id="camera-btn" className="bg-gray-800 p-3 rounded-full text-white active">
        📷
      </button>
      <button id="mic-btn" className="bg-gray-800 p-3 rounded-full text-white active">
        🎤
      </button>
      <button id="screen-btn" className="bg-gray-800 p-3 rounded-full text-white">
        🖥️
      </button>
      <button id="leave-btn" className="bg-red-600 p-3 rounded-full text-white">
        🚪
      </button>
    </div>
  );
};

export default StreamControls;
