const { connectDB } = require('../helpers/dbCon');
const Question = require('../models/Question');
const Contest = require('../models/Contest');
const Submission = require('../models/Submissions');

// Whitelist allowed collections
const COLLECTIONS = {
    'questions': Question,
    'contests': Contest,
    'submissions': Submission
};

const MAX_LIMIT = 200;

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const hasUnsafeKeys = (value) => {
    if (Array.isArray(value)) return value.some(hasUnsafeKeys);
    if (!isPlainObject(value)) return false;

    for (const [key, val] of Object.entries(value)) {
        if (key.startsWith('$') || key.includes('.')) return true;
        if (hasUnsafeKeys(val)) return true;
    }

    return false;
};

const clampLimit = (limit) => {
    const parsed = Number(limit);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(parsed, MAX_LIMIT);
};

exports.getData = async (req, res, next) => {
    try {
        await connectDB();

        const { collection, filter = {}, projection = null, limit = 0, sort = {}, populate = null } = req.body;

        if (!collection || !COLLECTIONS[collection]) {
            return res.status(400).json({ success: false, error: "Invalid or unauthorized collection" });
        }

        const Model = COLLECTIONS[collection];

        if (!isPlainObject(filter)) {
            return res.status(400).json({ success: false, error: "Invalid filter" });
        }
        if (projection !== null && !isPlainObject(projection)) {
            return res.status(400).json({ success: false, error: "Invalid projection" });
        }
        if (sort !== null && !isPlainObject(sort)) {
            return res.status(400).json({ success: false, error: "Invalid sort" });
        }
        if (populate !== null && !(typeof populate === 'string' || Array.isArray(populate) || isPlainObject(populate))) {
            return res.status(400).json({ success: false, error: "Invalid populate" });
        }

        if (hasUnsafeKeys(filter) || hasUnsafeKeys(sort) || hasUnsafeKeys(projection) || hasUnsafeKeys(populate)) {
            return res.status(400).json({ success: false, error: "Unsafe query keys detected" });
        }

        // Build query
        let query = Model.find(filter, projection);

        if (sort) query = query.sort(sort);
        const cappedLimit = clampLimit(limit);
        if (cappedLimit) query = query.limit(cappedLimit);
        if (populate) query = query.populate(populate);

        const data = await query.exec();

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error("Generic API Error:", error);
        return next(error);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        await connectDB();

        const { collection, filter = {}, projection = null, populate = null } = req.body;

        if (!collection || !COLLECTIONS[collection]) {
            return res.status(400).json({ success: false, error: "Invalid or unauthorized collection" });
        }

        const Model = COLLECTIONS[collection];

        if (!isPlainObject(filter)) {
            return res.status(400).json({ success: false, error: "Invalid filter" });
        }
        if (projection !== null && !isPlainObject(projection)) {
            return res.status(400).json({ success: false, error: "Invalid projection" });
        }
        if (populate !== null && !(typeof populate === 'string' || Array.isArray(populate) || isPlainObject(populate))) {
            return res.status(400).json({ success: false, error: "Invalid populate" });
        }

        if (hasUnsafeKeys(filter) || hasUnsafeKeys(projection) || hasUnsafeKeys(populate)) {
            return res.status(400).json({ success: false, error: "Unsafe query keys detected" });
        }

        let query = Model.findOne(filter, projection);
        if (populate) query = query.populate(populate);

        const data = await query.exec();

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error("Generic API Error:", error);
        return next(error);
    }
}
