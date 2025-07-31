import { Router } from 'express';
import { AuthController } from '../controllers/auth/AuthenticatedSession.controller';
import { authenticate } from '../middlewares/authenticated';

const router = Router();
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh', AuthController.refresh);
router.post('/verify-email', authenticate, AuthController.verifyEmail);
router.post('/resend-verification', authenticate, AuthController.resendVerificatioCode);

export default router;
