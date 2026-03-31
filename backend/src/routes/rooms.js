const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { rooms, profiles, createId } = require('../store');
const { generateTopicBrief } = require('../services/gemini');

/**
 * POST /rooms
 * Body: { topic: string, sideSelectionMode?: 'user'|'owner'|'auto', ownerParticipates?: boolean, evaluationInstructions?: string }
 */
router.post('/', verifyToken, async (req, res) => {
    let { topic, sideSelectionMode, ownerParticipates, evaluationInstructions } = req.body;
    
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Set parameter defaults
    sideSelectionMode = sideSelectionMode || 'auto';
    ownerParticipates = typeof ownerParticipates === 'boolean' ? ownerParticipates : true;

    if (!['user', 'owner', 'auto'].includes(sideSelectionMode)) {
         return res.status(400).json({ error: 'sideSelectionMode must be user, owner, or auto' });
    }

    const roomId = createId();
    
    const newRoom = {
        roomId,
        topic,
        ownerId: req.user.uid,
        sideSelectionMode,
        ownerParticipates,
        evaluationInstructions: evaluationInstructions || null,
        status: 'waiting', 
        users: [],
        arguments: [],
        currentTurn: null,
        spokenOrder: { FOR: [], AGAINST: [] },
        lastTeam: null,
        lastSpeaker: null,
        evaluationResult: null,
        topicBrief: null
    };

    // Auto-add owner if they participate
    if (ownerParticipates) {
        const profile = profiles[req.user.uid] || {};
        newRoom.users.push({
            uid: req.user.uid,
            name: profile.username || req.user.name,
            avatar: profile.avatar || null,
            side: sideSelectionMode === 'owner' ? 'PENDING' : 'FOR'
        });
    }

    try {
        newRoom.topicBrief = await generateTopicBrief(topic);
    } catch (e) {
        newRoom.topicBrief = '';
    }

    rooms[roomId] = newRoom;
    res.json({ roomId, room: newRoom });
});

/**
 * POST /rooms/:roomId/add-bot
 * Body: { name: string, side: 'FOR' | 'AGAINST' }
 */
router.post('/:roomId/add-bot', verifyToken, (req, res) => {
    const { roomId } = req.params;
    const { name, side } = req.body;
    const room = rooms[roomId];

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.ownerId !== req.user.uid) return res.status(403).json({ error: 'Only the room owner can add bots' });
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Can only add bots while waiting' });
    if (!name || (side !== 'FOR' && side !== 'AGAINST')) {
        return res.status(400).json({ error: 'Valid bot name and strictly FOR/AGAINST side are required' });
    }

    if (room.users.length >= 8) return res.status(400).json({ error: 'Room is full' });

    const totalBots = room.users.filter(u => u.isBot).length;
    if (totalBots >= 3) return res.status(400).json({ error: 'Maximum of 3 bots allowed per room' });

    const botId = 'bot_' + createId();
    room.users.push({
        uid: botId,
        name: name,
        side: side,
        isBot: true,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${botId}`
    });

    res.json({ status: 'bot_added', room });
});

/**
 * POST /rooms/join
 * Body: { roomId: string, side?: 'FOR'|'AGAINST' }
 */
router.post('/join', verifyToken, (req, res) => {
    const { roomId, side } = req.body;
    const room = rooms[roomId];

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    // Lock room strictly before allowing join
    if (room.status !== 'waiting') {
         return res.status(400).json({ error: 'Cannot join room. Debate is not in waiting state.' });
    }

    // Check if user is already in the room (prevent duplicate joins)
    if (room.users.some(u => u.uid === req.user.uid)) {
         return res.status(400).json({ error: 'User already in this room' });
    }

    // 8 Max users capability
    if (room.users.length >= 8) {
         return res.status(400).json({ error: 'Room is full' });
    }

    let assignedSide = 'PENDING';

    if (room.sideSelectionMode === 'auto') {
        // Count FOR vs AGAINST
        let forCount = 0;
        let againstCount = 0;
        room.users.forEach(u => {
            if(u.side === 'FOR') forCount++;
            if(u.side === 'AGAINST') againstCount++;
        });
        
        assignedSide = forCount <= againstCount ? 'FOR' : 'AGAINST';
    } else if (room.sideSelectionMode === 'user') {
        if (side !== 'FOR' && side !== 'AGAINST') {
            return res.status(400).json({ error: 'You must select a valid side (FOR / AGAINST)' });
        }
        assignedSide = side;
    } else if (room.sideSelectionMode === 'owner') {
        assignedSide = 'PENDING';
    }

    const profile = profiles[req.user.uid] || {};
    room.users.push({
        uid: req.user.uid,
        name: profile.username || req.user.name,
        avatar: profile.avatar || null,
        side: assignedSide
    });

    res.json({ status: 'joined', room });
});

/**
 * POST /rooms/:roomId/assign-side
 * Body: { userId: string, side: 'FOR' | 'AGAINST' }
 */
router.post('/:roomId/assign-side', verifyToken, (req, res) => {
    const { roomId } = req.params;
    const { userId, side } = req.body;
    const room = rooms[roomId];

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.ownerId !== req.user.uid) return res.status(403).json({ error: 'Only the room owner can assign sides' });
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Can only assign sides while waiting' });
    if (side !== 'FOR' && side !== 'AGAINST') return res.status(400).json({ error: 'Side must be FOR or AGAINST' });

    const targetUser = room.users.find(u => u.uid === userId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found in room' });

    targetUser.side = side;

    res.json({ success: true, room });
});

/**
 * GET /rooms/:roomId
 */
router.get('/:roomId', verifyToken, (req, res) => {
    const { roomId } = req.params;
    const room = rooms[roomId];

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ room });
});

module.exports = router;
