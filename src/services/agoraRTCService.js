// services/agoraRTCService.js
import AgoraRTC from "agora-rtc-sdk-ng";

let rtcClient = null;
let isJoined = false;

// ===== Screen Share State & Subscriptions =====
let screenSharerUid = null;
const screenShareListeners = new Set();
const notifyScreenShareChange = () => {
  for (const fn of screenShareListeners) {
    try { fn(screenSharerUid); } catch (e) { console.log(e); }
  }
};

export let localTracks = {
  audioTrack: null,
  videoTrack: null,
  screenTrack: null,
};

let remoteUsers = {};

let rosterChangedCb = () => {};
export const onRemoteRosterChanged = (cb) => {
  rosterChangedCb = typeof cb === "function" ? cb : () => {};
};

// ===== Screen Share APIs =====
export const getScreenSharer = () => screenSharerUid;
export const canStartScreenShare = (selfId) =>
  !screenSharerUid || String(screenSharerUid) === String(selfId);

export const subscribeScreenShare = (cb) => {
  if (typeof cb === "function") screenShareListeners.add(cb);
  return () => screenShareListeners.delete(cb);
};

// ===== Client Init & Events =====
export const initRTCClient = (onUserJoined, onUserLeft) => {
  rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  rtcClient.on("user-joined", (user) => {
    try {
      const uid = String(user.uid);
      remoteUsers[uid] = remoteUsers[uid] || { uid };
    } catch (e) {
      console.warn("[RTC] user-joined tracking error:", e);
    }
    onUserJoined?.(Object.values(remoteUsers));
    rosterChangedCb?.();
  });

  rtcClient.on("user-published", async (user, mediaType) => {
    await rtcClient.subscribe(user, mediaType);

    const uid = String(user.uid);
    remoteUsers[uid] = remoteUsers[uid] || { uid };

    // detect screen share
    let isScreen = mediaType === "screen";
    if (!isScreen && mediaType === "video" && user.videoTrack) {
      const msTrack = user.videoTrack.getMediaStreamTrack?.();
      const label =
        msTrack?.label?.toLowerCase?.() ||
        user.videoTrack.getTrackLabel?.()?.toLowerCase?.() ||
        "";
      isScreen = /screen|window|display/.test(label);
    }

    if (isScreen && user.videoTrack) {
      screenSharerUid = uid;
      notifyScreenShareChange();
      const tryPlay = () => {
        const el =
          document.getElementById(`player-screen-${uid}`) ||
          document.getElementById(`player-${uid}`);
        if (el) user.videoTrack.play(el);
        else setTimeout(tryPlay, 80);
      };
      tryPlay();
      remoteUsers[uid].videoTrack = user.videoTrack;
    } else if (mediaType === "video" && user.videoTrack) {
      const camEl = document.getElementById(`player-${uid}`);
      if (camEl) user.videoTrack.play(camEl);
      remoteUsers[uid].videoTrack = user.videoTrack;
    }

    if (mediaType === "audio" && user.audioTrack) {
      user.audioTrack.play();
      remoteUsers[uid].audioTrack = user.audioTrack;
    }

    onUserJoined?.(Object.values(remoteUsers));
    rosterChangedCb?.();
  });

  rtcClient.on("user-unpublished", (user, mediaType) => {
    const uid = String(user.uid);
    const ru = remoteUsers[uid];

    if (ru) {
      if (mediaType === "audio" && ru.audioTrack) {
        try { ru.audioTrack.stop(); } catch(e) {
          console.log(e)
        }
        ru.audioTrack = null;
      }
      if (mediaType === "video" && ru.videoTrack) {
        try { ru.videoTrack.stop(); } catch(e) {
          console.log(e)
        }
        ru.videoTrack = null;
      }
    }

    if (String(screenSharerUid) === uid) {
      screenSharerUid = null;
      notifyScreenShareChange();
    }

    onUserJoined?.(Object.values(remoteUsers));
    rosterChangedCb?.();
  });

  rtcClient.on("user-left", (user) => {
    const uid = String(user.uid);

    const ru = remoteUsers[uid];
    if (ru?.audioTrack) { try { ru.audioTrack.stop(); } catch(e) {
          console.log(e)
        } }
    if (ru?.videoTrack) { try { ru.videoTrack.stop(); } catch(e) {
          console.log(e)
        } }
    delete remoteUsers[uid];

    if (String(screenSharerUid) === uid) {
      screenSharerUid = null;
      notifyScreenShareChange();
    }

    onUserLeft?.(Object.values(remoteUsers));
    rosterChangedCb?.();
  });
};

// ===== Join 
export const joinRoom = async (appId, channel, uid, token) => {
  if (!rtcClient) throw new Error("RTC client not initialized");
  await rtcClient.join(appId, channel, token, uid);
  isJoined = true;
};

