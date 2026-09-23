import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            unique: true,
            required: true
        },

        title: {
            type: String,
            required: [true, "Ticket title is required"],
            trim: true,
            minlength: 5,
            maxlength: 150
        },

        description: {
            type: String,
            required: [true, "Ticket description is required"],
            trim: true,
            minlength: 10,
            maxlength: 5000
        },

        category: {
            type: String,
            enum: [
                "hardware",
                "software",
                "network",
                "access",
                "security",
                "other"
            ],
            default: "other"
        },

        priority: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],
            default: "medium"
        },

        status: {
            type: String,
            enum: [
                "open",
                "assigned",
                "in_progress",
                "resolved",
                "closed",
                "reopened"
            ],
            default: "open"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },

        sla: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SLA",
    default: null
},

        slaDueDate: {
    type: Date,
    default: null
},

        slaStatus: {
    type: String,
    enum: [
        "not_started",
        "active",
        "met",
        "breached"
    ],
    default: "not_started"
},

        resolvedAt: {
    type: Date,
    default: null
},

        resolution: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: null
        },

        attachments: [
            {
                filename: String,
                url: String
            }
        ],

        aiAnalysis: {
            category: {
                type: String,
                default: null
            },

            priority: {
                type: String,
                default: null
            },

            probableIssue: {
                type: String,
                default: null
            },

            confidence: {
                type: Number,
                min: 0,
                max: 1,
                default: null
            }
        },
        aiKnowledgeSuggestions: [
    {
        articleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "KnowledgeArticle"
        },
        relevanceScore: {
            type: Number,
            min: 0,
            max: 1
        },
        reason: {
            type: String
        }
    }
]
    },
    {
        timestamps: true
    }
);

ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ department: 1, status: 1 });
ticketSchema.index({ slaStatus: 1, slaDueDate: 1 });
ticketSchema.index({ ticketNumber: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;