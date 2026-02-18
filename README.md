🚀 AudioShield Node.js Proxy

The AudioShield Node.js Proxy is a high-performance ingress layer designed to capture real-time audio streams and forward them to the AudioShield Analysis Engine. It serves as the primary gateway for all incoming audio data from Web and Mobile SDKs.

🛡️ Purpose

This proxy is engineered for extreme low latency and high concurrency. It offloads the heavy lifting of maintaining thousands of active WebSocket/RTP connections, allowing the core Analysis Engine to focus exclusively on signal processing and deepfake detection.


Key Capabilities

Real-time Streaming: Optimized binary data handling for zero-lag ingestion.

Protocol Normalization: Standardizes varied audio inputs into uniform chunks.

🛠️ Technical Stack

Runtime: Node.js 24 (LTS)
Language: TypeScript
Build Tool: TypeScript Compiler

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run the compiled JavaScript:
   ```bash
   npm start
   ```

## Development

For development with automatic reloading:
```bash
npm run dev
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm run clean` - Remove the dist directory

## Project Structure

```
├── src/
│   └── index.ts          # Main TypeScript file
├── dist/                 # Compiled JavaScript output
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```