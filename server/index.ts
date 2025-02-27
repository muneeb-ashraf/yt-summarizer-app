import express from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import path from "path";
import { createServer } from "http";

const app = express();

// Configure body parsing
app.use(express.json());

// Configure CORS and CSP headers
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure CSP
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "frame-src 'self' https://www.youtube.com; " +
    "connect-src 'self' https://*.supabase.co"
  );
  next();
});

// Set up API routes
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    },
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

const httpServer = createServer(app);
registerRoutes(app);

// Serve static files
const publicPath = path.join(process.cwd(), 'dist', 'public');
app.use(express.static(publicPath));

// Handle client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});