import KnowledgeArticle from "../models/KnowledgeArticle.js";

export const createArticle = async (req, res, next) => {
    try {
        const {
            title,
            content,
            summary,
            category,
            tags,
            status,
            visibility
        } = req.body;

        const article = await KnowledgeArticle.create({
            title,
            content,
            summary,
            category,
            tags,
            status,
            visibility,
            createdBy: req.user._id
        });

        const populatedArticle = await KnowledgeArticle.findById(article._id)
            .populate("createdBy", "name email role")
            .populate("updatedBy", "name email role");

        res.status(201).json({
            success: true,
            message: "Knowledge article created successfully",
            article: populatedArticle
        });
    } catch (error) {
        next(error);
    }
};


export const getArticles = async (req, res, next) => {
    try {
        const {
            keyword,
            category,
            tag,
            status,
            visibility,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const filter = {};

        /*
         * Employees should only see published articles
         * that are visible to everyone.
         */
        if (req.user.role === "employee") {
            filter.status = "published";
            filter.visibility = "all";
        } else {
            if (status) {
                filter.status = status;
            }

            if (visibility) {
                filter.visibility = visibility;
            }
        }

        if (category) {
            filter.category = category.toLowerCase();
        }

        if (tag) {
            filter.tags = tag.toLowerCase();
        }

        if (keyword) {
            filter.$or = [
                {
                    title: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    content: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    summary: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    tags: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ];
        }

        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );

        const skip = (pageNumber - 1) * limitNumber;

        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "title",
            "viewCount",
            "helpfulCount"
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const safeOrder = order === "asc" ? 1 : -1;

        const [articles, total] = await Promise.all([
            KnowledgeArticle.find(filter)
                .populate("createdBy", "name email role")
                .populate("updatedBy", "name email role")
                .sort({ [safeSortBy]: safeOrder })
                .skip(skip)
                .limit(limitNumber),

            KnowledgeArticle.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: articles.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            pages: Math.ceil(total / limitNumber),
            articles
        });
    } catch (error) {
        next(error);
    }
};


export const getArticleById = async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findById(
            req.params.id
        )
            .populate("createdBy", "name email role")
            .populate("updatedBy", "name email role");

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        /*
         * Employees can only access published,
         * public articles.
         */
        if (
            req.user.role === "employee" &&
            (
                article.status !== "published" ||
                article.visibility !== "all"
            )
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this article"
            });
        }

        article.viewCount += 1;
        await article.save();

        res.status(200).json({
            success: true,
            article
        });
    } catch (error) {
        next(error);
    }
};


export const updateArticle = async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findById(
            req.params.id
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        /*
         * Technicians can only update articles
         * they originally created.
         */
        if (
            req.user.role === "technician" &&
            article.createdBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own articles"
            });
        }

        const allowedFields = [
            "title",
            "content",
            "summary",
            "category",
            "tags"
        ];

        /*
         * Publishing and archiving are restricted
         * to admin/manager.
         */
        if (
            req.body.status !== undefined &&
            !["admin", "manager"].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "Only admin or manager can change article status"
            });
        }

        if (
            req.body.visibility !== undefined &&
            !["admin", "manager"].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "Only admin or manager can change article visibility"
            });
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                article[field] = req.body[field];
            }
        }

        if (req.body.status !== undefined) {
            article.status = req.body.status;
        }

        if (req.body.visibility !== undefined) {
            article.visibility = req.body.visibility;
        }

        article.updatedBy = req.user._id;

        await article.save();

        const populatedArticle = await KnowledgeArticle.findById(
            article._id
        )
            .populate("createdBy", "name email role")
            .populate("updatedBy", "name email role");

        res.status(200).json({
            success: true,
            message: "Knowledge article updated successfully",
            article: populatedArticle
        });
    } catch (error) {
        next(error);
    }
};


export const deleteArticle = async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findById(
            req.params.id
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        await article.deleteOne();

        res.status(200).json({
            success: true,
            message: "Knowledge article deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const markHelpful = async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findByIdAndUpdate(
            req.params.id,
            {
                $inc: {
                    helpfulCount: 1
                }
            },
            {
                new: true
            }
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Article marked as helpful",
            article
        });
    } catch (error) {
        next(error);
    }
};


export const markNotHelpful = async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findByIdAndUpdate(
            req.params.id,
            {
                $inc: {
                    notHelpfulCount: 1
                }
            },
            {
                new: true
            }
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Article marked as not helpful",
            article
        });
    } catch (error) {
        next(error);
    }
};