import mongoose from "mongoose";

const ticketCommentSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            required: [true, "Comment content is required"],
            trim: true,
            minlength: 1,
            maxlength: 2000
        },

        type: {
            type: String,
            enum: ["comment", "internal_note"],
            default: "comment"
        },

        attachments: [
            {
                filename: String,
                url: String
            }
        ]
    },
    {
        timestamps: true
    }
);

const TicketComment = mongoose.model(
    "TicketComment",
    ticketCommentSchema
);

export default TicketComment;