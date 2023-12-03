import Weeklist from '../models/weeklist.model.js'
import createError from '../utils/error.js'


export const createWeeklist = async (req, res, next) => {
    try {
        const { id } = req.user

        const { name } = req.body;

        const currentDate = new Date();
        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );

        const activeWeekListsCount = await Weeklist.countDocuments({ userId: id, state: 'active' });
        if (activeWeekListsCount >= 2) {
            return next(createError(400, "You already have two active week lists"))
        }

        const newWeekList = new Weeklist({
            userId: id,
            name,
            endTime
        });

        try {
            await newWeekList.validate()
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')))
        }

        await newWeekList.save();
        res.status(201).json({
            success: true,
            message: "Weeklist created successfully",
            newWeekList
        })
    } catch (error) {
        return next(createError(500, error.message))
    }
}

export const editWeeklist = async (req, res, next) => {
    try {
        const { id } = req.user;

        const { weeklistId } = req.params;

        const existingWeeklist = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!existingWeeklist) {
            return next(createError(404, "Weeklist not found"));
        }

        const createdAtTime = existingWeeklist.createdAt.getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - createdAtTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            return next(createError(400, "Cannot update weeklist after 24 hours of creation"));
        }

        const currentDate = new Date();
        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );

        const updatedData = {
            ...req.body,
            endTime,
        };

        const updatedWeeklist = await Weeklist.findOneAndUpdate(
            { _id: weeklistId, userId: id },
            { $set: updatedData },
            { runValidators: true, new: true }
        );

        try {
            await updatedWeeklist.validate();
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')));
        }

        res.status(200).json({
            success: true,
            message: "Weeklist updated successfully",
            updatedWeeklist,
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}

export const deleteTasks = async (req, res, next) => {
    try {
        const { id } = req.user;

        const { weeklistId } = req.params;

        const weeklist = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!weeklist) {
            return next(createError(404, "Weeklist not found"));
        }

        const createdAtTime = weeklist.createdAt.getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - createdAtTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            return next(createError(400, "Cannot modify weeklist after 24 hours of creation"));
        }
        const currentDate = new Date();
        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );


        weeklist.tasks = [];

        weeklist.endTime = endTime

        await weeklist.save();

        res.status(200).json({
            success: true,
            message: "Tasks deleted successfully",
            updatedWeeklist: weeklist,
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}

export const deleteWeeklist = async (req, res, next) => {
    try {
        const { id } = req.user;

        const { weeklistId } = req.params;

        const weeklistToDelete = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!weeklistToDelete) {
            return next(createError(404, "Weeklist not found"));
        }

        const createdAtTime = weeklistToDelete.createdAt.getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - createdAtTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            return next(createError(400, "Cannot delete weeklist after 24 hours of creation"));
        }

        await Weeklist.deleteOne({ _id: weeklistId, userId: id });

        res.status(200).json({
            success: true,
            message: "Weeklist deleted successfully",
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}

export const createTask = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { weeklistId } = req.params;
        const { task } = req.body;

        const existingWeeklist = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!existingWeeklist) {
            return next(createError(404, "Weeklist not found"));
        }
        const currentDate = new Date();

        if (existingWeeklist.state !== 'active') {
            return next(createError(400, "Cannot add tasks to an inactive weeklist"));
        }

        if (currentDate > existingWeeklist.endTime) {
            existingWeeklist.state = 'inactive'
            await existingWeeklist.save()
            return next(createError(400, "Cannot add tasks to an inactive weeklist"));
        }
        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );

        const newTask = {
            task
        };

        existingWeeklist.tasks.push(newTask);
        existingWeeklist.endTime = endTime
        try {
            await existingWeeklist.validate()
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')))
        }

        await existingWeeklist.save();

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            updatedWeeklist: existingWeeklist,
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}

