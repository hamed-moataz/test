import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { decryptMeetToken } from "../services/crypto-utils";
import { leaveRoom, muteMic } from "../services/agoraRTCService";
import Pusher from "pusher-js";

const MeetContext = createContext();

export const MeetProvider = ({ children }) => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const APP_KEY = import.meta.env.VITE_PUSHER_APP_KEY;
  const CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER;

  const [authorized, setAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [workshop, setWorkshop] = useState(null);
  const [micActive, setMicActive] = useState(false);

  // NEW: gate for showing <Loading /> again after kick/end
  const [showLoadingGate, setShowLoadingGate] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const t = params.get("payload");

  const payloadData = useMemo(() => {
    if (!t) return null;
    try {
      return decryptMeetToken(t);
    } catch (e) {
      console.error("Decryption error:", e);
      return null;
    }
  }, [t]);

  const userId = String(payloadData?.user_uuid || "");
  const lectureId = String(payloadData?.lecture_uuid || "");

  const pusherRef = useRef(null);
  const subsRef = useRef([]);
  const kickedOnceRef = useRef(false);
  const endedOnceRef = useRef(false);

  const muteUser = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/api/agora/mute/user/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      await res.json();
    } catch (error) {
      console.log(error);
    }
  };

  const muteAll = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/agora/mute/all/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      await res.json();
    } catch (error) {
      console.log(error);
    }
  };

  const kickedUser = async (id) => {
    try {
      const res = await fetch(`${baseUrl}/api/agora/kick/user/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      await res.json();
    } catch (error) {
      console.log(error);
    }
  };

  const endForAll = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/agora/end-for-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      await res.json();
    } catch (error) {
      console.log(error);
    }
  };

  

  // ---- Verify payload once ----
  useEffect(() => {
    const verifyPayload = async () => {
      if (!payloadData) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/agora/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: t }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const workshopData = await res.json();
        setWorkshop(workshopData);

        const hasLecture = !!workshopData?.lecture_uuid;
        const hasUser = !!workshopData?.user_uuid;
        const isHost =
          workshopData?.is_host === true || workshopData?.is_host === "true";

        const isValid =
          hasLecture && hasUser && (isHost === true || isHost === false);
        setAuthorized(isValid);
        setData(payloadData);
      } catch (err) {
        console.error("Verification error:", err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    verifyPayload();
  }, [payloadData, baseUrl, t]);

  useEffect(() => {
    if (!APP_KEY || !CLUSTER || !userId || !lectureId) return;

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(APP_KEY, { cluster: CLUSTER });
    }
    const pusher = pusherRef.current;

    const bind = (channelName, event, handler) => {
      const ch = pusher.subscribe(channelName);
      ch.bind(event, handler);
      subsRef.current.push({ channelName, event, handler });
      return ch;
    };

    bind(
      `agora.user.mute.${userId}.${lectureId}`,
      "student.muted",
      async () => {
        try {
          await muteMic(true);
        } catch(e) {
          console.log(e)
        }
        setMicActive(false);
      }
    );

    bind(`agora.user.mute.${lectureId}`, "all.student.muted", async () => {
      try {
        await muteMic(true);
      } catch(e) {
          console.log(e)
        }
      setMicActive(false);
    });

    bind(
      `agora.user.kick.${userId}.${lectureId}`,
      "student.kicked",
      async () => {
        if (kickedOnceRef.current) return;
        kickedOnceRef.current = true;

        try {
          subsRef.current
            .filter(
              (s) => s.channelName === `agora.user.kick.${userId}.${lectureId}`
            )
            .forEach((s) => {
              const ch = pusher.channel(s.channelName);
              ch?.unbind(s.event, s.handler);
              pusher.unsubscribe(s.channelName);
            });
        } catch(e) {
          console.log(e)
        }

        try {
          await leaveRoom();
        } finally {
          setMicActive(false);
          setShowLoadingGate(true); 
        }
      }
    );

    bind(`agora.users.all.${lectureId}`, "session.ended", async () => {
      if (endedOnceRef.current) return;
      endedOnceRef.current = true;
      await leaveRoom();
      setShowLoadingGate(true);
    });

    return () => {
      try {
        subsRef.current.forEach(({ channelName, event, handler }) => {
          const ch = pusher.channel(channelName);
          ch?.unbind(event, handler);
          pusher.unsubscribe(channelName);
        });
      } catch(e) {
          console.log(e)
        }
      subsRef.current = [];
      kickedOnceRef.current = false;
      endedOnceRef.current = false;
    };
  }, [APP_KEY, CLUSTER, userId, lectureId]);

  if (showLoadingGate) {
    window.location.reload();
  }

  return (
    <MeetContext.Provider
      value={{
        authorized,
        loading,
        data,
        workshop,
        setMicActive,
        micActive,
        muteAll,
        endForAll,
        muteUser,
        kickedUser,
        showLoadingGate,
        setShowLoadingGate,
      }}
    >
      {children}
    </MeetContext.Provider>
  );
};

export const useMeet = () => useContext(MeetContext);
