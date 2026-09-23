import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Heuristic fallback classifier when Gemini API is unavailable or unconfigured.
 */
const fallbackClassification = (title = "", description = "") => {
    const text = `${title} ${description}`.toLowerCase();

    let category = "other";
    if (/screen|laptop|desktop|monitor|printer|keyboard|mouse|hardware|cable|power|battery/i.test(text)) {
        category = "hardware";
    } else if (/wifi|internet|network|vpn|ethernet|dns|ip|connection|router|switch/i.test(text)) {
        category = "network";
    } else if (/password|login|account|access|permission|reset|locked|2fa|mfa|auth/i.test(text)) {
        category = "access";
    } else if (/virus|malware|phishing|ransomware|security|hacked|suspicious|breach/i.test(text)) {
        category = "security";
    } else if (/software|app|application|crash|bug|install|update|excel|teams|outlook|office/i.test(text)) {
        category = "software";
    }

    let priority = "medium";
    if (/urgent|critical|emergency|down|outage|production|broken|asap/i.test(text)) {
        priority = "high";
    } else if (/security|breach|ransomware|data leak|server down/i.test(text)) {
        priority = "critical";
    } else if (/question|info|request|minor|feature/i.test(text)) {
        priority = "low";
    }

    return {
        category,
        priority,
        probableIssue: `Heuristic classification: ${category.charAt(0).toUpperCase() + category.slice(1)} related inquiry`,
        confidence: 0.65
    };
};

export const analyzeTicketWithAI = async ({
    title,
    description
}) => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not configured — using intelligent heuristic classification");
        return fallbackClassification(title, description);
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const prompt = `
You are an AI assistant for an IT helpdesk system called ResolveDesk.

Analyze the following IT support ticket.

Ticket Title:
${title}

Ticket Description:
${description}

Classify the ticket according to the following allowed values.

Allowed categories:
- hardware
- software
- network
- access
- security
- other

Allowed priorities:
- low
- medium
- high
- critical

Determine:
1. The most appropriate category.
2. The most appropriate priority.
3. The probable technical issue.
4. Your confidence in the classification.

Return ONLY valid JSON using exactly this structure:

{
    "category": "hardware | software | network | access | security | other",
    "priority": "low | medium | high | critical",
    "probableIssue": "string",
    "confidence": 0.0
}

Rules:
- category MUST be one of the six allowed categories.
- priority MUST be one of the four allowed priorities.
- probableIssue should briefly describe the likely technical problem.
- confidence must be a number between 0 and 1.
- Do not include markdown.
- Do not include explanations outside the JSON.
`;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text.trim();

        let result;

        try {
            result = JSON.parse(text);
        } catch (parseError) {
            throw new Error("Gemini returned invalid JSON");
        }

        const validCategories = [
            "hardware",
            "software",
            "network",
            "access",
            "security",
            "other"
        ];

        const validPriorities = [
            "low",
            "medium",
            "high",
            "critical"
        ];

        if (!validCategories.includes(result.category)) {
            result.category = "other";
        }

        if (!validPriorities.includes(result.priority)) {
            result.priority = "medium";
        }

        if (
            typeof result.probableIssue !== "string" ||
            result.probableIssue.trim() === ""
        ) {
            result.probableIssue = "Unspecified technical issue";
        }

        if (
            typeof result.confidence !== "number" ||
            result.confidence < 0 ||
            result.confidence > 1
        ) {
            result.confidence = 0.7;
        }

        return result;

    } catch (error) {
        console.error("Gemini AI error, falling back to heuristics:", error.message);
        return fallbackClassification(title, description);
    }
};

export const suggestKnowledgeArticlesWithAI = async ({
    title,
    description,
    articles
}) => {
    if (!articles || articles.length === 0) {
        return { suggestions: [] };
    }

    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not configured — using fallback article recommendations");
        return {
            suggestions: articles.slice(0, 3).map((art, idx) => ({
                articleId: art._id.toString(),
                relevanceScore: Math.max(0.9 - idx * 0.15, 0.5),
                reason: `Matched relevant category "${art.category}" for this ticket`
            }))
        };
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const articleData = articles.map((article) => ({
            id: article._id.toString(),
            title: article.title,
            summary: article.summary || "",
            content: article.content?.slice(0, 1500) || "",
            category: article.category || "",
            tags: article.tags || []
        }));

        const prompt = `
You are an AI assistant for an IT helpdesk system called ResolveDesk.

Your task is to identify the most relevant knowledge-base articles for an IT support ticket.

Ticket Title:
${title}

Ticket Description:
${description}

Available Knowledge Base Articles:
${JSON.stringify(articleData, null, 2)}

Select the most relevant articles that could help resolve this ticket.

Rules:
- Only recommend articles from the provided list.
- Do not invent article IDs.
- Do not invent knowledge-base content.
- Prefer articles that directly address the technical problem.
- Return at most 3 articles.
- If no article is relevant, return an empty array.
- Give each recommendation a relevance score between 0 and 1.
- Give a short explanation for why the article is relevant.

Return ONLY valid JSON using exactly this structure:

{
    "suggestions": [
        {
            "articleId": "article MongoDB ID",
            "relevanceScore": 0.0,
            "reason": "short explanation"
        }
    ]
}
`;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text.trim();

        let result;

        try {
            result = JSON.parse(text);
        } catch (parseError) {
            throw new Error("Gemini returned invalid JSON for knowledge suggestions");
        }

        if (!result || !Array.isArray(result.suggestions)) {
            throw new Error("Gemini returned an invalid suggestions structure");
        }

        const validArticleIds = new Set(
            articles.map((article) => article._id.toString())
        );

        result.suggestions = result.suggestions
            .filter((suggestion) =>
                validArticleIds.has(suggestion.articleId)
            )
            .filter((suggestion) =>
                typeof suggestion.relevanceScore === "number" &&
                suggestion.relevanceScore >= 0 &&
                suggestion.relevanceScore <= 1
            )
            .filter((suggestion) =>
                typeof suggestion.reason === "string" &&
                suggestion.reason.trim() !== ""
            )
            .slice(0, 3);

        return result;

    } catch (error) {
        console.error("Gemini knowledge suggestion error, falling back to top articles:", error.message);
        return {
            suggestions: articles.slice(0, 3).map((art, idx) => ({
                articleId: art._id.toString(),
                relevanceScore: Math.max(0.85 - idx * 0.15, 0.4),
                reason: `Top matching knowledge base article in category "${art.category}"`
            }))
        };
    }
};