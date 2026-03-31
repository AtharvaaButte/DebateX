/**
 * In-Memory Data Store for Hackathon Speed
 */

// global store mapping roomId -> room object
const rooms = {};
const profiles = {};

/**
 * Room Schema Example:
 * {
 *   roomId: string,
 *   topic: string,
 *   ownerId: string,
 *   ownerParticipates: boolean,
 *   sideSelectionMode: 'user' | 'owner' | 'auto',
 *   status: 'waiting' | 'ongoing' | 'ended',
 *   users: [ { uid: string, name: string, avatar: string, side: 'FOR' | 'AGAINST' | 'PENDING' } ],
 *   arguments: [
 *     { userId: string, side: 'FOR' | 'AGAINST', text: string, timestamp: number }
 *   ],
 *   currentTurn: string,
 *   spokenOrder: { FOR: string[], AGAINST: string[] },
 *   lastTeam: string | null,
 *   lastSpeaker: string | null,
 *   evaluationResult: null | Object
 * }
 */

const createId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

module.exports = {
  rooms,
  profiles,
  createId
};
