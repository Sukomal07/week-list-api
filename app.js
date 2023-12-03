import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import errorMiddleware from './middleware/error.middleware.js'
import userRoutes from './routes/user.routes.js'
import serverRoutes from './routes/server.routes.js'
import weeklistRoutes from './routes/weeklist.routes.js'

dotenv.config()

const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/v1/user", userRoutes)
app.use("/api/v1", serverRoutes)
app.use("/api/v1/weeklist", weeklistRoutes)
app.all("*", (req, res) => {
    res.status(404).send(`!oops page not found`)
})

app.use(errorMiddleware)
export default app
