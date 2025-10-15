import React, { useRef, useEffect, useState } from "react";

export default function VideoGrid({ joined, children }) {
  const displayRef = useRef(null);
  const streamsRef = useRef(null);
  const [activeVideoId, setActiveVideoId] = useState(null);

  useEffect(() => {
    displayRef.current = document.getElementById("stream__box");
    streamsRef.current = document.getElementById("streams__container");
  }, []);

  const handleExpandVideo = (videoElement) => {
    if (!displayRef.current || !streamsRef.current) return;

    const existing = displayRef.current.children[0];
    if (existing) streamsRef.current.appendChild(existing);

    displayRef.current.appendChild(videoElement);
    setActiveVideoId(videoElement.id);

    // تصغير باقي الفيديوهات
    const allVideos = streamsRef.current.querySelectorAll(".video__container");
    allVideos.forEach((v) => {
      if (v.id !== videoElement.id) {
        v.classList.remove("w-72", "h-72");
        v.classList.add("w-24", "h-24");
      }
    });
  };

  const handleHideDisplay = () => {
    if (!displayRef.current || !streamsRef.current) return;

    const child = displayRef.current.children[0];
    if (child) streamsRef.current.appendChild(child);

    const allVideos = streamsRef.current.querySelectorAll(".video__container");
    allVideos.forEach((v) => {
      v.classList.remove("w-24", "h-24");
      v.classList.add("w-72", "h-72");
    });

    setActiveVideoId(null);
  };

  useEffect(() => {
    if (!streamsRef.current) return;
    const videoContainers =
      streamsRef.current.querySelectorAll(".video__container");

    videoContainers.forEach((v) => {
      v.onclick = () => handleExpandVideo(v);
    });

    if (displayRef.current) {
      displayRef.current.onclick = handleHideDisplay;
    }
  }, [children]);

  return (
    <div className="flex flex-col gap-4 w-full h-screen ">
 
      <div
        id="stream__box"
        className="bg-gray-800 rounded-lg h-full flex items-center justify-center text-gray-400 "
      >
        {!activeVideoId && <p className="">{joined ? "" : "Stream Not Started"}</p>}
 
        <div
          id="streams__container"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-center justify-center"
        >
          {children ? (
            children
          ) : (
            <div className="text-gray-400">No streams</div>
          )}
        </div>
      </div>
    </div>
  );
}
