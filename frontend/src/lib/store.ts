import { create } from "zustand";
import { combine } from "zustand/middleware";

import { logger } from "@/lib/logger.ts";
import { socket } from "@/lib/sockets.ts";

export type Status = "stopped" | "running";

type State = {
  status: Status;
  timestamp: Date | null;
};

const initialState: State = {
  status: "stopped",
  timestamp: new Date(Date.parse("2022-11-01T00:00:00.000Z")),
};

function applyStatePayload(setState: (s: Partial<State>) => void, state: { status: string; timestamp: string }) {
  setState({
    status: state.status as Status,
    timestamp: new Date(Date.parse(state.timestamp)),
  });
}

export const useStore = create(
  combine(initialState, (setState, _getState) => {
    socket.onConnect(() => logger.info("Connected"));
    socket.onDisconnect(() => logger.info("Disconnected"));
    socket.onTick((payload) => setState({ timestamp: new Date(Date.parse(payload.timestamp)) }));
    socket.onStop(() => setState({ status: "stopped" }));
    socket.onStart(() => setState({ status: "running" }));
    socket.onReset(async () => {
      const state = await socket.getState();
      applyStatePayload(setState, state);
    });

    return {
      loadState: async () => {
        const state = await socket.getState();
        applyStatePayload(setState, state);
      },
      start: () => socket.emitStart(),
      stop: () => socket.emitStop(),
      reset: () => socket.emitReset(),
    };
  }),
);