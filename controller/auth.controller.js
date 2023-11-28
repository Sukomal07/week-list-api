import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import createError from '../utils/error.js'


export const signup = async (req, res, next) => {
    try {
        const { fullname, email, password, age, gender } = req.body;

        if (!fullname || !email || !password || !age || !gender) {
            return next(createError(401, "All input fields required"))
        }

        const existUser = await User.findOne({ email })
        if (existUser) {
            return next(createError(400, "Email already exist"))
        }

        const user = new User({
            fullname,
            email,
            password,
            age,
            gender
        })

        try {
            await user.validate()
        } catch (error) {
            const validationErrors = [];
            for (const key in error.errors) {
                validationErrors.push(error.errors[key].message);
            }
            return next(createError(400, validationErrors.join(',')))
        }

        await user.save()
        user.password = undefined

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user
        })

    } catch (error) {
        return next(createError(500, error.message))
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return next(createError(401, "All input feilds is required"))
        }
        const userData = await User.findOne({ email }).select('+password')
        if (!userData) {
            return next(createError(404, "User this email is not found"))
        }
        const comparePassword = await bcrypt.compare(password, userData.password)
        if (!comparePassword) {
            return next(createError(401, "Invalid email or password"))
        }
        const token = await userData.generateToken()
        userData.password = undefined
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
            secure: process.env.NODE_ENV === "Development" ? false : true,
        })
        res.status(200).json({
            success: true,
            message: `Welcome back ${userData.name}`,
            userData
        })
    } catch (error) {
        return next(createError(500, error.message))
    }
}
