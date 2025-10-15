import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LobbyForm = () => {

  const navigate = useNavigate();
 
  useEffect(() => {
    const displayName = sessionStorage.getItem("display_name");
    if (displayName) {
      const nameInput = document.querySelector('input[name="name"]');
      if (nameInput) nameInput.value = displayName;
    }
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    let inviteCode = e.target.room.value.trim();

    if (!name) {
      alert("Please enter your display name");
      return;
    }

    sessionStorage.setItem("display_name", name);

    if (!inviteCode) {
      inviteCode = String(Math.floor(Math.random() * 10000));
    }

    // نستخدم navigate للانتقال لصفحة الروم مع query param
    navigate(`/room?room=${inviteCode}`);
  };

  // const { data } = useContext(AppContext);
  // const navigate = useNavigate();

  // const onSubmit = (e) => {
  //   e.preventDefault();

  //   navigate(`/room?${data.channel_name}`);
  // };

  return (
    <div className="w-[90%] max-w-md bg-[#262625] rounded-lg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg">
      <div className="bg-[#363739] rounded-t-lg text-center py-3 text-lg font-medium">
        👋 Create or Join Room
      </div>

      <form id="lobby__form" onSubmit={onSubmit} className="p-8">
        <div className="mb-5">
          <label className="block text-sm mb-2">Your Name</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Enter your display name..."
            className="w-full bg-[var(--color-primary)] text-white rounded-md py-3 px-4 text-[15px] focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm mb-2">Room Name</label>
          <input
            name="room"
            type="text"
            placeholder="Enter room name..."
            className="w-full bg-[var(--color-primary)] text-white rounded-md py-3 px-4 text-[15px] focus:outline-none"
          />
        </div>
          {/* <div className="mb-5">
          <label className="block text-sm mb-2">Channel Name</label>
          {data?.channel_name ? (
            <input
              name="channel_name"
              type="text"
              value={data.channel_name || ""}
              className="w-full bg-[var(--color-primary)] text-white rounded-md py-3 px-4 text-[15px] focus:outline-none"
            />
          ) : (
            <p className="text-gray-400">Loading channel...</p>
          )}
        </div */}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 mt-6 bg-[var(--color-secondary)] py-3 rounded-md text-white text-[16px] font-medium hover:opacity-95 transition"
        >
          Go to Room
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ede0e0">
            <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default LobbyForm;
