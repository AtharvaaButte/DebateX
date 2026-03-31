import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, startDebate, assignSide, addBot } from '../services/api';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Bot states
  const [botName, setBotName] = useState('');
  const [botSide, setBotSide] = useState('FOR');
  const [addingBot, setAddingBot] = useState(false);

  const myUid = localStorage.getItem('debate_uid');

  useEffect(() => {
    let isMounted = true;
    const fetchRoom = async () => {
      try {
        const res = await getRoom(roomId);
        if (!isMounted) return;
        
        if (res.room.status === 'ongoing') {
           navigate(`/debate/${roomId}`);
        } else if (res.room.status === 'ended') {
           navigate(`/result/${roomId}`);
        }
        setRoom(res.room);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 3000); // refresh users list & status
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, navigate]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startDebate(roomId);
      navigate(`/debate/${roomId}`);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleAssign = async (userId, newSide) => {
    try {
      await assignSide(roomId, userId, newSide);
      const res = await getRoom(roomId);
      setRoom(res.room);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddBot = async (e) => {
    e.preventDefault();
    if (!botName.trim()) return;
    setAddingBot(true);
    try {
      await addBot(roomId, botName, botSide);
      setBotName('');
      const res = await getRoom(roomId);
      setRoom(res.room);
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingBot(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading room data...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  if (!room) return null;

  const isOwner = room.ownerId === myUid;
  const canStart = room.users.length >= 2;

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
         <h2>Room: {room.roomId}</h2>
         <span style={{background: '#eee', padding: '4px 8px', borderRadius: '4px'}}>{room.status}</span>
      </div>
      
      <h3>Topic: <i>{room.topic}</i></h3>
      {room.topicBrief && <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.4', background: '#f4f6f8', padding: '10px', borderRadius: '4px' }}>{room.topicBrief}</p>}
      <p>Side Selection Mode: <strong>{room.sideSelectionMode.toUpperCase()}</strong></p>
      {room.evaluationInstructions && (
         <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555', marginTop: '0' }}>Rules: {room.evaluationInstructions}</p>
      )}
      
      <div>
        <h4>Participants ({room.users.length}/8):</h4>
        <ul>
          {room.users.map((u, i) => (
            <li key={i} style={{ marginBottom: '10px' }}>
              <img src={u.avatar} alt={`${u.name}'s avatar`} onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} style={{ width: '24px', height: '24px', borderRadius: '50%', verticalAlign: 'middle', marginRight: '8px', background: '#eee' }} />
              {u.name} {u.isBot && <strong style={{ color: '#8b0000', fontSize: '0.8rem', verticalAlign: 'middle', marginLeft: '5px' }}>(BOT)</strong>} - <strong>{u.side}</strong>
              {isOwner && u.side === 'PENDING' && (
                 <span style={{ marginLeft: '15px' }}>
                   <button onClick={() => handleAssign(u.uid, 'FOR')} style={{ padding: '2px 8px', fontSize: '0.8rem', marginRight: '5px', background: '#0066cc' }}>Assign FOR</button>
                   <button onClick={() => handleAssign(u.uid, 'AGAINST')} style={{ padding: '2px 8px', fontSize: '0.8rem', background: '#dc3545' }}>Assign AGAINST</button>
                 </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isOwner && room.status === 'waiting' && room.users.filter(u => u.isBot).length < 3 && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px', background: '#f8f9fa' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Add AI Bot User</h4>
          <form onSubmit={handleAddBot} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input placeholder="Bot Persona/Name" value={botName} onChange={e => setBotName(e.target.value)} style={{ flex: 1, padding: '8px' }} />
            <select value={botSide} onChange={e => setBotSide(e.target.value)} style={{ padding: '8px' }}>
              <option value="FOR">FOR</option>
              <option value="AGAINST">AGAINST</option>
            </select>
            <button type="submit" disabled={addingBot} style={{ background: '#17a2b8' }}>
              {addingBot ? 'Adding...' : 'Add Bot'}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <button onClick={() => navigate('/')} style={{ background: '#6c757d', marginRight: '10px' }}>
          Back to Home
        </button>
        {isOwner && (
          <button onClick={handleStart} disabled={starting || !canStart} style={{ background: '#28a745' }}>
            {starting ? 'Starting...' : canStart ? 'Start Debate' : 'Waiting for more players...'}
          </button>
        )}
        {!isOwner && <span style={{ color: '#666', fontStyle: 'italic', marginLeft: '10px' }}>Waiting for owner to start debate...</span>}
      </div>
    </div>
  );
}
