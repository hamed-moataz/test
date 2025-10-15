import React, { useState, useCallback, useEffect, useRef } from "react";
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
} from "../services/agoraRTCService";
import Header from "../components/Header";
import VideoGrid from "../components/VideoGrid";
import Controls from "../components/Controls";
import ChatBox from "../components/ChatBox";
import MembersList from "../components/MembersList";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

export default function MeetingRoom() {
  const [joined, setJoined] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);

  const [screenActive, setScreenActive] = useState(false);
  const [members, setMembers] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatVisible, setChatVisible] = useState(true);
  const [membersVisible, setMembersVisible] = useState(true);
  const [uid, setUid] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const roomId = searchParams.get("room") || "main";

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  // const { data } = useContext(AppContext);
  // const roomId = data.work_shop_uuid;
  // const token = data.token;
  // const userId = data.user_ids.trainers[0];


  // user update
  const updateMembers = useCallback(() => {
    const users = getRemoteUsers();
    setRemoteUsers(users);
    setMembers(users);
  }, []);

  // join room
  const handleJoin = useCallback(async () => {
    const _uid =
      sessionStorage.getItem("uid") ||
      String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("uid", _uid);
    setUid(_uid);

    const token =
      "007eJxTYOiJf2nFdVDJpTemq6iUeZdtuGKxt9C18lXaNfv+m7tq1CswJCWaJVukGScbmSVbmhilmlqmGZqmmiQmJRslmaYZJqfFsL3LaAhkZGjcNJ2ZkQECQXwWhtzEzDwGBgCwuR3x";
    await joinRoom(roomId, _uid, token);

    setJoined(true);
    setMessages((m) => [
      ...m,
      { system: true, name: "Root Bot", text: "🎉 You joined the room" },
    ]);
  }, [roomId]);

  // leave the room
  const handleLeave = useCallback(async () => {
    await leaveRoom();
    setJoined(false);
    setRemoteUsers([]);
    setMicActive(false);
    closeCameraTrack();
    setScreenActive(false);
    setMessages((m) => [
      ...m,
      { system: true, name: "Mumble Bot", text: "👋 You left the room" },
    ]);
  }, []);

  // Change the microphone
  const handleToggleMic = useCallback(async () => {
    const active = await toggleMic();
    setMicActive(active);
  }, []);

  // Change the cam
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
      }
    };
  }, [localVideoTrack]);

  // Toggle screen sharing
  const handleToggleScreen = useCallback(async () => {
    const active = await toggleScreenShare();
    setScreenActive(active);
  }, []);

  useEffect(() => {
    const _uid =
      sessionStorage.getItem("uid") ||
      String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("uid", _uid);
    setUid(_uid);

    initRTCClient(updateMembers, updateMembers);

    return () => leaveRoom();
  }, [updateMembers]);

  useEffect(() => {
    if (screenActive && localTracks.screenTrack && screenVideoRef.current) {
      localTracks.screenTrack.play(screenVideoRef.current);
    }

    return () => {
      if (!screenActive && localTracks.screenTrack) {
        localTracks.screenTrack.stop();
      }
    };
  }, [screenActive]);
  if (!uid) return null;

  return (
    <div className="bg-[var(--color-primary)] min-h-screen text-white ">
      <Header />
      {!joined ? (
        <Loading handleJoin={handleJoin}/>
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
          {/* الواجهة بعد الـ Join */}
          {membersVisible && (
            <MembersList members={members} count={members.length} />
          )}

          <div className="flex flex-col max-h-[70vh] w-full relative mx-auto ">
            <VideoGrid joined={joined}>
              {joined && localVideoTrack && (
                <div className="video__container w-[300px] h-[300px] bg-black rounded-full overflow-hidden mx-auto">
                  <div ref={localVideoRef} className="w-full h-full"></div>
                </div>
              )}

              {screenActive && (
                <div className="video__container absolute top-0 left-0 w-full h-[85%] bg-black rounded-lg overflow-hidden z-10">
                  <div ref={screenVideoRef} className="w-full h-full"></div>
                </div>
              )}

              {remoteUsers.map((user) => (
                <div
                  key={user.uid}
                  className="video__container w-[150px] h-[150px] bg-black rounded-full overflow-hidden"
                >
                  <div
                    id={`player-${user.uid}`}
                    className="w-full h-full"
                  ></div>
                </div>
              ))}
            </VideoGrid>

            <Controls
              joined={joined}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onToggleMic={handleToggleMic}
              onToggleCamera={handleToggleCam}
              onToggleScreen={handleToggleScreen}
              onToggleChat={() => setChatVisible((v) => !v)}
              onToggleMembers={() => setMembersVisible((v) => !v)}
              micActive={micActive}
              camActive={!!localVideoTrack}
              screenActive={screenActive}
              chatVisible={chatVisible}
              membersVisible={membersVisible}
            />
          </div>

          {chatVisible && (
            <ChatBox
              messages={messages}
              onSend={(t) =>
                setMessages((m) => [...m, { name: "You", text: t }])
              }
            />
          )}
        </main>
      )}
    </div>
  );
}
