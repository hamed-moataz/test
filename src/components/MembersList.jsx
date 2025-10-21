import React, { useMemo } from "react";

export default function MembersList({
  members = [],
  isCurrentUserHost = false,
  currentUserId,
  onMuteRemoteUser,
  onStopRemoteVideo,
}) {
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.host === b.host ? 0 : a.host ? -1 : 1)),
    [members]
  );
  return (
    <aside
      id="members__container"
      className="bg-[#262625] w-full md:w-64 rounded-lg p-3 flex flex-col h-[70vh]"
    >
      <div
        id="members__header"
        className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2"
      >
        <p className="font-medium">Participants</p>
        <strong id="members__count" className="text-sm">{sortedMembers.length}</strong>
      </div>

      <div
        id="member__list"
        className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {sortedMembers.length === 0 ? (
          <p className="text-sm text-gray-400">No members yet</p>
        ) : (
          sortedMembers.map((m) => (
            <div
              key={m.id}
              className="member__wrapper flex items-center justify-between gap-3 p-2 rounded-md bg-[#1f1f1f]"
            >
              <p className="member_name text-sm truncate">
                {m.name || m.id}
              </p>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    m.host
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-600/40"
                      : "bg-gray-500/20 text-gray-300 border border-gray-600/40"
                  }`}
                  title={m.host ? "Admin" : "Guest"}
                >
                  {m.host ? "Admin" : "Guest"}
                </span>

                {isCurrentUserHost && !m.host && m.id !== currentUserId && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onMuteRemoteUser?.(m.id)}
                      className="p-1 rounded-md bg-[var(--color-accent)] text-white hover:opacity-90"
                      title="Mute guest mic (local)"
                      aria-label={`Mute ${m.name || m.id}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a2 2 0 0 1 2 2v7a2 2 0 1 1-4 0V4a2 2 0 0 1 2-2zM6 9v2a6 6 0 0 0 12 0V9h2v2a8 8 0 0 1-7 7.938V21h3v2H8v-2h3v-2.062A8 8 0 0 1 4 11V9h2z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStopRemoteVideo?.(m.id)}
                      className="p-1 rounded-md bg-[var(--color-accent)] text-white hover:opacity-90"
                      title="Stop guest video (local)"
                      aria-label={`Stop video of ${m.name || m.id}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 10.5V7a2 2 0 0 0-2-2H3A2 2 0 0 0 1 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5l6 4v-11l-6 4z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
