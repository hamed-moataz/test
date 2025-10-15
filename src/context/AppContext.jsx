import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const [data, setData] = useState([]);

const fetchData = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/agora/get-nextworkshop`);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const result = await res.json();
    console.log("Fetched workshop:", result);
    setData(result);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  return <AppContext.Provider value={{ data }}>{children}</AppContext.Provider>;
};
