import { Express } from 'express';
import authRoutes from './auth';
// import userRoutes from './user.routes';
// import postRoutes from './post.routes';

export const loadRoutes = (app: Express) => {
  app.use('/api/v1/auth', authRoutes);
  // app.use('/api/users', userRoutes);
  // app.use('/api/posts', postRoutes);
};
