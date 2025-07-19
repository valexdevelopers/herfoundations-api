import { Router } from 'express';
import { AuthController } from '../controllers/auth/AuthenticatedSession.controller';

const router = Router();
router.patch('/:id', AuthController.update);

export default router;
