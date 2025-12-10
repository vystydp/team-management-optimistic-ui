// Vercel Serverless Function entry point for backend
// Note: Vercel needs to build TypeScript first

// For Vercel, we need to use the compiled JS or ts-node
const path = require('path');

// Simple approach: import the TypeScript directly (Vercel supports this)
module.exports = require('../backend/src/server.ts').default;
