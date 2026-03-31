const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase ID token
 * Expects Authorization: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No or invalid token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // If running without firebase configured (e.g. testing), decode instead or mock
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      name: decodedToken.name || decodedToken.email || 'Anonymous',
    };
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
  }
};

module.exports = verifyToken;
