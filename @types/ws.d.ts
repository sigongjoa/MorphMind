declare module 'ws' {
  import { EventEmitter } from 'events';
  
  class WebSocket extends EventEmitter {
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;

    constructor(address: string, protocols?: string | string[], options?: any);

    close(code?: number, reason?: string): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(data: any, options: any, cb?: (err?: Error) => void): void;

    readyState: number;
    bufferedAmount: number;
    extensions: string;
    protocol: string;
    url: string;
    binaryType: string;

    onopen: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;
  }

  export = WebSocket;
}
