import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  initRTCClient,
  joinRoom,
  leaveRoom,
  toggleMic,
  toggleScreenShare,
  getRemoteUsers,
  localTracks,
  closeCameraTrack,
  createCameraTrack,
  // muteUserLocally,
  // stopUserVideoLocally,
  subscribeVolume,
  getScreenSharer,
  subscribeScreenShare,
  canStartScreenShare,
  onRemoteRosterChanged,
} from "../services/agoraRTCService";

import Header from "../components/Header";
import VideoGrid from "../components/VideoGrid";
import Controls from "../components/Controls";
import ChatBox from "../components/ChatBox";
import MembersList from "../components/MembersList";
import Loading from "../components/Loading";
import { useMeet } from "../context/MeetContext";

import {
  initRTM,
  joinRTMChannel,
  leaveRTM,
  sendRTMMessage,
} from "../services/agoraRTMService";

export default function MeetingRoom() {
  const {data, loading, setMicActive, micActive } = useMeet();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [screenActive, setScreenActive] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatVisible, setChatVisible] = useState(true);
  const [membersVisible, setMembersVisible] = useState(true);
  const [currentScreenSharer, setCurrentScreenSharer] = useState(null);
  const speakingPrevRef = useRef({});
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [userDirectory, setUserDirectory] = useState({});

  const upsertUser = useCallback((u) => {
    if (!u?.id) return;
    const id = String(u.id);
    setUserDirectory((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...u, id },
    }));
  }, []);


  const params = new URLSearchParams(window.location.search);
  const t = params.get("payload");

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  const speakSoundRef = useRef(
    typeof Audio !== "undefined"
      ? new Audio(
          "data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQgAAAABAQEBAP///wAAAP///w=="
        )
      : null
  );

  const updateMembers = useCallback(() => {
    const users = getRemoteUsers();
    setRemoteUsers([...users]);
  }, []);

  const handleJoin = useCallback(async () => {
    const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
    const userId = String(data?.user_uuid);
    const rtcToken = data?.token;
    const rtmToken = data?.rtm_token;
    const channelName = String(data?.channel_name);
    const isHost = data?.host;

    try {
      setJoining(true);
      try {
        const res = await fetch(`${baseUrl}/api/agora/record-join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: t }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        await res.json();
      } catch (err) {
        console.warn("record-join error:", err);
      }

      // RTC join
      await joinRoom(APP_ID, channelName, userId, rtcToken, isHost);

      // RTM
      await initRTM(APP_ID, userId, rtmToken, {
        name: data?.user_name,
        host: isHost,
      });

      await joinRTMChannel(
        channelName,
        (msg, memberId) => {
          if (msg?.type !== "intro") {
            setMessages((prev) => [
              ...prev,
              {
                name:
                  msg.name ||
                  userDirectory[String(memberId)]?.name ||
                  String(memberId),
                text: msg.text,
                ts: msg.ts || Date.now(),
              },
            ]);
          }
        },
        ({ id, name, host }) => {
          if (id) upsertUser({ id, name, host });
        }
      );

      subscribeVolume((volumes) => {
        const THRESHOLD = 8;
        const nowSpeaking = {};
        volumes.forEach((v) => {
          const id = String(v.uid);
          const lvl = typeof v.level === "number" ? v.level : 0;
          const isSpeaking = lvl > THRESHOLD;
          nowSpeaking[id] = isSpeaking;

          const wasSpeaking = speakingPrevRef.current[id] || false;
          if (!wasSpeaking && isSpeaking) {
            try {
              const a = speakSoundRef.current;
              if (a) {
                a.currentTime = 0;
                a.play().catch(() => {});
              }
            } catch (e) {
              console.log(e);
            }
          }
        });

        setSpeakingUsers((prev) => ({ ...prev, ...nowSpeaking }));
        speakingPrevRef.current = {
          ...speakingPrevRef.current,
          ...nowSpeaking,
        };
      });

      setJoined(true);
      setMessages((m) => [
        ...m,
        { system: true, name: "Root Bot", text: "🎉wellcome to room" },
      ]);
    } catch (e) {
      console.error("Join failed:", e);
    } finally {
      setJoining(false);
    }
  }, [data, t, baseUrl, upsertUser, userDirectory]);

  const handleLeave = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/agora/record-end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: t }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      await res.json();
    } catch (err) {
      console.warn("record-end error:", err);
    }

    await leaveRTM().catch(() => {});
    await leaveRoom();

    setJoined(false);
    setRemoteUsers([]);
    setMicActive(false);
    closeCameraTrack();
    setScreenActive(false);
    setSpeakingUsers({});
    speakingPrevRef.current = {};

    setMessages((m) => [
      ...m,
      { system: true, name: "Mumble Bot", text: "👋 You left the room" },
    ]);
  }, [baseUrl, t]);

  // Toggle Mic
  const handleToggleMic = useCallback(async () => {
    const active = await toggleMic();
    setMicActive(active);
  }, []);

  // Toggle Camera
  const handleToggleCam = useCallback(async () => {
    if (!localVideoTrack) {
      try {
        const newTrack = await createCameraTrack();
        setLocalVideoTrack(newTrack);
      } catch (error) {
        console.error("Failed to start camera", error);
      }
    } else {
      try {
        await closeCameraTrack();
        setLocalVideoTrack(null);
      } catch (error) {
        console.error("Failed to close camera", error);
      }
    }
  }, [localVideoTrack]);

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
    return () => {
      if (localVideoTrack) localVideoTrack.stop();
    };
  }, [localVideoTrack]);

  const handleToggleScreen = useCallback(async () => {
    const active = await toggleScreenShare();
    setScreenActive(active);
    setCurrentScreenSharer(
      active ? (data?.user_uuid ? String(data.user_uuid) : "local") : null
    );
  }, [data?.user_uuid]);

  useEffect(() => {
    initRTCClient(updateMembers, updateMembers);
    return () => {
      leaveRoom();
      leaveRTM().catch(() => {});
    };
  }, [updateMembers]);

  useEffect(() => {
    if (screenActive && localTracks.screenTrack && screenVideoRef.current) {
      localTracks.screenTrack.play(screenVideoRef.current);
    }
    return () => {
      localTracks.screenTrack?.stop();
    };
  }, [screenActive]);

  const selfId = String(data?.user_uuid || "");

  const members = useMemo(
    () => [
      {
        id: selfId,
        name: data?.user_name,
        host: data?.host,
        audio: !!localTracks.audioTrack,
        video: !!localVideoTrack,
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
    ]
  );

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => (a.host === b.host ? 0 : a.host ? -1 : 1)),
    [members]
  );
  const anyScreenActive = !!currentScreenSharer || screenActive;

  useEffect(() => {
    setCurrentScreenSharer(getScreenSharer());
    const unsub = subscribeScreenShare((uid) => setCurrentScreenSharer(uid));
    return () => {
      unsub();
    };
  }, []);
  useEffect(() => {
    onRemoteRosterChanged(() => updateMembers());
  }, [updateMembers]);

  if (loading) {
    return (
      <div className="flex flex-row gap-2 bg-primary h-screen w-full justify-center items-center">
        <div className="w-4 h-4 rounded-full bg-[var(--color-secondary)] animate-bounce"></div>
        <div className="w-4 h-4 rounded-full bg-[var(--color-secondary)] animate-bounce [animation-delay:-.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-[var(--color-secondary)] animate-bounce [animation-delay:-.5s]"></div>
      </div>
    );
  }
 
  return (
    <div className="bg-[var(--color-primary)] min-h-screen text-white ">
      <Header />

      {!joined ? (
        <Loading handleJoin={handleJoin} isJoining={joining} />
      ) : (
        <main
          className={`pt-24 max-w-9/10 mx-auto grid h-screen gap-4 transition-all duration-300 justify-center items-center  
            ${
              membersVisible && chatVisible
                ? "md:grid-cols-[250px_1fr_300px]"
                : membersVisible
                ? "md:grid-cols-[250px_1fr]"
                : chatVisible
                ? "md:grid-cols-[1fr_300px] "
                : "md:grid-cols-1"
            }`}
        >
          {membersVisible && (
            <MembersList
              members={members}
              isCurrentUserHost={userDirectory[selfId]?.host}
              currentUserId={selfId}
              // onMuteRemoteUser={muteUserLocally}
              // onStopRemoteVideo={stopUserVideoLocally}

              // setMicActive = {setMicActive}
            />
          )}

          <div className="flex flex-col max-h-[70vh] w-full relative mx-auto">
            <VideoGrid joined={joined} fullBleed={anyScreenActive}>
              {anyScreenActive ? (
                <div className="relative w-full h-full bg-black rounded-lg overflow-hidden 0">
                  {screenActive ? (
                    <div ref={screenVideoRef} className="absolute inset-0" />
                  ) : currentScreenSharer ? (
                    <div
                      id={`player-screen-${currentScreenSharer}`}
                      className="absolute inset-0"
                    />
                  ) : null}
                </div>
              ) : (
                <>
                  {joined && localVideoTrack && (
                    <div className="w-[150px] h-[150px] bg-black rounded-full overflow-hidden mx-auto">
                      <div ref={localVideoRef} className="w-full h-full"></div>
                    </div>
                  )}

                  {sortedMembers.map((user) => {
                    const isSpeaking = !!speakingUsers[user.id];
                    const speakingClass = isSpeaking
                      ? "ring-4 ring-[var(--color-secondary)] animate-pulse"
                      : "";

                    return (
                      <div
                        key={user.id}
                        className={`w-[150px] h-[150px]  bg-sky-500 rounded-xl overflow-hidden ${speakingClass}`}
                      >
                        <div
                          id={`player-${user.id}`}
                          className="w-full h-full text-center flex justify-center items-center"
                        >
                          <span className="text-white">{user.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </VideoGrid>

            <Controls
              joined={joined}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onToggleMic={async () => {
                if (!joined) return;
                try {
                  await handleToggleMic();
                } catch (e) {
                  console.error(e);
                }
              }}
              onToggleCamera={async () => {
                if (!joined) return;
                try {
                  await handleToggleCam();
                } catch (e) {
                  console.error(e);
                }
              }}
              onToggleScreen={async () => {
                if (!joined) return;
                if (!canStartScreenShare(selfId)) {
                  console.warn("Another user is already sharing the screen.");
                  return;
                }
                try {
                  await handleToggleScreen();
                } catch (e) {
                  console.error(e);
                }
              }}
              onToggleChat={() => setChatVisible((v) => !v)}
              onToggleMembers={() => setMembersVisible((v) => !v)}
              micActive={micActive}
              camActive={!!localVideoTrack}
              screenActive={screenActive}
              chatVisible={chatVisible}
              membersVisible={membersVisible}
              micDisabled={!joined || joining}
              camDisabled={!joined || joining}
              screenDisabled={!joined || joining}
              members={members}
            />
          </div>

          {chatVisible && (
            <ChatBox
              messages={messages}
              onSend={async (text) => {
                const payload = {
                  userId: selfId,
                  name:
                    userDirectory[selfId]?.name || data?.user_name || selfId,
                  text,
                  ts: Date.now(),
                };
                upsertUser({ id: payload.userId, name: payload.name });

                setMessages((m) => [...m, payload]);
                try {
                  await sendRTMMessage(payload);
                } catch (e) {
                  console.error("RTM send failed:", e);
                }
              }}
            />
          )}
        </main>
      )}
    </div>
  );
}
