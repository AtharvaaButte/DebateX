import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Login from './pages/Login';
import Home from './pages/Home';
import Room from './pages/Room';
import Debate from './pages/Debate';
import Result from './pages/Result';
import SetupProfile from './pages/SetupProfile';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/ui/Navbar';
import { Demo } from './components/blocks/demo';

export default function App() {
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Securely capture and cache token mapping for the rest of the application API usage
        const token = await user.getIdToken();
        localStorage.setItem('debate_token', token);
        localStorage.setItem('debate_uid', user.uid);
      } else {
        localStorage.removeItem('debate_token');
        localStorage.removeItem('debate_uid');
      }
      setAuthInitialized(true);
    });

    return () => unsub();
  }, []);

  if (!authInitialized) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Initializing Application...</div>;
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col">
        <Navbar />
        <main className="flex-1 w-full mx-auto relative flex flex-col">
          <Routes>
            <Route path="/" element={<Demo />} />
            <Route path="/rooms" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/debate/:roomId" element={<Debate />} />
            <Route path="/result/:roomId" element={<Result />} />
            <Route path="/profile" element={<SetupProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
