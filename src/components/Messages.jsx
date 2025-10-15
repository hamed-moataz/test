import React from "react";

const Messages = () => {
  return (
    <section className="bg-gray-900 text-white p-4 rounded-lg w-full h-[300px] flex flex-col">
      <div id="messages" className="flex-1 overflow-y-auto mb-2"></div>
      <form id="message__form" className="flex">
        <input
          type="text"
          placeholder="Send a message..."
          className="flex-1 p-2 rounded bg-gray-800 outline-none"
        />
      </form>
    </section>
  );
};

export default Messages;
