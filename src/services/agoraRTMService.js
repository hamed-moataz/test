// import AgoraRTM from "agora-rtm-sdk-ng";

// export const rtmClient = AgoraRTM.createInstance(import.meta.env.VITE_AGORA_APP_ID);
// export let rtmChannel = null;

// export const initRTM = async (uid, channelName, onMessage) => {
//   await rtmClient.login({ uid: String(uid) });
//   rtmChannel = await rtmClient.createChannel(channelName);
//   await rtmChannel.join();

//   rtmChannel.on("ChannelMessage", (message, senderId) => {
//     const data = JSON.parse(message.text);
//     onMessage(data, senderId);
//   });

//   console.log("✅ RTM connected!");
// };

// export const sendRTMMessage = async (data) => {
//   if (!rtmChannel) return;
//   await rtmChannel.sendMessage({ text: JSON.stringify(data) });
// };
