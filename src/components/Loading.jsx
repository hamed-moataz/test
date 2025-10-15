import React from "react";

const Loading = ({handleJoin}) => {
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen w-full   text-center text-gray-200 ">
        <div className="relative mb-8">
          <div className="w-32 h-32 border-4 border-gray-700 rounded-full animate-spin border-t-[var(--color-secondary)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="white"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6.75A2.25 2.25 0 0013.5 4.5h-9A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5h9a2.25 2.25 0 002.25-2.25V13.5l4.5 4.5V6l-4.5 4.5z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-semibold mb-2">Ready to Join?</h2>
        <p className="mb-6 text-gray-400 text-sm md:text-base">
          Click below to enter the meeting and start your stream.
        </p>

        <button
          onClick={handleJoin}
          className="px-8 py-3 bg-[var(--color-secondary)] rounded-md text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105"
        >
          Join Stream
        </button>
      </div>
    </div>
  );
};

export default Loading;
