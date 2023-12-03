import express from 'express'
import { createWeeklist, deleteDescription, deleteWeeklist, editWeeklist } from '../controller/weeklist.controller.js';
import { isLoggedIn } from '../middleware/auth.middleware.js'
const router = express.Router()

router.post("/create", isLoggedIn, createWeeklist)
router.put("/:weeklistId/update", isLoggedIn, editWeeklist)
router.delete("/:weeklistId/delete", isLoggedIn, deleteWeeklist)
router.delete("/:weeklistId/description", isLoggedIn, deleteDescription)

export default router;