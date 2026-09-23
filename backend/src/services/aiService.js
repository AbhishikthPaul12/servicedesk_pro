import { GoogleGenAI } from "@google/genai";

export const analyzeTicketWithAI = async ({
    title,
    description
}) => {
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
            model: "gemini-3.6-flash",
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
            throw new Error("Gemini returned an invalid category");
        }

        if (!validPriorities.includes(result.priority)) {
            throw new Error("Gemini returned an invalid priority");
        }

        if (
            typeof result.probableIssue !== "string" ||
            result.probableIssue.trim() === ""
        ) {
            throw new Error("Gemini returned an invalid probable issue");
        }

        if (
            typeof result.confidence !== "number" ||
            result.confidence < 0 ||
            result.confidence > 1
        ) {
            throw new Error("Gemini returned an invalid confidence score");
        }

        return result;

    } catch (error) {
        console.error("Gemini AI error:", error);
        throw error;
    }
};

export const suggestKnowledgeArticlesWithAI = async ({
    title,
    description,
    articles
}) => {
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
            model: "gemini-3.6-flash",
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
        console.error("Gemini knowledge suggestion error:", error);
        throw error;
    }
};