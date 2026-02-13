import { socket } from "@/lib/sockets";
import { useEffect, useState } from "react";

export const SimpleDemo = () => {
  const [status, setStatus] = useState<"stopped" | "running">("stopped");
  const [tickCount, setTickCount] = useState(0);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncedText, setSyncedText] = useState("");

  useEffect(() => {
    socket.onTick((payload) => {
      setLastTimestamp(payload.timestamp);
      setTickCount((prev) => prev + 1);
    });
    socket.onTextUpdate((payload) => setSyncedText(payload.text));
    socket.onConnect(() => {
      setIsConnected(true);
      socket
        .getState()
        .then((state) => {
          setStatus(state.status as "stopped" | "running");
          if (typeof state.text === "string") setSyncedText(state.text);
        })
        .catch(() => setStatus("stopped"));
    });
    socket.onStart(() => setStatus("running"));
    socket.onStop(() => setStatus("stopped"));
    socket.onReset(() => {
      socket.getState().then((state) => {
        setStatus(state.status as "stopped" | "running");
        if (typeof state.text === "string") setSyncedText(state.text);
      });
      setTickCount(0);
    });
    socket.onError((err) => {
      console.error("Socket error:", err);
      setIsConnected(false);
    });
    socket.onDisconnect(() => {
      setIsConnected(false);
    });

    socket.connect();
    return () => void socket.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">ZRSA OVE Demo</h1>
      <p className="text-2xl">Status: {status}</p>
      <p className="text-2xl">Tick Count: {tickCount}</p>
      <p className="text-2xl">Last Timestamp: {lastTimestamp}</p>
      <p className="text-2xl">Is Connected: {isConnected ? "Yes" : "No"}</p>

      <div className="w-full max-w-md px-4">
        <label className="mb-1 block text-sm text-gray-300">
          Synced text (shared across browsers in same room)
        </label>
        <input
          type="text"
          value={syncedText}
          onChange={(e) => {
            const value = e.target.value;
            setSyncedText(value);
            socket.emitTextUpdate({ text: value });
          }}
          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
          placeholder="Type here..."
        />
      </div>

      <div className="flex items-center justify-center">
        <button
          className="rounded-md bg-blue-500 p-2 text-white"
          onClick={() => socket.emitStart()}
          disabled={status === "running"}
        >
          Start
        </button>
        <button
          disabled={status === "stopped"}
          className="rounded-md bg-red-500 p-2 text-white"
          onClick={() => socket.emitStop()}
        >
          Stop
        </button>
        <button
          className="rounded-md bg-gray-500 p-2 text-white"
          onClick={() => {
            socket.emitReset();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
