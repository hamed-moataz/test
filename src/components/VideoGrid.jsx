import React, { useRef} from "react";

export default function VideoGrid({ joined, children, fullBleed  }) {
  const containerRef = useRef(null);
  return (
    <div className="flex flex-col gap-4 w-full h-screen">
      <div
        ref={containerRef}
        className={`bg-gray-800 rounded-lg h-full text-gray-400 w-[380px] mx-auto sm:w-full ${
          fullBleed
            ? "flex items-stretch justify-stretch p-0"   
            : "flex items-center justify-center p-3"     
        }`}
      >
        {fullBleed ? (
          <div className="relative w-full h-full ">{children}</div>
        ) : (
          <>
            {!children && (
              <p className="pointer-events-none">
                {joined ? "" : "Stream Not Started"}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 place-content-center w-full overflow-y-auto overflow-x-hidden">
              {children ? children : <div className="text-gray-400">No streams</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
