const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

/**
 * GET /auth/me
 * Verifies Firebase token and returns user details
 */
router.get('/me', verifyToken, (req, res) => {
    // req.user is set by verifyToken middleware
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;
