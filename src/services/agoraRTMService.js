// services/agoraRTMService.js
import AgoraRTM from "agora-rtm-sdk";

let rtmClient = null;
let rtmChannel = null;
let selfUid = null;

let rtmLoggedIn = false;
let rtmInChannel = false;
let rtmLeaving = false;

const now = () => Date.now();
const ensureClient = () => {
  if (!rtmClient) throw new Error("RTM client not initialized");
};
const ensureChannel = () => {
  if (!rtmChannel) throw new Error("RTM channel not joined");
};

export const initRTM = async (appId, uid, rtmToken, { name, host } = {}) => {
  selfUid = String(uid);
  rtmClient = AgoraRTM.createInstance(appId);
  await rtmClient.login({ uid: selfUid, token: rtmToken });
  rtmLoggedIn = true;

  const attrs = {};
  if (name != null) attrs.name = String(name);
  if (host != null) attrs.host = String(!!host);
  if (Object.keys(attrs).length) {
    await rtmClient.addOrUpdateLocalUserAttributes(attrs);
  }

  return rtmClient;
};

export const sendRTMControl = async (control) => {
  ensureChannel();
  const payload = {
    category: "control",
    ...control,
    by: selfUid,
    ts: now(),
  };
  await rtmChannel.sendMessage({ text: JSON.stringify(payload) });
};

export const sendKickUser = async (userIdToKick) => {
  ensureClient();
  const target = String(userIdToKick);
  if (target === selfUid) return;

  const payload = {
    category: "control",
    type: "kick-user",
    target,
    by: selfUid,
    ts: now(),
  };

  await rtmClient.sendMessageToPeer({ text: JSON.stringify(payload) }, target);
};

export const sendMuteAll = async () => sendRTMControl({ type: "mute-all" });
export const sendUnmuteAll = async () => sendRTMControl({ type: "unmute-all" });
export const sendEndMeeting = async () => sendRTMControl({ type: "end-meeting" });

export const joinRTMChannel = async (
  channelName,
  onMessage,
  onPresence,
  onControl
) => {
  ensureClient();

  rtmChannel = await rtmClient.createChannel(String(channelName));

  rtmChannel.on("ChannelMessage", async (message, memberId) => {
    let payload;
    try {
      payload = JSON.parse(message.text);
    } catch {
      onMessage?.({ text: message.text }, memberId);
      if (message.text === "END_MEETING") {
        onControl?.({ type: "end-meeting", by: memberId, ts: now() });
      }
      return;
    }

    if (payload?.category === "control") {
      onControl?.({
        type: String(payload.type || ""),
        by: String(payload.by || memberId),
        ts: Number(payload.ts || now()),
        target: payload.target ? String(payload.target) : undefined,
      });
      return;
    }

    if (payload?.type === "intro" && payload.uid) {
      onPresence?.({
        id: String(payload.uid),
        name: payload.name ?? String(payload.uid),
        host: !!payload.host,
        type: "join",
      });
      return;
    }

    onMessage?.(payload, memberId);
  });

  rtmClient.on("MessageFromPeer", (message, peerId) => {
    try {
      const payload = JSON.parse(message.text);
      if (payload?.category === "control") {
        onControl?.({
          type: String(payload.type || ""),
          by: String(payload.by || peerId),
          ts: Number(payload.ts || now()),
          target: payload.target ? String(payload.target) : undefined,
        });
      }
    } catch (e) {
      console.log(e)
    }
  });

  rtmChannel.on("MemberJoined", async (memberId) => {
    try {
      const attrs = await rtmClient.getUserAttributes(memberId);
      onPresence?.({
        id: String(memberId),
        name: attrs?.name ?? String(memberId),
        host: attrs?.host === "true",
        type: "join",
      });
    } catch {
      onPresence?.({
        id: String(memberId),
        name: String(memberId),
        host: false,
        type: "join",
      });
    }
  });

  rtmChannel.on("MemberLeft", (memberId) => {
    onPresence?.({
      id: String(memberId),
      name: String(memberId),
      host: false,
      type: "leave",
    });
  });

  await rtmChannel.join();
  rtmInChannel = true; 

  try {
    const members = await rtmChannel.getMembers();
    for (const mid of members) {
      const id = String(mid);
      try {
        const attrs = await rtmClient.getUserAttributes(id);
        onPresence?.({
          id,
          name: attrs?.name ?? id,
          host: attrs?.host === "true",
          type: "join",
        });
      } catch {
        onPresence?.({ id, name: id, host: false, type: "join" });
      }
    }
  } catch (e) {
    console.log(e);
  }

  try {
    const myAttrs = await rtmClient.getLocalUserAttributes();
    await sendRTMMessage({
      type: "intro",
      uid: selfUid,
      name: myAttrs?.name ?? selfUid,
      host: myAttrs?.host === "true",
      ts: now(),
    });
  } catch (e) {
    console.log(e);
  }

  return rtmChannel;
};

export const sendRTMMessage = async (payload) => {
  ensureChannel();
  await rtmChannel.sendMessage({ text: JSON.stringify(payload) });
};

export const leaveRTM = async () => {
  if (rtmLeaving) return;
  rtmLeaving = true;

  try {
    if (rtmInChannel && rtmChannel) {
      try {
        await rtmChannel.leave();
      } catch (e) {
        console.log("[RTM] leave channel error (ignored):", e?.message || e);
      }
    }
  } finally {
    rtmInChannel = false;
    rtmChannel = null;
  }

  try {
    if (rtmLoggedIn && rtmClient) {
      try {
        await rtmClient.logout();
      } catch (e) {
        console.log("[RTM] logout error (ignored):", e?.message || e);
      }
    }
  } finally {
    rtmLoggedIn = false;
    rtmClient = null;
    selfUid = null;
    rtmLeaving = false;
  }
};

export const isSelfHost = async () => {
  try {
    ensureClient();
    const myAttrs = await rtmClient.getLocalUserAttributes();
    return myAttrs?.host === "true";
  } catch {
    return false;
  }
};
