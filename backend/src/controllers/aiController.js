import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";
import { analyzeTicketWithAI,
         suggestKnowledgeArticlesWithAI
        } from "../services/aiService.js";
import KnowledgeArticle from "../models/KnowledgeArticle.js";

export const analyzeTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const analysis = await analyzeTicketWithAI({
            title: ticket.title,
            description: ticket.description
        });

        ticket.aiAnalysis = {
            category: analysis.category,
            priority: analysis.priority,
            probableIssue: analysis.probableIssue,
            confidence: analysis.confidence
        };

        await ticket.save();

        await AuditLog.create({
            ticket: ticket._id,
            user: req.user._id,
            action: "updated",
            details: "AI analysis generated for ticket"
        });

        res.status(200).json({
            success: true,
            message: "AI analysis completed successfully",
            analysis: ticket.aiAnalysis
        });
    } catch (error) {
        next(error);
    }
};

export const suggestKnowledgeArticles = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const searchText = `${ticket.title} ${ticket.description}`.trim();

const visibilityRules = {
    employee: ["all"],
    technician: ["all", "technician"],
    it_manager: ["all", "technician", "manager"],
    manager: ["all", "technician", "manager"],
    system_admin: ["all", "technician", "manager", "admin"],
    admin: ["all", "technician", "manager", "admin"]
};

const allowedVisibility =
    visibilityRules[req.user.role] || ["all"];

const baseFilter = {
    status: "published",
    visibility: { $in: allowedVisibility }
};

let articles = await KnowledgeArticle.find({
    ...baseFilter,
    $text: {
        $search: searchText
    }
})
.select("title summary content category tags")
.sort({
    score: { $meta: "textScore" }
})
.limit(10);

        if (articles.length === 0 && ticket.category) {
    articles = await KnowledgeArticle.find({
        ...baseFilter,
        category: ticket.category
    })
    .select("title summary content category tags")
    .limit(10);
}

        const suggestions = await suggestKnowledgeArticlesWithAI({
            title: ticket.title,
            description: ticket.description,
            articles
        });

        ticket.aiKnowledgeSuggestions = suggestions.suggestions.map((suggestion) => ({
    articleId: suggestion.articleId,
    relevanceScore: suggestion.relevanceScore,
    reason: suggestion.reason
}));

        await ticket.save();

        const suggestedArticleIds = suggestions.suggestions.map(
            (suggestion) => suggestion.articleId
        );

        const suggestedArticles = await KnowledgeArticle.find({
            _id: { $in: suggestedArticleIds }
        }).select(
            "title summary category tags status visibility"
        );

        const articleMap = new Map(
            suggestedArticles.map((article) => [
                article._id.toString(),
                article
            ])
        );

        const enrichedSuggestions = suggestions.suggestions
            .map((suggestion) => ({
                article: articleMap.get(suggestion.articleId),
                relevanceScore: suggestion.relevanceScore,
                reason: suggestion.reason
            }))
            .filter((suggestion) => suggestion.article);

        await AuditLog.create({
            ticket: ticket._id,
            user: req.user._id,
            action: "updated",
            details: "AI knowledge-base suggestions generated for ticket"
        });

        return res.status(200).json({
            success: true,
            message: "Knowledge-base suggestions generated successfully",
            suggestions: enrichedSuggestions
        });

    } catch (error) {
        next(error);
    }
};