import { useState, useCallback, useEffect, useRef } from "react";
import {
  initRTCClient,
  joinRoom,
  leaveRoom,
  getRemoteUsers,
  localTracks,
  closeCameraTrack,
  createCameraTrack,
  getScreenSharer,
  subscribeScreenShare,
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
  const {
    data,
    loading,
    setMicActive,
    screenActive,
    setScreenActive,
    currentScreenSharer,
    setCurrentScreenSharer,
    localVideoTrack,
    setLocalVideoTrack,
    setRemoteUsers,
    userDirectory,
    setUserDirectory,
    selfId,
    members,
    sortedMembers,
  } = useMeet();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatVisible, setChatVisible] = useState(true);
  const [membersVisible, setMembersVisible] = useState(true);
  const [speakingUsers, setSpeakingUsers] = useState({});
  const speakingPrevRef = useRef({});
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
      await initRTM(APP_ID, userId, rtmToken, handleLeave, {
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

      setJoined(true);
      setMessages((m) => {
        const welcomeText = "🎉wellcome to room";
        const isWelcomeMessageAlreadyPresent = m.some(
          (msg) => msg.text === welcomeText && msg.system === true
        );
        if (isWelcomeMessageAlreadyPresent) {
          return m;
        } else {
          return [...m, { system: true, name: "Root Bot", text: welcomeText }];
        }
      });
    } catch (e) {
      console.error("Join failed:", e);
    } finally {
      setJoining(false);
    }
  }, [data, t, upsertUser, userDirectory]);

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
    // console.log("Executing full leave process due to remote login...");
    await leaveRTM().catch(() => {});
    await leaveRoom();

    setJoined(false);
    setRemoteUsers([]);
    setMicActive(false);
    closeCameraTrack();
    setScreenActive(false);
    setSpeakingUsers({});
    speakingPrevRef.current = {};

    setMessages((m) => [...m]);
  }, [t]);

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
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
    };
  }, [localVideoTrack]);

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
    <div className="bg-[var(--color-primary)] h-auto  lg:h-screen text-white ">
      <Header />

      {!joined ? (
        <Loading handleJoin={handleJoin} isJoining={joining} />
      ) : (
        <main className={` pt-24 max-w-9/10 mx-auto `}>
          <div
            className={`grid  gap-4 transition-all duration-300 place-content-center w-full mx-auto
            ${
              membersVisible && chatVisible
                ? "lg:grid-cols-[250px_1fr_260px]"
                : membersVisible
                ? "lg:grid-cols-[250px_1fr]"
                : chatVisible
                ? "lg:grid-cols-[1fr_300px] "
                : "lg:grid-cols-1"
            }`}
          >
            {membersVisible && (
              <MembersList
                members={members}
                isCurrentUserHost={userDirectory[selfId]?.host}
                currentUserId={selfId}
              />
            )}
            <div className="flex flex-col max-h-[70vh] w-full  relative mx-auto overflow-y-auto">
              <VideoGrid joined={joined} fullBleed={anyScreenActive}>
                {anyScreenActive ? (
                  <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        if (!document.fullscreenElement) {
                          document.documentElement.requestFullscreen();
                        } else {
                          document.exitFullscreen();
                        }
                      }}
                      className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 shadow-lg  z-50"
                      title="Toggle Full Screen"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-18h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3"
                        />
                      </svg>
                      Full Screen
                    </button>
                    {screenActive ? (
                      <div ref={screenVideoRef} className="absolute inset-0" />
                    ) : currentScreenSharer ? (
                      <div
                        id={`player-screen-${currentScreenSharer}`}
                        className="absolute inset-0"
                      />
                    ) : null}

                    {localVideoTrack && (
                      <div className="absolute bottom-4 right-4 w-40 h-28 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                        <div
                          ref={localVideoRef}
                          className="w-full h-full"
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {joined && localVideoTrack && (
                      <div className="w-[150px] h-[150px] bg-black rounded-full overflow-hidden mx-auto">
                        <div
                          ref={localVideoRef}
                          className="w-full h-full"
                        ></div>
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
                          className="flex flex-wrap justify-center"
                        >
                          <div
                            className={`w-[160px] h-[160px] bg-sky-500 rounded-full ${speakingClass}`}
                          >
                            <div
                              id={`player-${user.id}`}
                              className="w-full h-full flex justify-center items-center overflow-hidden px-2 text-center"
                            >
                              <span className="text-white w-full mx-auto text-center">
                                {user.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </VideoGrid>
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
          </div>
        </main>
      )}
      <Controls
        joined={joined}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onToggleCamera={async () => {
          if (!joined) return;
          try {
            await handleToggleCam();
          } catch (e) {
            console.error(e);
          }
        }}
        onToggleChat={() => setChatVisible((v) => !v)}
        onToggleMembers={() => setMembersVisible((v) => !v)}
        camActive={!!localVideoTrack}
        screenActive={screenActive}
        chatVisible={chatVisible}
        membersVisible={membersVisible}
        camDisabled={!joined || joining}
        screenDisabled={!joined || joining}
      />
    </div>
  );
}