export const markTask = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { weeklistId, taskId } = req.params;
        const { isCompleted } = req.body;

        const existingWeeklist = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!existingWeeklist) {
            return next(createError(404, "Weeklist not found"));
        }
        const currentDate = new Date();

        if (existingWeeklist.state !== 'active') {
            return next(createError(400, "Cannot mark task to an inactive weeklist"));
        }

        if (currentDate > existingWeeklist.endTime) {
            existingWeeklist.state = 'inactive'
            await existingWeeklist.save()
            return next(createError(400, "Cannot mark task to an inactive weeklist"));
        }

        const taskIndex = existingWeeklist.tasks.findIndex(task => task._id.toString() === taskId);

        if (taskIndex === -1) {
            return next(createError(404, "Task not found"));
        }

        existingWeeklist.tasks[taskIndex].isCompleted = isCompleted;

        if (isCompleted) {
            existingWeeklist.tasks[taskIndex].completedTime = new Date();
        } else {
            existingWeeklist.tasks[taskIndex].completedTime = null;
        }

        if (areAllTasksCompleted(existingWeeklist.tasks)) {
            existingWeeklist.state = 'completed';
        }

        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );
        existingWeeklist.endTime = endTime

        try {
            await existingWeeklist.validate();
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')));
        }

        await existingWeeklist.save();

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            updatedWeeklist: existingWeeklist,
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}

function areAllTasksCompleted(tasks) {
    return tasks.every(task => task.isCompleted);
}

export const editTask = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { weeklistId, taskId } = req.params;
        const { task: updatedTask } = req.body;

        if (!updatedTask) {
            return next(createError(400, "Please enter task name"))
        }

        const existingWeeklist = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!existingWeeklist) {
            return next(createError(404, "Weeklist not found"));
        }

        if (existingWeeklist.state !== 'active') {
            return next(createError(400, "Cannot edit tasks in an inactive weeklist"));
        }

        const createdAtTime = existingWeeklist.createdAt.getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - createdAtTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            return next(createError(400, "Cannot delete weeklist after 24 hours of creation"));
        }

        const currentDate = new Date();
        if (currentDate > existingWeeklist.endTime) {
            existingWeeklist.state = 'inactive'
            await existingWeeklist.save()
            return next(createError(400, "Cannot edit task to an inactive weeklist"));
        }

        const taskIndex = existingWeeklist.tasks.findIndex(task => task._id.toString() === taskId);

        if (taskIndex === -1) {
            return next(createError(404, "Task not found"));
        }

        existingWeeklist.tasks[taskIndex].task = updatedTask;

        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );
        existingWeeklist.endTime = endTime

        try {
            await existingWeeklist.validate();
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')));
        }

        await existingWeeklist.save();

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            updatedWeeklist: existingWeeklist,
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}

export const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { weeklistId, taskId } = req.params;

        const existingWeeklist = await Weeklist.findOne({ _id: weeklistId, userId: id });

        if (!existingWeeklist) {
            return next(createError(404, "Weeklist not found"));
        }
        if (existingWeeklist.state !== 'active') {
            return next(createError(400, "Cannot delete task in an inactive weeklist"));
        }

        const createdAtTime = existingWeeklist.createdAt.getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - createdAtTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            return next(createError(400, "Cannot delete weeklist after 24 hours of creation"));
        }

        const taskIndex = existingWeeklist.tasks.findIndex(task => task._id.toString() === taskId);

        if (taskIndex === -1) {
            return next(createError(404, "Task not found"));
        }

        existingWeeklist.tasks.splice(taskIndex, 1);

        const currentDate = new Date();
        const remainingDays = 6 - currentDate.getDay();
        const remainingHours = 23 - currentDate.getHours();
        const remainingMinutes = 59 - currentDate.getMinutes();
        const endTime = new Date(
            Date.parse(currentDate.toISOString()) +
            (remainingDays * 24 * 60 * 60 * 1000) +
            (remainingHours * 60 * 60 * 1000) +
            (remainingMinutes * 60 * 1000)
        );
        existingWeeklist.endTime = endTime
        try {
            await existingWeeklist.validate();
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')));
        }

        await existingWeeklist.save();

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            updatedWeeklist: existingWeeklist,
        });
    } catch (error) {
        return next(createError(500, error.message));
    }
}












