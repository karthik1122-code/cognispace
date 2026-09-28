import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import documentRoutes from './routes/documentRoutes';
import authRoutes from './routes/authRoutes';
import aiRoutes from './routes/aiRoutes';

const app: Application = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cognispace';

// Middlewares
app.use(express.json({ limit: '10mb' })); // Accommodate large block trees
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allows cookies to transmit with PATCH requests
  })
);

// REST & Streaming API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'CogniSpace Engine v2.0' });
});

// Database connection & Server Boot
export const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected successfully to CogniSpace database.');
    } else {
      console.log('CogniSpace running with in-memory / local fallback configuration.');
    }

    return app.listen(PORT, () => {
      console.log(`CogniSpace API server listening on http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error('Failed to start server:', err.message);
  }
};

if (process.env.NODE_ENV !== 'test' && !module.parent) {
  startServer();
}

export default app;
