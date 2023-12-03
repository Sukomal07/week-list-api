import express from 'express'
import { createTask, createWeeklist, deleteTask, deleteTasks, deleteWeeklist, editTask, editWeeklist, markTask } from '../controller/weeklist.controller.js';
import { isLoggedIn } from '../middleware/auth.middleware.js'
const router = express.Router()

router.post("/create", isLoggedIn, createWeeklist)
router.put("/:weeklistId/update", isLoggedIn, editWeeklist)
router.delete("/:weeklistId/delete-weeklist", isLoggedIn, deleteWeeklist)
router.delete("/:weeklistId/delete-tasks", isLoggedIn, deleteTasks)
router.post("/:weeklistId/newtask", isLoggedIn, createTask)
router.put("/:weeklistId/:taskId/mark", isLoggedIn, markTask)
router.put("/:weeklistId/:taskId/edit-task", isLoggedIn, editTask)
router.delete("/:weeklistId/:taskId/delete-task", isLoggedIn, deleteTask)

export default router;