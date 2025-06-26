import { Router } from 'express';
import { AuthController } from '../controllers/auth/AuthenticatedSession.controller';

const router = Router();

// router.get('/register', AuthController.register);
router.post('/login', AuthController.login);

export default router;
