import WebSocket from 'ws';
import { EventEmitter } from 'events';
import '../types/audio';

export interface AudioChunk {
  sessionId: string;
  timestamp: number;
  data: Buffer;
  format?: string;
  sampleRate?: number;
  channels?: number;
}

export interface ClientConnection {
  id: string;
  ws: WebSocket;
  sessionId: string;
  isConnected: boolean;
  lastActivity: number;
}

export class AudioStreamService extends EventEmitter {
  private wss: WebSocket.Server;
  private connections: Map<string, ClientConnection> = new Map();
  private port: number;

  constructor(port: number = 8080) {
    super();
    this.port = port;
    this.wss = new WebSocket.Server({ 
      port,
      perMessageDeflate: false // Disable compression for audio data
    });
    
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const sessionId = this.extractSessionId(req) || this.generateSessionId();
      
      const connection: ClientConnection = {
        id: clientId,
        ws,
        sessionId,
        isConnected: true,
        lastActivity: Date.now()
      };

      this.connections.set(clientId, connection);
      
      console.log(`Client connected: ${clientId} (Session: ${sessionId})`);
      this.emit('clientConnected', connection);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        sessionId,
        timestamp: Date.now()
      }));

      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(connection, data);
      });

      ws.on('close', (code: number, reason: Buffer) => {
        this.handleDisconnection(connection, code, reason);
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.emit('clientError', connection, error);
      });

      // Set up ping/pong for connection health
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
        connection.lastActivity = Date.now();
      });
    });

    // Set up ping interval for connection health monitoring
    setInterval(() => {
      this.connections.forEach((connection) => {
        if (!connection.ws.isAlive) {
          console.log(`Terminating inactive connection: ${connection.id}`);
          connection.ws.terminate();
          this.connections.delete(connection.id);
          return;
        }
        
        connection.ws.isAlive = false;
        connection.ws.ping();
      });
    }, 30000); // Ping every 30 seconds

    console.log(`AudioStreamService listening on port ${this.port}`);
  }

  private handleMessage(connection: ClientConnection, data: WebSocket.Data): void {
    connection.lastActivity = Date.now();

    try {
      // Try to parse as JSON first (control messages)
      const message = JSON.parse(data.toString());
      
      if (message.type === 'audio') {
        // Audio data should be sent as binary, not JSON
        console.warn('Received audio data as JSON - consider sending as binary');
        this.emit('audioData', {
          sessionId: connection.sessionId,
          timestamp: Date.now(),
          data: Buffer.from(message.data, 'base64'),
          format: message.format,
          sampleRate: message.sampleRate,
          channels: message.channels
        } as AudioChunk);
      } else {
        // Handle control messages
        this.emit('controlMessage', connection, message);
      }
    } catch (error) {
      // If JSON parsing fails, treat as binary audio data
      if (Buffer.isBuffer(data)) {
        const audioChunk: AudioChunk = {
          sessionId: connection.sessionId,
          timestamp: Date.now(),
          data: data
        };
        
        this.emit('audioData', audioChunk);
      } else {
        console.error('Failed to parse message:', error);
      }
    }
  }

  private handleDisconnection(connection: ClientConnection, code: number, reason: Buffer): void {
    connection.isConnected = false;
    this.connections.delete(connection.id);
    
    console.log(`Client disconnected: ${connection.id} (Code: ${code}, Reason: ${reason.toString()})`);
    this.emit('clientDisconnected', connection, code, reason);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractSessionId(req: any): string | null {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    return url.searchParams.get('sessionId') || url.searchParams.get('session');
  }

  // Public methods
  public broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.connections.forEach((connection) => {
      if (connection.isConnected && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      }
    });
  }

  public sendToClient(clientId: string, message: any): boolean {
    const connection = this.connections.get(clientId);
    if (connection && connection.isConnected && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }

  public sendToSession(sessionId: string, message: any): number {
    let sentCount = 0;
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.connections.forEach((connection) => {
      if (connection.sessionId === sessionId && 
          connection.isConnected && 
          connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
        sentCount++;
      }
    });
    
    return sentCount;
  }

  public getConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getConnectionsBySession(sessionId: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      connection => connection.sessionId === sessionId
    );
  }

  public close(): void {
    this.connections.forEach((connection) => {
      connection.ws.close();
    });
    this.wss.close();
    console.log('AudioStreamService closed');
  }
}

