const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { profiles } = require('../store');

// GET /profile/me
router.get('/me', verifyToken, (req, res) => {
    const profile = profiles[req.user.uid];
    if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ profile });
});

// POST /profile/setup
router.post('/setup', verifyToken, (req, res) => {
    const { username, avatar, bio } = req.body;
    
    if (!username || !avatar) {
        return res.status(400).json({ error: 'Username and avatar are required' });
    }
    
    profiles[req.user.uid] = { 
        username, 
        avatar, 
        bio: bio || '' 
    };
    
    res.status(201).json({ profile: profiles[req.user.uid] });
});

module.exports = router;
