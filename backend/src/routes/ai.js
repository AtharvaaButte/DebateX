const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { rooms } = require('../store');
const { generateCounterArgument, suggestTopic } = require('../services/gemini');

/**
 * POST /ai/respond
 * Direct test generation string explicitly mapped to satisfy UI requirements
 */
router.post('/respond', verifyToken, async (req, res) => {
    const { roomId, userArgument } = req.body;
    
    // Quick test endpoint directly calling Gemini without advancing the actual room's turn structure
    const room = rooms[roomId];
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Fetch an AI response directly for testing
    const aiResponse = await generateCounterArgument(room.topic, room.arguments, userArgument);
    res.json({ counterargument: aiResponse });
});

/**
 * POST /ai/suggest-topic
 */
router.post('/suggest-topic', verifyToken, async (req, res) => {
    const suggestion = await suggestTopic();
    res.json(suggestion);
});

module.exports = router;
