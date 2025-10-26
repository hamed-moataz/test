import React, { useMemo } from "react";
import { useMeet } from "../context/MeetContext";
import { Camera, LogOut, MessageCircleMore, Mic, MonitorUp, UserRound } from "lucide-react";

export default function Controls({
  joined,
  onLeave,
  onToggleCamera,
  onToggleScreen,
  onToggleChat,
  onToggleMembers,
  camActive = false,
  screenActive = false,
  chatVisible = false,
  membersVisible = false,

  micDisabled,
  camDisabled,
  screenDisabled,
}) {
  const { micActive, hasRaised, handleToggleMic, handleToggleHand } = useMeet();

  const computedMicDisabled = useMemo(
    () => (typeof micDisabled === "boolean" ? micDisabled : !joined),
    [micDisabled, joined]
  );
  const computedCamDisabled = useMemo(
    () => (typeof camDisabled === "boolean" ? camDisabled : !joined),
    [camDisabled, joined]
  );
  const computedScreenDisabled = useMemo(
    () => (typeof screenDisabled === "boolean" ? screenDisabled : !joined),
    [screenDisabled, joined]
  );

  const safe = (fn, disabled) => () => {
    if (disabled) return;
    fn?.();
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <div className="stream__actions flex flex-wrap justify-center items-center gap-3">
        {joined && (
          <>
            {/* Camera */}
            <button
              id="camera-btn"
              onClick={safe(onToggleCamera, computedCamDisabled)}
              disabled={computedCamDisabled}
              title={computedCamDisabled ? "Join first to use camera" : ""}
              className={`relative p-3 rounded-md ${
                camActive
                  ? "bg-[var(--color-secondary)]"
                  : "bg-[var(--color-accent)]"
              } text-white ${
                computedCamDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              aria-pressed={camActive}
              aria-disabled={computedCamDisabled}
            >
              <Camera />
              {!camActive && (
                <span className="absolute left-1/2 top-1/2 w-[22px] h-[3px] bg-white rotate-45 -translate-x-1/2 -translate-y-1/2 rounded" />
              )}
            </button>

            {/* Mic */}
            <button
              id="mic-btn"
              onClick={safe(handleToggleMic, computedMicDisabled)}
              disabled={computedMicDisabled}
              title={computedMicDisabled ? "Join first to use microphone" : ""}
              className={`relative p-3 rounded-md ${
                micActive
                  ? "bg-[var(--color-secondary)]"
                  : "bg-[var(--color-accent)]"
              } text-white ${
                computedMicDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              aria-pressed={micActive}
              aria-disabled={computedMicDisabled}
            >
              <Mic />
              {!micActive && (
                <span className="absolute left-1/2 top-1/2 w-[22px] h-[2px] bg-white rotate-45 -translate-x-1/2 -translate-y-1/2 rounded" />
              )}
            </button>

            {/* Screen Share */}
            <button
              id="screen-btn"
              onClick={safe(onToggleScreen, computedScreenDisabled)}
              disabled={computedScreenDisabled}
              title={computedScreenDisabled ? "Join first to share screen" : ""}
              className={`p-3 rounded-md ${
                screenActive
                  ? "bg-[var(--color-secondary)]"
                  : "bg-[var(--color-accent)]"
              } text-white ${
                computedScreenDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              aria-pressed={screenActive}
              aria-disabled={computedScreenDisabled}
            >
              <MonitorUp />
            </button>

            {/* Raise Hand */}
            <button
              onClick={handleToggleHand}
              className={`p-3 rounded-md transition-all duration-300 ${
                hasRaised
                  ? "bg-[var(--color-secondary)] text-white"
                  : "bg-[var(--color-accent)] text-gray-200 hover:opacity-90"
              }`}
              title={hasRaised ? "Lower Hand" : "Raise Hand"}
              aria-pressed={hasRaised}
            >
              {hasRaised ? "🙌" : "✋"}
            </button>

            {/* Chat toggle */}
            <button
              onClick={onToggleChat}
              className={`p-3 rounded-md ${
                chatVisible
                  ? "bg-[var(--color-secondary)]"
                  : "bg-[var(--color-accent)]"
              } text-white hover:opacity-90`}
              aria-pressed={chatVisible}
              title={chatVisible ? "Hide chat" : "Show chat"}
            >
              <MessageCircleMore />
            </button>

            {/* Members toggle */}
            <button
              onClick={onToggleMembers}
              className={`p-3 rounded-md ${
                membersVisible
                  ? "bg-[var(--color-secondary)]"
                  : "bg-[var(--color-accent)]"
              } text-white hover:opacity-90`}
              aria-pressed={membersVisible}
              title={membersVisible ? "Hide participants" : "Show participants"}
            >
              <UserRound />
            </button>

            {/* Leave */}
            <button
              id="leave-btn"
              onClick={onLeave}
              className="p-3 rounded-md bg-[#FF5050] text-white hover:opacity-90"
              title="Leave"
            >
             <LogOut />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
