import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { loginRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);

export { router as authRouter };
export default router;

