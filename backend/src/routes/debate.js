const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { rooms } = require('../store');
const { evaluateDebate, generateBotArgument } = require('../services/gemini');

const ARGUMENT_MAX_LENGTH = 1000;
const MAX_TOTAL_ARGUMENTS = 40; // Soft cap to prevent infinite system loops

const validateRoomTurn = (room, uid) => {
    if (!room) return 'Room not found';
    if (room.status !== 'ongoing') return 'Debate is not ongoing';
    if (!room.users.some(u => u.uid === uid)) return 'User not in room';
    if (room.currentTurn !== uid) return 'It is not your turn';
    return null; 
};

const computeNextTurn = (room) => {
    const forUsers = room.users.filter(u => u.side === 'FOR').map(u => u.uid);
    const againstUsers = room.users.filter(u => u.side === 'AGAINST').map(u => u.uid);

    let nextTeam = room.lastTeam === 'FOR' ? 'AGAINST' : 'FOR';
    
    // Edge case: if team empty, skip to next team
    if (nextTeam === 'FOR' && forUsers.length === 0) nextTeam = 'AGAINST';
    if (nextTeam === 'AGAINST' && againstUsers.length === 0) nextTeam = 'FOR';

    const teamUsers = nextTeam === 'FOR' ? forUsers : againstUsers;
    if (teamUsers.length === 0) return null; // No users in room

    if (!room.spokenOrder) room.spokenOrder = { FOR: [], AGAINST: [] };

    let availableUsers = teamUsers.filter(uid => !room.spokenOrder[nextTeam].includes(uid));

    // Reset cycle if everyone has spoken
    if (availableUsers.length === 0) {
        const lastSpoken = room.spokenOrder[nextTeam][room.spokenOrder[nextTeam].length - 1];
        room.spokenOrder[nextTeam] = [];
        availableUsers = teamUsers;
        
        // Prevent consecutive repetition
        if (teamUsers.length > 1) {
            availableUsers = availableUsers.filter(uid => uid !== lastSpoken);
        }
    }

    const randomUid = availableUsers[Math.floor(Math.random() * availableUsers.length)];
    
    room.spokenOrder[nextTeam].push(randomUid);
    room.lastTeam = nextTeam;
    room.lastSpeaker = randomUid;

    return randomUid;
};

/**
 * Synchronous Bot Iteration Helper
 * Runs immediately to fill in AI logic before handing the turn back down to humans
 */
const processBotTurns = async (room) => {
    let botsProcessed = 0;
    
    // Safely parse up to 2 consecutive bots mapping across the array iteration limit
    while (room.status === 'ongoing' && botsProcessed < 2 && room.arguments.length < MAX_TOTAL_ARGUMENTS) {
        const currentActiveUser = room.users.find(u => u.uid === room.currentTurn);
        
        // If human player hits the queue, immediately stop looping
        if (!currentActiveUser || !currentActiveUser.isBot) break;

        try {
            const botText = await generateBotArgument(room.topic, room.arguments, currentActiveUser.name, currentActiveUser.side);
            room.arguments.push({
                userId: currentActiveUser.uid,
                side: currentActiveUser.side,
                text: botText,
                timestamp: Date.now()
            });
        } catch (e) {
            console.error('Bot failed to generate argument natively, seamlessly skipping its internal turn logic', e);
        }

        // Trigger compute wrapper to advance turn organically
        room.currentTurn = computeNextTurn(room);
        
        botsProcessed++;
    }
    
    // Hard cutoff protecting system memory
    if (room.arguments.length >= MAX_TOTAL_ARGUMENTS) {
        room.status = 'ended';
    }
};

/**
 * POST /debate/:roomId/start
 */
