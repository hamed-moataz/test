import React, { useRef, useEffect } from "react";

export default function ChatBox({ messages, onSend }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      id="messages__container"
      className="bg-[#262625] w-full md:w-64 rounded-lg p-4 flex flex-col  h-[70vh] "
    >
      <div
        id="messages"
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">No messages yet</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`message__wrapper ${m.system ? "opacity-90" : ""}`}>
              <div
                className={
                  m.system
                    ? "message__body__bot p-2 bg-[#2b2b2b] rounded"
                    : "message__body p-2 bg-[#3f434a] rounded"
                }
              >
                <strong
                  className={m.system ? "message__author__bot" : "message__author"}
                >
                  {m.name || "Mumble"}
                </strong>
                <p className="message__text text-sm mt-1">{m.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        id="message__form"
        onSubmit={(e) => {
          e.preventDefault();
          const val = e.target.message.value.trim();
          if (!val) return;
          onSend(val);
          e.target.reset();
        }}
        className="flex"
      >
        <input
          name="message"
          type="text"
          placeholder="Send a message..."
          className="flex-1 bg-[#3f434a] text-white rounded-md px-4 py-2 outline-none"
        />
      </form>
    </section>
  );
}
