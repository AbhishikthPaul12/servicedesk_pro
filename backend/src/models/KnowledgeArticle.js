import mongoose from "mongoose";

const knowledgeArticleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Article title is required"],
            trim: true,
            minlength: 5,
            maxlength: 150
        },

        content: {
            type: String,
            required: [true, "Article content is required"],
            trim: true,
            minlength: 20
        },

        summary: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        category: {
            type: String,
            required: [true, "Article category is required"],
            trim: true,
            lowercase: true
        },

        tags: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft"
        },

        visibility: {
            type: String,
            enum: ["all", "technician", "manager", "admin"],
            default: "all"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        viewCount: {
            type: Number,
            default: 0,
            min: 0
        },

        helpfulCount: {
            type: Number,
            default: 0,
            min: 0
        },

        notHelpfulCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

knowledgeArticleSchema.index({
    title: "text",
    content: "text",
    summary: "text",
    tags: "text"
});

knowledgeArticleSchema.index({
    category: 1,
    status: 1
});

knowledgeArticleSchema.index({
    visibility: 1,
    status: 1
});

const KnowledgeArticle = mongoose.model(
    "KnowledgeArticle",
    knowledgeArticleSchema
);

export default KnowledgeArticle;