import WebSocket from 'ws';

// Extend WebSocket interface to include isAlive property
declare module 'ws' {
  interface WebSocket {
    isAlive?: boolean;
  }
}
