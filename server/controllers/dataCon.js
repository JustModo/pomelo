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

exports.getData = async (req, res, next) => {
    try {
        await connectDB();

        const { collection, filter = {}, projection = null, limit = 0, sort = {}, populate = null } = req.body;

        if (!collection || !COLLECTIONS[collection]) {
            return res.status(400).json({ success: false, error: "Invalid or unauthorized collection" });
        }

        const Model = COLLECTIONS[collection];

        // Build query
        let query = Model.find(filter, projection);

        if (sort) query = query.sort(sort);
        if (limit) query = query.limit(limit);
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

        let query = Model.findOne(filter, projection);
        if (populate) query = query.populate(populate);

        const data = await query.exec();

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error("Generic API Error:", error);
        return next(error);
    }
}
