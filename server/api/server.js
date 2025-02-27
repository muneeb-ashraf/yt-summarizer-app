import express from 'express';
import { setupYouTubeRoutes } from '../youtube';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL
    : 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

setupYouTubeRoutes(app);

export default app;
