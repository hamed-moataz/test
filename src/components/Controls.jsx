import React, { useState } from "react";

export default function Controls({
  joined,
  onJoin,
  onLeave,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onToggleChat,
  onToggleMembers,
  micActive = false,
  camActive = false,
  screenActive = false,
  chatVisible = false,
  membersVisible = false,
}) {
  const [handRaised, setHandRaised] = useState(false);

  const handleRaiseHand = async () => {
    const newState = !handRaised;
    setHandRaised(newState);

  };

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <div className="stream__actions flex flex-wrap justify-center items-center gap-3">
        {!joined && (
          <button
            id="join-btn"
            onClick={onJoin}
            className="mt-4 bg-[var(--color-secondary)] px-6 py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Join Stream
          </button>
        )}

        {joined && (
          <>
            {/* 🎥 الكاميرا */}
            <button
              id="camera-btn"
              onClick={onToggleCamera}
              className={`relative p-3 rounded-md ${
                camActive ? "bg-[var(--color-secondary)]" : "bg-[var(--color-accent)]"
              } text-white`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z" />
              </svg>
              {!camActive && (
                <span className="absolute left-1/2 top-1/2 w-[22px] h-[3px] bg-white rotate-45 -translate-x-1/2 -translate-y-1/2 rounded"></span>
              )}
            </button>

            {/* 🎤 المايك */}
            <button
              id="mic-btn"
              onClick={onToggleMic}
              className={`relative p-3 rounded-md ${
                micActive ? "bg-[var(--color-secondary)]" : "bg-[var(--color-accent)]"
              } text-white`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z" />
              </svg>
              {!micActive && (
                <span className="absolute left-1/2 top-1/2 w-[22px] h-[2px] bg-white rotate-45 -translate-x-1/2 -translate-y-1/2 rounded"></span>
              )}
            </button>

            {/* 🖥 مشاركة الشاشة */}
            <button
              id="screen-btn"
              onClick={onToggleScreen}
              className={`p-3 rounded-md ${
                screenActive ? "bg-[var(--color-secondary)]" : "bg-[var(--color-accent)]"
              } text-white`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M0 1v17h24v-17h-24zm22 15h-20v-13h20v13zm-6.599 4l2.599 3h-12l2.599-3h6.802z" />
              </svg>
            </button>
            <button
              onClick={handleRaiseHand}
              className={`p-3 rounded-md transition-all duration-300 ${
                handRaised
                  ? "bg-[var(--color-secondary)] text-white"
                  : "bg-[var(--color-accent)] text-gray-200 hover:bg-[var(--color-accent)]"
              }`}
              title={handRaised ? "Lower Hand" : "Raise Hand"}
            >
              {handRaised ? "🙌" : "✋"}
            </button>

            {/* 💬 زر الشات */}
            <button
              onClick={onToggleChat}
              className={`p-3 rounded-md ${
                chatVisible ? "bg-[var(--color-secondary)]" : "bg-[var(--color-accent)]"
              } text-white`}
            >
              {/* SVG الشات */}
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-6 h-6"
              >
                {" "}
                <defs>
                  {" "}
                  <clipPath id="clip-path">
                    {" "}
                    <rect
                      x="-0.1"
                      y="0.01"
                      width="24"
                      height="24"
                      fill="none"
                    />{" "}
                  </clipPath>{" "}
                </defs>{" "}
                <g clipPath="url(#clip-path)">
                  {" "}
                  <path d="M10.51,14.3a.71.71,0,0,1-.53-.22l-2-2A.75.75,0,0,1,8,11L10.14,8.9A.75.75,0,1,1,11.2,10L9.58,11.57,11,13a.75.75,0,0,1,0,1.06A.74.74,0,0,1,10.51,14.3Z" />{" "}
                  <path d="M15.59,14.3a.74.74,0,0,1-.53-.22.75.75,0,0,1,0-1.06l1.45-1.45L14.9,10A.75.75,0,1,1,16,8.9L18.1,11a.75.75,0,0,1,0,1.06l-2,2A.74.74,0,0,1,15.59,14.3Z" />{" "}
                  <path d="M13.08,20.49a8.75,8.75,0,0,1-4-1,.76.76,0,0,1-.32-1,.75.75,0,0,1,1-.32,7.33,7.33,0,0,0,4.68.69A7.25,7.25,0,1,0,6,10a7.31,7.31,0,0,0,.85,5.49.75.75,0,0,1-.25,1,.75.75,0,0,1-1-.25A8.73,8.73,0,0,1,11.47,3.14a8.75,8.75,0,0,1,3.21,17.21A9.61,9.61,0,0,1,13.08,20.49Z" />{" "}
                  <path d="M5.33,21A1.42,1.42,0,0,1,4,19l1.53-3.42a.74.74,0,0,1,1-.38.76.76,0,0,1,.38,1L5.48,19.45l3.67-1.31a.75.75,0,1,1,.5,1.41L5.8,20.92A1.31,1.31,0,0,1,5.33,21Z" />{" "}
                </g>{" "}
              </svg>
            </button>

            {/* 👥 زر المشاركين */}
            <button
              onClick={onToggleMembers}
              className={`p-3 rounded-md ${
                membersVisible ? "bg-[var(--color-secondary)]" : "bg-[var(--color-accent)]"
              } text-white`}
            >
              <svg viewBox="0 0 32 32" fill="currentColor" className="w-6 h-6">
                <path d="M16 15.503A5.041 5.041 0 1 0 16 5.42a5.041 5.041 0 0 0 0 10.083zm0 2.215c-6.703 0-11 3.699-11 5.5v3.363h22v-3.363c0-2.178-4.068-5.5-11-5.5z" />
              </svg>
            </button>

            {/* 🚪 مغادرة الغرفة */}
            <button
              id="leave-btn"
              onClick={onLeave}
              className="p-3 rounded-md bg-[#FF5050] text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M16 10v-5l8 7-8 7v-5h-8v-4h8zm-16-8v20h14v-2h-12v-16h12v-2h-14z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
