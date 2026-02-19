import { AudioStreamService, AudioChunk } from './services/AudioStreamService';

const PORT = parseInt(process.env.PORT || '8080', 10);

// Create and start the audio streaming service
const audioService = new AudioStreamService(PORT);

// Set up event handlers
audioService.on('clientConnected', (connection) => {
  console.log(`✅ Client connected: ${connection.id} (Session: ${connection.sessionId})`);
});

audioService.on('clientDisconnected', (connection, code, reason) => {
  console.log(`❌ Client disconnected: ${connection.id} (Code: ${code})`);
});

audioService.on('audioData', (audioChunk: AudioChunk) => {
  console.log(`🎵 Received audio chunk: ${audioChunk.data.length} bytes from session ${audioChunk.sessionId}`);
  
  // TODO: Process audio data here
  // - Forward to analysis engine
  // - Store temporarily
  // - Apply real-time processing
});

audioService.on('controlMessage', (connection, message) => {
  console.log(`📝 Control message from ${connection.id}:`, message);
  
  // Handle different control message types
  switch (message.type) {
    case 'start':
      console.log(`🎬 Session ${connection.sessionId} started streaming`);
      connection.ws.send(JSON.stringify({
        type: 'ack',
        message: 'Streaming started',
        timestamp: Date.now()
      }));
      break;
      
    case 'stop':
      console.log(`⏹️ Session ${connection.sessionId} stopped streaming`);
      connection.ws.send(JSON.stringify({
        type: 'ack',
        message: 'Streaming stopped',
        timestamp: Date.now()
      }));
      break;
      
    case 'config':
      console.log(`⚙️ Configuration for session ${connection.sessionId}:`, message.config);
      break;
      
    default:
      console.log(`❓ Unknown message type: ${message.type}`);
  }
});

audioService.on('clientError', (connection, error) => {
  console.error(`🚨 Error from client ${connection.id}:`, error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  audioService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down gracefully...');
  audioService.close();
  process.exit(0);
});

console.log(`🚀 AudioShield Proxy Server started on port ${PORT}`);
console.log(`📡 WebSocket server ready to receive audio streams`);