// Vercel Serverless Function entry point
// Vercel automatically compiles TypeScript in the api/ directory

module.exports = async (req, res) => {
  // Import the Express app (Vercel will handle TypeScript compilation)
  const app = (await import('../backend/src/server.js')).default;
  
  // Let Express handle the request
  return app(req, res);
};
