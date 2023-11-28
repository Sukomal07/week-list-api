import app from './app.js'
import { connectDb } from './database/db.js'


connectDb()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed:", err)
    })

