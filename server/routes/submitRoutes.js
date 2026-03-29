const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/checkAuth");
const { isContestActive } = require("../middlewares/contestAuth");
const { saveMCQ, submitCode } = require("../controllers/submitCon");
const { submissionLimiter } = require("../middlewares/rateLimiter");
const Question = require("../models/Question");

// POST /api/submit - Auto-detect type and route accordingly
router.post("/", requireAuth(), submissionLimiter, isContestActive, async (req, res) => {
    try {
        const { questionId } = req.body;

        if (!questionId) {
            return res.status(400).json({ error: "Missing questionId" });
        }

        // Fetch the question to determine its type
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Attach question to req object to avoid redundant fetch in controller
        req.question = question;

        // Dispatch based on question type (check both 'type' and 'questionType' fields)
        if (question.questionType === 'Coding' || question.type === 'coding') {
            return submitCode(req, res);
        } else {
            // Assumes 'Single Correct' or 'Multiple Correct'
            return saveMCQ(req, res);
        }
    } catch (err) {
        console.error("Routing error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