export const leaveRoom = async () => {
  for (let key of ["audioTrack", "videoTrack", "screenTrack"]) {
    if (localTracks[key]) {
      try { localTracks[key].stop?.(); localTracks[key].close?.(); } catch (e) { console.log(e); }
      localTracks[key] = null;
    }
  }
  try {
    await rtcClient.leave();
    // await leaveRTM();
  } catch (e) {
    console.log(e);
  }

  for (const uid of Object.keys(remoteUsers)) {
    const ru = remoteUsers[uid];
    if (ru?.audioTrack) { try { ru.audioTrack.stop(); } catch(e) {
          console.log(e)
        } }
    if (ru?.videoTrack) { try { ru.videoTrack.stop(); } catch(e) {
          console.log(e)
        } }
  }
  remoteUsers = {};
  isJoined = false;

  if (screenSharerUid !== null) {
    screenSharerUid = null;
    notifyScreenShareChange();
  }

  rosterChangedCb?.();
};

// ===== Local Media Toggles =====
export const toggleMic = async () => {
  if (!isJoined) {
    console.warn("toggleMic called before join completed");
    throw new Error("Not joined yet");
  }

  const getMS = (t) => t?.getMediaStreamTrack?.() || t?.getTrack || null;

  const needNewTrack =
    !localTracks.audioTrack ||
    getMS(localTracks.audioTrack)?.readyState === "ended";

  if (needNewTrack) {
    try {
      try { localTracks.audioTrack?.stop?.(); localTracks.audioTrack?.close?.(); } catch (e) { console.log(e); }
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await localTracks.audioTrack.setEnabled(true);
      try { await rtcClient.publish([localTracks.audioTrack]); } catch (e) { console.log(e); }
      return true;
    } catch (e) {
      console.error("toggleMic: create/publish mic failed", e);
      return false;
    }
  }

  const ms = getMS(localTracks.audioTrack);
  const currentlyEnabled =
    typeof localTracks.audioTrack.isEnabled === "function"
      ? await localTracks.audioTrack.isEnabled()
      : typeof ms?.enabled === "boolean"
      ? ms.enabled
      : true;

  const target = !currentlyEnabled;

  try {
    await localTracks.audioTrack.setEnabled(target);
    if (target) {
      try { await rtcClient.publish([localTracks.audioTrack]); } catch (e) { console.log(e); }
    }
    return target;
  } catch (e) {
    console.error("toggleMic: setEnabled failed", e);
    return currentlyEnabled;
  }
};

export const setMicMuted = async (muted) => {
  if (!isJoined) return;
  if (!localTracks.audioTrack) return;
  try {
    await localTracks.audioTrack.setEnabled(!muted);
  } catch (e) {
    console.error("setMicMuted failed:", e);
  }
};

export const muteMic = async (muted = true) => setMicMuted(muted);

export const createCameraTrack = async () => {
  if (!isJoined) throw new Error("Not joined yet");
  if (localTracks.videoTrack) {
    try { localTracks.videoTrack.close(); } catch (e) { console.log(e); }
  }
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  await rtcClient.publish([localTracks.videoTrack]);
  return localTracks.videoTrack;
};

export const closeCameraTrack = async () => {
  if (localTracks.videoTrack) {
    try { await rtcClient.unpublish([localTracks.videoTrack]); } catch (e) { console.log(e); }
    try { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); } catch (e) { console.log(e); }
    localTracks.videoTrack = null;
  }
};

export const toggleScreenShare = async () => {
  if (!isJoined) throw new Error("Not joined yet");

  if (!localTracks.screenTrack) {
    localTracks.screenTrack = await AgoraRTC.createScreenVideoTrack(
      { encoderConfig: "720p", optimizationMode: "detail" },
      "auto"
    );
    await rtcClient.publish([localTracks.screenTrack]);

    screenSharerUid = String(rtcClient.uid);
    notifyScreenShareChange();
    return true;
  } else {
    try { await rtcClient.unpublish([localTracks.screenTrack]); } catch (e) { console.log(e); }
    try { localTracks.screenTrack.close(); } catch (e) { console.log(e); }
    localTracks.screenTrack = null;

    screenSharerUid = null;
    notifyScreenShareChange();
    return false;
  }
};

// ===== Roles & Volume =====
export const setRoleToHost = async () => {
  if (rtcClient) await rtcClient.setClientRole("host");
};

export const subscribeVolume = (handler) => {
  if (!rtcClient) return;
  try {
    rtcClient.enableAudioVolumeIndicator();
    rtcClient.on("volume-indicator", handler);
  } catch (e) {
    console.warn("subscribeVolume error:", e);
  }
};

// ===== Helpers =====
export const getRemoteUsers = () => Object.values(remoteUsers);

export const removeRemoteUser = (uid) => {
  const id = String(uid);
  const ru = remoteUsers[id];
  if (ru?.audioTrack) { try { ru.audioTrack.stop(); } catch(e) {
          console.log(e)
        } }
  if (ru?.videoTrack) { try { ru.videoTrack.stop(); } catch(e) {
          console.log(e)
        } }
  delete remoteUsers[id];
  if (String(screenSharerUid) === id) {
    screenSharerUid = null;
    notifyScreenShareChange();
  }
  rosterChangedCb?.();
};
