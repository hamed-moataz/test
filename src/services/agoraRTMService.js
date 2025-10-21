// services/agoraRTMService.js
import AgoraRTM from "agora-rtm-sdk";

let rtmClient = null;
let rtmChannel = null;
let selfUid = null;


export const initRTM = async (appId, uid, rtmToken, { name, host } = {}) => {
  selfUid = String(uid);
  rtmClient = AgoraRTM.createInstance(appId);
  await rtmClient.login({ uid: selfUid, token: rtmToken });

  const attrs = {};
  if (name != null) attrs.name = String(name);
  if (host != null) attrs.host = String(!!host);
  if (Object.keys(attrs).length) {
    await rtmClient.addOrUpdateLocalUserAttributes(attrs);
  }

  return rtmClient;
};


export const joinRTMChannel = async (channelName, onMessage, onPresence) => {
  if (!rtmClient) throw new Error("RTM client not initialized");

  rtmChannel = await rtmClient.createChannel(String(channelName));

  rtmChannel.on("ChannelMessage", async (message, memberId) => {
    try {
      const payload = JSON.parse(message.text);
      onMessage?.(payload, memberId);

      if (payload?.type === "intro" && payload.uid) {
        onPresence?.({
          id: String(payload.uid),
          name: payload.name ?? String(payload.uid),
          host: !!payload.host,
          type: "join",
        });
      }
    } catch {
      onMessage?.({ text: message.text }, memberId);
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
      onPresence?.({ id: String(memberId), name: String(memberId), host: false, type: "join" });
    }
  });

  rtmChannel.on("MemberLeft", (memberId) => {
    onPresence?.({ id: String(memberId), name: String(memberId), host: false, type: "leave" });
  });

  await rtmChannel.join();

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
  } catch {}

  try {
    const myAttrs = await rtmClient.getLocalUserAttributes();
    await sendRTMMessage({
      type: "intro",
      uid: selfUid,
      name: myAttrs?.name ?? selfUid,
      host: myAttrs?.host === "true",
      ts: Date.now(),
    });
  } catch {}

  return rtmChannel;
};

export const sendRTMMessage = async (payload) => {
  if (!rtmChannel) throw new Error("RTM channel not joined");
  await rtmChannel.sendMessage({ text: JSON.stringify(payload) });
};

export const leaveRTM = async () => {
  try { await rtmChannel?.leave(); } catch {}
  try { await rtmClient?.logout(); } catch {}
  rtmChannel = null;
  rtmClient = null;
  selfUid = null;
};
