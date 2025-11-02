import { useMeet } from "../context/MeetContext";
import { Hand, Mic, Trash, MonitorUp } from "lucide-react";

export default function MembersList({
  isCurrentUserHost = false,
  currentUserId,
}) {
  const {
    muteAll,
    endForAll,
    muteUser,
    kickedUser,
    adminLowerHand,
    raisedHands,
    hasRaised,
    closeStreamById,
    sortedMembers,
    micActive,
    screenActive,
  } = useMeet();
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
        <strong id="members__count" className="text-sm">
          {sortedMembers.length}
        </strong>
      </div>
      {isCurrentUserHost && (
        <div
          id="host__controls"
          className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-700"
        >
          <button
            type="button"
            onClick={muteAll}
            className="px-2 py-1 rounded-md bg-red-600 text-white text-sm hover:opacity-90"
            title="Mute all microphones"
          >
            Mute All
          </button>

          <button
            type="button"
            onClick={endForAll}
            className="ml-auto px-2 py-1 rounded-md bg-gray-700 text-white text-sm hover:opacity-90"
            title="End meeting for everyone"
          >
            End Meeting
          </button>
        </div>
      )}

      <div
        id="member__list"
        className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {sortedMembers.length === 0 ? (
          <p className="text-sm text-gray-400">No members yet</p>
        ) : (
          sortedMembers.map((m) => {
            const isRaised =
              raisedHands.has(m.id) || (m.id === currentUserId && hasRaised);
            const isMicActive = m.id === currentUserId ? micActive : m.audio;
            const isSharingScreen =
              m.id === currentUserId ? screenActive : m.video;
            return (
              <div
                key={m.id}
                className="member__wrapper flex items-center justify-between gap-3 p-2 rounded-md bg-[#1f1f1f]"
              >
                <p className="member_name text-sm truncate">{m.name || m.id}</p>
                {isMicActive && (
                  <Mic
                    className="text-green-400"
                    size={18}
                    title="Microphone Active"
                  />
                )}

                {isRaised && (
                  <Hand
                    className="text-yellow-400 animate-bounce"
                    title="Raised Hand"
                  />
                )}

                {isSharingScreen && (
                  <MonitorUp
                    className="text-green-400 cursor-pointer"
                    size={18}
                    title="Screen Sharing Active"
                  />
                )}
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
                        onClick={() => {
                          if (!m.audio) return;
                          muteUser?.(m.id);
                        }}
                        className={`relative  rounded-md cursor-pointer ${
                          m.audio
                            ? "bg-[var(--color-secondary)]"
                            : "bg-[var(--color-accent)]"
                        }`}
                        title="Mute guest mic (local)"
                        aria-label={`Mute ${m.name || m.id}`}
                      >
                        <Mic size={20} />
                        {!m.audio && (
                          <span className="absolute left-1/2 top-1/2 w-[18px] h-[2px] bg-white rotate-45 -translate-x-1/2 -translate-y-1/2 rounded" />
                        )}
                      </button>

                      <span
                        onClick={() => {
                          if (!m.video) return;
                          closeStreamById(m.id);
                        }}
                      >
                        <MonitorUp
                          className={`relative  rounded-md  cursor-pointer ${
                            m.video ? "text-green-400 " : ""
                          }`}
                          size={20}
                        />
                      </span>
                      <span
                        className="cursor-pointer text-red-500"
                        onClick={() => kickedUser(m.id)}
                      >
                        <Trash size={20} />
                      </span>
                      {isRaised && (
                        <span
                          onClick={() => adminLowerHand(m.id)}
                          className="cursor-pointer"
                          title="Lower hand"
                        >
                          <Hand size={20} className="text-yellow-400" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