router.post('/:roomId/start', verifyToken, async (req, res) => {
    const { roomId } = req.params;
    const room = rooms[roomId];

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.ownerId !== req.user.uid) return res.status(403).json({ error: 'Only the room owner can start the debate' });
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Debate already started or ended' });

    // Validate minimum players
    if (room.users.length < 2) {
        return res.status(400).json({ error: 'Need at least 2 players to start the debate' });
    }

    // Validate sides exist
    const hasFor = room.users.some(u => u.side === 'FOR');
    const hasAgainst = room.users.some(u => u.side === 'AGAINST');
    const hasPending = room.users.some(u => u.side === 'PENDING');

    if (hasPending) {
        return res.status(400).json({ error: 'All players must have an assigned side (FOR/AGAINST) before starting.' });
    }
    if (!hasFor || !hasAgainst) {
         return res.status(400).json({ error: 'The debate must have at least one FOR and one AGAINST participant.' });
    }

    // Initialize controlled randomness 
    room.spokenOrder = { FOR: [], AGAINST: [] };
    room.lastTeam = 'AGAINST'; // Start the cycle with FOR inherently
    room.lastSpeaker = null;

    room.currentTurn = computeNextTurn(room);
    room.status = 'ongoing';

    // Naturally process the initial loop in case a bot was selected
    await processBotTurns(room);

    res.json({ status: 'started', currentTurn: room.currentTurn });
});

/**
 * POST /debate/argument
 */
router.post('/argument', verifyToken, async (req, res) => {
    const { roomId, text } = req.body;
    
    if (!roomId || !text) {
        return res.status(400).json({ error: 'roomId and text are required' });
    }

    if (text.length > ARGUMENT_MAX_LENGTH) {
         return res.status(400).json({ error: `Argument too long. Max ${ARGUMENT_MAX_LENGTH} characters.`});
    }

    const room = rooms[roomId];
    
    // Stop arguments if over the soft cap limit organically
    if (room.arguments.length >= MAX_TOTAL_ARGUMENTS) {
        room.status = 'ended';
        return res.status(400).json({ error: 'Debate limit reached. Evaluate to see results.' });
    }

    const validationError = validateRoomTurn(room, req.user.uid);
    if (validationError) return res.status(400).json({ error: validationError });

    const userObj = room.users.find(u => u.uid === req.user.uid);

    // Save user argument
    room.arguments.push({
        userId: req.user.uid,
        side: userObj.side,
        text: text,
        timestamp: Date.now()
    });

    // Advance Turn organically
    room.currentTurn = computeNextTurn(room);

    // Trigger AI bots passively if they are immediately next in line via while loop array processing
    await processBotTurns(room);

    res.json({ success: true, saved: true, currentTurn: room.currentTurn });
});

/**
 * GET /debate/:roomId/arguments
 */
router.get('/:roomId/arguments', verifyToken, (req, res) => {
    const { roomId } = req.params;
    const room = rooms[roomId];
    if (!room) return res.status(404).json({ error: 'Room not found' });

    res.json({ arguments: room.arguments });
});

/**
 * POST /debate/:roomId/evaluate
 */
router.post('/:roomId/evaluate', verifyToken, async (req, res) => {
    const { roomId } = req.params;
    const room = rooms[roomId];

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.ownerId !== req.user.uid) return res.status(403).json({ error: 'Only the room owner can end and evaluate the debate.' });
    
    if (room.arguments.length === 0) {
        return res.status(400).json({ error: 'No arguments submitted to evaluate' });
    }

    let tempForScore = 0;
    let tempAgainstScore = 0;
    
    room.arguments.forEach(arg => {
        const weight = 1 + (arg.text.length > 200 ? 1 : 0);
        if (arg.side === 'FOR') tempForScore += weight;
        if (arg.side === 'AGAINST') tempAgainstScore += weight;
    });

    const aiEvaluation = await evaluateDebate(room.topic, room.arguments, room.evaluationInstructions);
    
    const finalResult = {
        ...aiEvaluation,
        rule_based_for_score: tempForScore,
        rule_based_against_score: tempAgainstScore
    };

    room.status = 'ended';
    room.evaluationResult = finalResult;

    res.json({ result: finalResult });
});

module.exports = router;
