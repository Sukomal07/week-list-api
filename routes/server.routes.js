import express from 'express'
import { checkServer } from '../controller/server.controller.js'
import { isLoggedIn } from '../middleware/auth.middleware.js'
const router = express.Router()

router.get("/health", isLoggedIn, checkServer)

export default router