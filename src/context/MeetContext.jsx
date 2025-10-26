import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { decryptMeetToken } from "../services/crypto-utils";
import { leaveRoom, muteMic, toggleMic } from "../services/agoraRTCService";
import Pusher from "pusher-js";
import sound from "../assets/happy-message-ping-351298.mp3";

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

  const [hasRaised, setHasRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState(() => new Set());

  const handSoundRef = useRef(
    typeof Audio !== "undefined" ? new Audio(sound) : null
  );
  const playHandSound = () => {
    try {
      const a = handSoundRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    } catch (e) {
      console.log(e);
    }
  };

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

  const handleToggleMic = useCallback(async () => {
    const active = await toggleMic();
    setMicActive(active);
  }, []);

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

  const riseHand = async () => {
    playHandSound();

    setHasRaised(true);

    setRaisedHands((prev) => new Set(prev).add(userId));
    try {
      const res = await fetch(`${baseUrl}/api/agora/raise/hand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log(data, "from api sound");
      return data;
    } catch (error) {
      console.log(error);
      setHasRaised(false);
      setHasRaised(false);
      setRaisedHands((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
    }
  };
  const lowerHand = async () => {
    setHasRaised(false);
    setRaisedHands((prev) => {
      const s = new Set(prev);
      s.delete(userId);
      return s;
    });

    try {
      const res = await fetch(`${baseUrl}/api/agora/low/hand/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.log("Error lowering hand:", error);
    }
  };
  const handleToggleHand = useCallback(async () => {
    if (hasRaised) {
      await lowerHand();
    } else {
      await riseHand();
    }
  }, [hasRaised, userId]);

  const adminLowerHand = async (id) => {
    setHasRaised(false);
    setRaisedHands((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });

    try {
      const res = await fetch(`${baseUrl}/api/agora/low/hand/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      if (id === userId) {
        setHasRaised(false);
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.log("Error Admin Lowering hand:", error);
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
  }, [payloadData, t]);

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
          await handleToggleMic();
        } catch (e) {
          console.log(e);
        }
      }
    );

    bind(`agora.user.mute.${lectureId}`, "all.student.muted", async () => {
      try {
        await muteMic(true);
      } catch (e) {
        console.log(e);
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
        } catch (e) {
          console.log(e);
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

    bind(`student.student.raise.hand`, "students.actions", (payload) => {
      try {
        const evt = typeof payload === "string" ? JSON.parse(payload) : payload;
        const uid = String(evt?.userId || "");
        if (!uid) return;
        playHandSound();

        if (uid === userId) {
          setHasRaised(true);
        }
      } catch (e) {
        console.log("actions parse error:", e);
      }
    });
    bind(`student.low.hand.${userId}`, "low.hand", (payload) => {
      try {
        const evt = typeof payload === "string" ? JSON.parse(payload) : payload;
        const uid = String(evt?.userId || "");
        if (!uid) return;

        if (evt.type === "hand-raised") {
          setRaisedHands((prev) => {
            const s = new Set(prev);
            s.add(uid);
            return s;
          });
          if (uid === userId) setHasRaised(true);

          // playHandSound();
        } else if (evt.type === "hand-lowered") {
          setRaisedHands((prev) => {
            const s = new Set(prev);
            s.delete(uid);
            return s;
          });
          if (uid === userId) setHasRaised(false);
        }
      } catch (e) {
        console.log("actions parse error:", e);
      }
    });
    return () => {
      try {
        subsRef.current.forEach(({ channelName, event, handler }) => {
          const ch = pusher.channel(channelName);
          ch?.unbind(event, handler);
          pusher.unsubscribe(channelName);
        });
      } catch (e) {
        console.log(e);
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
        handleToggleHand,
        handleToggleMic,
        hasRaised,
        raisedHands,
        adminLowerHand,
      }}
    >
      {children}
    </MeetContext.Provider>
  );
};

export const useMeet = () => useContext(MeetContext);
