import React, { useEffect, useState } from "react";
import Header from "../components/Header";
// import LobbyForm from "../components/LobbyForm";
import { useLocation } from "react-router-dom";
import { decrypt } from "n-krypta";

const Lobby = () => {
  const key = import.meta.env.VITE_APP_KEY;

  const location = useLocation();
  const [payloadRaw, setPayloadRaw] = useState(null);
  const [decrypted, setDecrypted] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
