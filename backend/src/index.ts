import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { errorHandler } from './middlewares/error';

// Import Routes
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import borrowRoutes from './routes/borrowRoutes';
import reservationRoutes from './routes/reservationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import fineRoutes from './routes/fineRoutes';
import aiRoutes from './routes/aiRoutes';
import categoryRoutes from './routes/categoryRoutes';
import authorRoutes from './routes/authorRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reviewRoutes from './routes/reviewRoutes';
import premiumRoutes from './routes/premiumRoutes';
import researchRoutes from './routes/researchRoutes';
import eventRoutes from './routes/eventRoutes';
import researchAssistantRoutes from './routes/researchAssistantRoutes';

// Load Env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images to be read by frontend
}));
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity, can restrict to frontend URL
  credentials: true
}));

// Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Mountpoints
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/research-assistant', researchAssistantRoutes);

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Library System API is running smoothly.',
  });
});

// Fallback for Page Not Found (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on this server.`
  });
});

// Global Error Handler
app.use(errorHandler);

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();
    const httpServer = createServer(app);
    initSocket(httpServer);
    
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
