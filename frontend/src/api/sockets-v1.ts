/* AUTO-GENERATED - do not edit */
import { io, Socket } from "socket.io-client";
import * as schemas from "./schemas";

export class SocketClientV1 {
  private socket: Socket;

  constructor(url: string, options: Parameters<typeof io>[1] = {}) {
    this.socket = io(url, options);
  }

  public connect(): void {
    this.socket.connect();
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public isConnected(): boolean {
    return this.socket.connected;
  }

  public onConnect(handler: () => void): void {
    this.socket.on("connect", handler);
  }

  public onDisconnect(handler: () => void): void {
    this.socket.on("disconnect", handler);
  }

  public onAny(handler: (event: string, ...args: unknown[]) => void): void {
    this.socket.onAny(handler);
  }

  public onError(handler: (err: Error) => void): void {
    this.socket.on("connect_error", handler);
  }

  /** client → server 'arc_width_update' */
  public emitArcWidthUpdate(payload: schemas.ArcWidthUpdatePayload): void {
    this.socket.emit("arc_width_update", payload);
  }

  /** server → client 'arc_width_update' */
  public onArcWidthUpdate(
    handler: (payload: schemas.ArcWidthUpdatePayload) => void
  ): void {
    this.socket.on("arc_width_update", (raw: unknown) => {
      try {
        handler(schemas.ArcWidthUpdatePayload.parse(raw));
      } catch (e) {
        console.error("Invalid payload for arc_width_update", e);
      }
    });
  }

  /**
   * emits 'get_state' and waits for server ack payload
   */
  public getState(): Promise<schemas.GetStatePayload> {
    return new Promise((resolve, reject) => {
      this.socket.emit("get_state", (res: unknown) => {
        try {
          const parsed = schemas.GetStatePayload.parse(res);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /** server → client 'get_state' */
  public onGetState(handler: (payload: schemas.GetStatePayload) => void): void {
    this.socket.on("get_state", (raw: unknown) => {
      try {
        handler(schemas.GetStatePayload.parse(raw));
      } catch (e) {
        console.error("Invalid payload for get_state", e);
      }
    });
  }

  /** client → server 'reset' */
  public emitReset(): void {
    this.socket.emit("reset");
  }

  /** server → client 'reset' */
  public onReset(handler: () => void): void {
    this.socket.on("reset", () => {
      try {
        handler();
      } catch (e) {
        console.error("Invalid payload for reset", e);
      }
    });
  }

  /** client → server 'select_county' */
  public emitSelectCounty(payload: schemas.SelectCountyPayload): void {
    this.socket.emit("select_county", payload);
  }

  /** server → client 'select_county' */
  public onSelectCounty(
    handler: (payload: schemas.SelectCountyBroadcastPayload) => void
  ): void {
    this.socket.on("select_county", (raw: unknown) => {
      try {
        handler(schemas.SelectCountyBroadcastPayload.parse(raw));
      } catch (e) {
        console.error("Invalid payload for select_county", e);
      }
    });
  }

  /** client → server 'start' */
  public emitStart(): void {
    this.socket.emit("start");
  }

  /** server → client 'start' */
  public onStart(handler: () => void): void {
    this.socket.on("start", () => {
      try {
        handler();
      } catch (e) {
        console.error("Invalid payload for start", e);
      }
    });
  }

  /** client → server 'stop' */
  public emitStop(): void {
    this.socket.emit("stop");
  }

  /** server → client 'stop' */
  public onStop(handler: () => void): void {
    this.socket.on("stop", () => {
      try {
        handler();
      } catch (e) {
        console.error("Invalid payload for stop", e);
      }
    });
  }

  /** client → server 'text_update' */
  public emitTextUpdate(payload: schemas.TextUpdatePayload): void {
    this.socket.emit("text_update", payload);
  }

  /** server → client 'text_update' */
  public onTextUpdate(
    handler: (payload: schemas.TextUpdatePayload) => void
  ): void {
    this.socket.on("text_update", (raw: unknown) => {
      try {
        handler(schemas.TextUpdatePayload.parse(raw));
      } catch (e) {
        console.error("Invalid payload for text_update", e);
      }
    });
  }

  /** server → client 'tick' */
  public onTick(handler: (payload: schemas.TickPayload) => void): void {
    this.socket.on("tick", (raw: unknown) => {
      try {
        handler(schemas.TickPayload.parse(raw));
      } catch (e) {
        console.error("Invalid payload for tick", e);
      }
    });
  }
}

export function createSocketClient(
  url: string,
  options: Parameters<typeof io>[1] = {}
) {
  return new SocketClientV1(url, options);
}
