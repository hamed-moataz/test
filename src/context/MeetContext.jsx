import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { decryptMeetToken } from "../page/crypto-utils";

const MeetContext = createContext();

export const MeetProvider = ({ children }) => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [authorized, setAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [workshop, setWorkshop] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const t = params.get("payload");

  const payloadData = useMemo(() => {
    if (!t) return null;
    try {
      return decryptMeetToken(t);
    } catch (e) {
      console.error("Decryption error:", e);
      return null;
    }
  }, [t]);
 useEffect(() => {
    const verifyPayload = async () => {
      if (!payloadData) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/agora/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload: t }),
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const workshopData = await res.json();
        console.log(workshopData , 'from api new')
        setWorkshop(workshopData);

const normalize = (v) => v === true || v === "true";

const isValid =
  normalize(workshopData?.lecture_uuid) &&
  normalize(workshopData?.user_uuid) &&
  normalize(workshopData?.is_host);



// console.log("lecture_uuid:", workshopData?.lecture_uuid, payloadData?.lecture_uuid);
// console.log("user_uuid:", workshopData?.user_uuid, payloadData?.user_uuid);
// console.log("is_host:", workshopData?.is_host);
// console.log("isValid result:", isValid);


        setAuthorized(isValid);
        setData(payloadData);
      } catch (err) {
        console.error("Verification error:", err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    verifyPayload();
  }, [payloadData, baseUrl]);

  return (
    <MeetContext.Provider
      value={{
        authorized,
        loading,
        data,
        workshop,
      }}
    >
      {children}
    </MeetContext.Provider>
  );
};

export const useMeet = () => useContext(MeetContext);
