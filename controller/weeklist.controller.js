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

        const updatedWeeklist = await Weeklist.findOneAndUpdate(
            { _id: weeklistId, userId: id },
            { $set: req.body },
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

export const deleteDescription = async (req, res, next) => {
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

        weeklist.description = [];

        await weeklist.save();

        res.status(200).json({
            success: true,
            message: "Description array deleted successfully",
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







