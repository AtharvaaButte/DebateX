const path = require('path');
// Ensure dotenv is the absolute FIRST thing evaluated, and explicitly point to backend root
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log(path.resolve(__dirname, '../.env'));

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

console.log('--- ENV VERIFICATION ---');
console.log('GEMINI_API_KEY Loaded:', process.env.GEMINI_API_KEY 
  ? `YES (Starts with ${process.env.GEMINI_API_KEY.substring(0, 5)}...)` 
  : 'NO (Undefined!)');
console.log('------------------------');

// Initialize Firebase Admin (Only if service account is provided)
// For hackathon: Provide this via path or env JSON
try {
  const serviceAccount = require(`../${process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json'}`);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized.');
} catch (error) {
  console.warn('Warning: Firebase Admin not initialized. Provide serviceAccountKey.json.');
}

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const roomsRoutes = require('./routes/rooms');
const debateRoutes = require('./routes/debate');
const aiRoutes = require('./routes/ai');

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/rooms', roomsRoutes);
app.use('/debate', debateRoutes);
app.use('/ai', aiRoutes);

// General healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
