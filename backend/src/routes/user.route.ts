import express from 'express'
import { verifyJwt } from '../middleware/auth.middleware.js'
import { loginUser, registerUser } from '../controllers/auth.controller.js'
const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)

export default router