import React from "react";

export default function MembersList({ members = [], count = 0 }) {
  return (
    <aside
      id="members__container"
      className="bg-[#262625] w-full md:w-64 rounded-lg p-4 flex flex-col h-[70vh]"
    >
      <div
        id="members__header"
        className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2"
      >
        <p className="font-medium">Participants</p>
        <strong id="members__count" className="text-sm">
          {count}
        </strong>
      </div>

      <div
        id="member__list"
        className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {members.length === 0 ? (
          <p className="text-sm text-gray-400">No members yet</p>
        ) : (
          members.map((m) => (
            <div
              key={m.uid || m.id}
              className="member__wrapper flex items-center gap-3 p-2 rounded-md bg-[#1f1f1f]"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              <p className="member_name text-sm">
                {m.name || m.displayName || `User ${m.uid || m.id}`}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
