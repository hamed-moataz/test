import React, { useEffect, useState } from "react";
import Header from "../components/Header";
// import LobbyForm from "../components/LobbyForm";
import { useLocation } from "react-router-dom";
import { decrypt } from "n-krypta";
import { useMemo } from 'react';
import { decryptMeetToken } from './crypto-utils';
const Lobby = () => {


   const params = new URLSearchParams(window.location.search);
  const t = params.get('payload');
  console.log(t , 'from lobby')

  const data = useMemo(() => {
    if (!t) return null;
    try {
      return decryptMeetToken(t);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [t]);
  console.log(data , 'from api')

  if (!t) return <div>Missing token.</div>;
  if (!data) return <div>Invalid or expired token.</div>;
  const key = import.meta.env.VITE_APP_KEY;

  const location = useLocation();
  const [payloadRaw, setPayloadRaw] = useState(null);
  const [decrypted, setDecrypted] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const test =
      "eyJpdiI6IlNJVHFoTGZkSlVaekQrNnR1Rk1yS2c9PSIsInZhbHVlIjoiemhtYmVXeTZnNklzVUFPbDBjV0ZtakRQWWZ2anlkTkRwRXhQY2FqcDB2M1NLbGViQzNHcDVyaHVMVmNadU5Mckk4UzBTVVVWT3hneW9WZ3VrNVI1TE9WVExMdHNrcEk0VXdSYmUzdW1iR2E3dEpTcjArUWsrdFd3NkV4MElQQ2RqUHF6WExZcFlEWE5qYWgwNmZWSUw0Z0JzWk9HUXFsT2lNamtzU0dVMnVLZ3JEUTBiUzBBeEpTMHZFdWhjS3Z6dFpYanJ2a0NOS3JBZ2JTTk9TbkUrVFRMMmtBenZGVXdqbDhQVUw5aE01TWJDU2hLNWxoVlMxTEZNY3hYUHp5RlphM2ZEZzg1Tnh1MmRHaklIdVhzRUVBL2pLNUtRUS9PdGZhR21ZTGpwaUE4S1dIN2R4SkhTVTZmKzBMT244b3pLYmxvTHIvaDNaWnN1TThRaHdhRXkzcXpBamlCTlpWc3QwZEZwWjM3MCswPSIsIm1hYyI6IjI2ODU5N2MwODRjZTNkMzhlMDEyYmNkMzlkYTMzMDdhOWI0ZjVhODk1MjRkMWM2ODA5YjA4ZWI2MzE2N2YzZTgiLCJ0YWciOiIifQ==";

    try {
      const decrypted = decrypt(test, key);
      console.log("✅ Decrypted text:", decrypted);

      try {
        // لو البيانات كانت JSON
        const json = JSON.parse(decrypted);
        console.log("✅ Parsed JSON:", json);
      } catch {
        // لو مجرد نص عادي
        console.log("📜 Decrypted (plain text):", decrypted);
      }
    } catch (err) {
      console.error("❌ Error decrypting:", err);
    }
  }, [key]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payload = params.get("payload");
    console.log(payload, "payload from server");

    if (!payload) return;

    setPayloadRaw(payload);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 🟢 أضف الكود ده قبل decrypt
        let cleanPayload = payload;

        // لو الـ payload جاية محاطة بعلامات اقتباس (single quotes) نشيلها بس
        if (cleanPayload.startsWith("'") && cleanPayload.endsWith("'")) {
          cleanPayload = cleanPayload.slice(1, -1);
        }

        // لو السيرفر عمل encodeURIComponent
        try {
          cleanPayload = decodeURIComponent(cleanPayload);
        } catch (e) {
          console.warn("decode failed:", e);
        }

        // فك التشفير
        const plain = decrypt(cleanPayload, key);
        console.log(plain, "plain test");

        let parsed;
        try {
          parsed = JSON.parse(plain);
          console.log(parsed, "json parsed");
        } catch {
          parsed = plain;
        }

        setDecrypted(parsed);
      } catch (err) {
        console.error("decrypt error:", err);
        setError("فشل فك التشفير — تأكد من payload والمفتاح (key).");
        setDecrypted(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  return (
    <div className="bg-[var(--color-primary)] min-h-screen text-white">
      <Header />
      <main className="pt-24">
        {/* <LobbyForm /> */}

        <div className="p-4">
          <h2 className="text-lg font-semibold">Debug Info:</h2>
          <p><b>Payload:</b> {payloadRaw}</p>
          {loading && <p>جاري فك التشفير...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {decrypted && (
            <pre className="bg-black/30 p-3 rounded mt-2">
              {typeof decrypted === "string"
                ? decrypted
                : JSON.stringify(decrypted, null, 2)}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
};

export default Lobby;
