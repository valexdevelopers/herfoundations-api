import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { loadRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from "cookie-parser";
// import { rateLimiter } from './middlewares/rateLimiter';

dotenv.config();

const app = express();

// Middlewares
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(express.json());
// app.use(rateLimiter); // apply global rate limiter

// Routes
loadRoutes(app);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});