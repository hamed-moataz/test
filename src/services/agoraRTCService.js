// services / agoraRTCService.js
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
// const token =
//   "007eJxTYAjqj2BPfLvst3JxWly2wbU6lsWHhXsEAs7cVlo82WvbvVAFhqREs2SLNONkI7NkSxOjVFPLNEPTVJPEpGSjJNM0w+S0rrDXGQ2BjAyRcreZGRkgEMRnYchNzMxjYAAAPBofrg==";
let rtcClient;
export let localTracks = {
  audioTrack: null,
  videoTrack: null,
  screenTrack: null,
};
let remoteUsers = {};


export const initRTCClient = (onUserJoined, onUserLeft) => {
  rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  rtcClient.on("user-published", async (user, mediaType) => {
    await rtcClient.subscribe(user, mediaType);

    if (mediaType === "audio") user.audioTrack.play();

    if (mediaType === "video" || mediaType === "screen") {
      const player = document.getElementById(
        mediaType === "video"
          ? `player-${user.uid}`
          : `player-screen-${user.uid}`
      );
      if (player) user.videoTrack.play(player);
    }

    remoteUsers[user.uid] = user;
    onUserJoined?.(Object.values(remoteUsers));
  });

  rtcClient.on("user-left", (user) => {
    delete remoteUsers[user.uid];
    onUserLeft?.(Object.values(remoteUsers));
  });
};

// joinRoom
export const joinRoom = async (channel, uid, token) => {
  if (!rtcClient) throw new Error("RTC client not initialized");
  await rtcClient.join(APP_ID, channel, token, uid);
  console.log("✅ Joined channel, tracks not published yet");
};

// leaveRoom
export const leaveRoom = async () => {
  for (let key of ["audioTrack", "videoTrack", "screenTrack"]) {
    if (localTracks[key]) {
      localTracks[key].stop();
      localTracks[key].close();
      localTracks[key] = null;
    }
  }
  await rtcClient.leave();
  remoteUsers = {};
  console.log("👋 Left the room");
};

// toggleMic
export const toggleMic = async () => {
  if (!localTracks.audioTrack) {
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await rtcClient.publish([localTracks.audioTrack]);
    console.log("Mic enabled & published");
    return true;
  } else {
    if (localTracks.audioTrack._enabled) {
      await localTracks.audioTrack.setEnabled(false);
      localTracks.audioTrack._enabled = false;
      console.log("Mic disabled");
      return false;
    } else {
      await localTracks.audioTrack.setEnabled(true);
      localTracks.audioTrack._enabled = true;
      console.log("Mic enabled");
      return true;
    }
  }
};

export const createCameraTrack = async () => {
  if (localTracks.videoTrack) {
    localTracks.videoTrack.close();
  }
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  await rtcClient.publish([localTracks.videoTrack]);
  console.log("Camera track created and published");
  return localTracks.videoTrack;
};

export const closeCameraTrack = async () => {
  if (localTracks.videoTrack) {
    await rtcClient.unpublish([localTracks.videoTrack]);
    localTracks.videoTrack.stop(); 
    localTracks.videoTrack.close(); 
    localTracks.videoTrack = null;
    console.log("Camera track closed and unpublished");
  }
};

// toggleScreenShare
export const toggleScreenShare = async () => {
  if (!localTracks.screenTrack) {
    localTracks.screenTrack = await AgoraRTC.createScreenVideoTrack(
      {
        encoderConfig: "720p",
        optimizationMode: "detail",
      },
      "auto"
    );

    await rtcClient.publish([localTracks.screenTrack]);
    console.log("Screen sharing started & published");
    return true; 
  } else {
    await rtcClient.unpublish([localTracks.screenTrack]);
    localTracks.screenTrack.close();
    localTracks.screenTrack = null;
    console.log("Screen sharing stopped and unpublished.");
    return false;
  }
};

export const getRemoteUsers = () => Object.values(remoteUsers);
