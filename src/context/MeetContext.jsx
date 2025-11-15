import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { decryptMeetToken } from "../services/crypto-utils";
import {
  leaveRoom,
  muteMic,
  toggleMic,
  closeStream,
  toggleScreenShare,
  subscribeScreenShare,
  getScreenSharer,
  localTracks,
} from "../services/agoraRTCService";
import Pusher from "pusher-js";
import sound from "../assets/happy-message-ping-351298.mp3";
import { leaveRTM } from "../services/agoraRTMService";

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
  const [showLoadingGate, setShowLoadingGate] = useState(false);

  const [hasRaised, setHasRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState(() => new Set());

  const [screenActive, setScreenActive] = useState(false);
  const [currentScreenSharer, setCurrentScreenSharer] = useState(null);
  const [screenSharerId, setScreenSharerId] = useState(getScreenSharer());

  const [isRecording, setIsRecording] = useState(false);

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
  const playSound = (soundPath) => {
    const audio = new Audio(soundPath);
    audio.play().catch((err) => console.log("Audio play error:", err));
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
  console.log(payloadData , "payload")

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
  const handleToggleScreen = useCallback(async () => {
    const active = await toggleScreenShare();
    const sharerId = active
      ? data?.user_uuid
        ? String(data.user_uuid)
        : "local"
      : null;

    setScreenActive(active);
    setCurrentScreenSharer(sharerId);
    setScreenSharerId(sharerId);
  }, [data?.user_uuid]);

  const [localVideoTrack, setLocalVideoTrack] = useState(null);

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [userDirectory, setUserDirectory] = useState({});

  const selfId = String(data?.user_uuid || "");

  const members = useMemo(
    () => [
      {
        id: selfId,
        name: data?.user_name,
        host: data?.host,
        audio: !!localTracks.audioTrack,
        video: !!localTracks.videoTrack,
        // screen : !!localTracks.screenTrack
      },
      ...remoteUsers.map((u) => {
        const id = String(u.uid);
        const entry = userDirectory[id];
        return {
          id,
          name: entry?.name || u.user_name || u.name || id,
          host: !!entry?.host,
          audio: !!u.audioTrack,
          video: !!u.videoTrack,
          // screen : !!u.screenTrack
        };
      }),
    ],
    [
      selfId,
      data?.user_name,
      data?.host,
      remoteUsers,
      userDirectory,
      localVideoTrack,
      // screenActive
    ]
  );
  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => (a.host === b.host ? 0 : a.host ? -1 : 1)),
    [members]
  );

  const muteUser = async (id) => {
    try {
      const res = await fetch(`${baseUrl}api/agora/mute/user/${id}`, {
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
      setMicActive(false);

      const res = await fetch(`${baseUrl}api/agora/mute/all/users`, {
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
      const res = await fetch(`${baseUrl}api/agora/kick/user/${id}`, {
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
      const res = await fetch(`${baseUrl}api/agora/end-for-all`, {
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
    setHasRaised(true);
    setRaisedHands((prev) => new Set(prev).add(userId));
    try {
      const res = await fetch(`${baseUrl}api/agora/raise/hand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.log(error);
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
      const res = await fetch(`${baseUrl}api/agora/low/hand/${userId}`, {
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
  const closeStreamById = async (id) => {
    try {
      const res = await fetch(`${baseUrl}api/agora/start/stream/${id}`, {
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

  const startRecord = async () => {
    try {
      setIsRecording(true);
      const res = await fetch(`${baseUrl}api/agora/start/recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log(data, "from api started");
      return data;
    } catch (error) {
      console.log("Error lowering hand:", error);
      setIsRecording(false);
    }
  };
  const endRecord = async () => {
    try {
      setIsRecording(false);
      const res = await fetch(`${baseUrl}api/agora/end/recording`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log(data, "from api end");
      return data;
    } catch (error) {
      console.log("Error lowering hand:", error);
      setIsRecording(false);
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
      const res = await fetch(`${baseUrl}api/agora/low/hand/${id}`, {
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
        const res = await fetch(`${baseUrl}api/agora/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: t }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        // console.log(payloadData , 'from data')
        const workshopData = await res.json();
        setWorkshop(workshopData);
        // console.log(workshopData , 'from ')
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
          await muteMic();
          setMicActive(false);
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
          await leaveRTM();
          setMicActive(false);
          setShowLoadingGate(true);
        }
      }
    );

    bind(`agora.users.all.${lectureId}`, "session.ended", async () => {
      if (endedOnceRef.current) return;
      endedOnceRef.current = true;
      try {
        await leaveRoom();
      } finally {
        await leaveRTM();
        setMicActive(false);
        setShowLoadingGate(true);
      }
    });

    bind("students.actions", `student.student.raise.hand`, (payload) => {
      try {
        playHandSound();
        const evt = typeof payload === "string" ? JSON.parse(payload) : payload;
        const uid = String(evt?.user_uuid || "");
        if (!uid) return;

        if (uid === userId) {
          setHasRaised(true);
        }

        setRaisedHands((prev) => new Set(prev).add(uid));
      } catch (e) {
        console.log("actions parse error:", e);
      }
    });

    bind(`student.low.hand`, "low.hand", (payload) => {
      try {
        const evt = typeof payload === "string" ? JSON.parse(payload) : payload;
        const uid = String(evt?.user_uuid || "");
        if (!uid) return;

        setRaisedHands((prev) => {
          const s = new Set(prev);
          s.delete(uid);
          return s;
        });

        if (uid === userId) {
          setHasRaised(false);
        }
      } catch (e) {
        console.log("actions parse error:", e);
      }
    });
    bind(
      `users.start.stream.in.${lectureId}`,
      `users.start.stream`,

      async (payload) => {
        try {
          const evt =
            typeof payload === "string" ? JSON.parse(payload) : payload;
          const uid = String(evt?.user || "");
          if (!uid) return;

          if (uid === userId) {
            await closeStream();
            setScreenActive(false);
          }
        } catch (e) {
          console.log("actions parse error:", e);
        }
      }
    );
    bind(
      `lecture.${lectureId}.start.recording`,
      `recording.started`,

      async () => {
        // console.log(payload, "from start pusher");
        setIsRecording(true);
        playSound("/src/assets/start.mp3");
      }
    );

    bind(
      `lecture.${lectureId}.start.recording`,
      `recording.ended`,

      async () => {
        // console.log(payload, "from end pusher");
        setIsRecording(false);
        playSound("/src/assets/end.mp3");
      }
    );
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
  useEffect(() => {
    const unsubscribe = subscribeScreenShare((newSharerId) => {
      setScreenSharerId(newSharerId);
    });

    return () => unsubscribe();
  }, []);

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
        screenSharerId,
        setScreenSharerId,
        closeStreamById,
        screenActive,
        setScreenActive,
        currentScreenSharer,
        setCurrentScreenSharer,
        handleToggleScreen,
        localVideoTrack,
        setLocalVideoTrack,
        remoteUsers,
        setRemoteUsers,
        userDirectory,
        setUserDirectory,
        selfId,
        members,
        sortedMembers,
        startRecord,
        endRecord,
        isRecording,
      }}
    >
      {children}
    </MeetContext.Provider>
  );
};

export const useMeet = () => useContext(MeetContext);
