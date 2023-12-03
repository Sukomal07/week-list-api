import { Schema, model } from "mongoose";

const taskSchema = new Schema({
    task: {
        type: String,
        required: [true, "Task description is required"]
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedTime: {
        type: Date
    }
});

const weeklistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: [true, "Weeklist name is required"],
        minLength: [5, "Weeklist name must be at least 5 characters"]
    },
    tasks: [taskSchema],
    endTime: {
        type: Date
    },
    state: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active'
    }
}, { timestamps: true });

const Weeklist = model('Weeklist', weeklistSchema);

export default Weeklist;
