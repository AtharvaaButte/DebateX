import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom, getCurrentUser, suggestTopic } from '../services/api';
import CreateRoomForm from '../components/blocks/create-room-form';
import { DoorOpen } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [topic, setTopic] = useState('');
  const [topicBrief, setTopicBrief] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [sideSelectionMode, setSideSelectionMode] = useState('auto');
  const [ownerParticipates, setOwnerParticipates] = useState(true);
  const [evaluationInstructions, setEvaluationInstructions] = useState('');
  
  const [joinId, setJoinId] = useState('');
  const [joinSide, setJoinSide] = useState('FOR');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
      } catch (err) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!topic) return setError('Topic required');
    setLoading(true);
    setError('');
    try {
      const res = await createRoom(topic, sideSelectionMode, ownerParticipates, evaluationInstructions);
      navigate(`/debate/${res.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async (e) => {
    e.preventDefault();
    setSuggesting(true);
    setError('');
    try {
      const res = await suggestTopic();
      setTopic(res.topic);
      setTopicBrief(res.brief);
    } catch (err) {
      setError('Topic generation failed: ' + err.message);
    } finally {
      setSuggesting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinId) return setError('Room ID required');
    setLoading(true);
    setError('');
    try {
      const res = await joinRoom(joinId, joinSide);
      navigate(`/debate/${res.room.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">Dashboard</h2>
      </div>
      
      {error && <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">Error: {error}</p>}

      <CreateRoomForm
        topic={topic}
        topicBrief={topicBrief}
        sideSelectionMode={sideSelectionMode}
        ownerParticipates={ownerParticipates}
        evaluationInstructions={evaluationInstructions}
        loading={loading}
        suggesting={suggesting}
        onTopicChange={(value) => {
          setTopic(value);
          setTopicBrief('');
        }}
        onSideSelectionModeChange={setSideSelectionMode}
        onOwnerParticipatesChange={setOwnerParticipates}
        onEvaluationInstructionsChange={setEvaluationInstructions}
        onSuggest={handleSuggest}
        onSubmit={handleCreate}
      />

      <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <DoorOpen className="h-5 w-5 text-primary" />
          Join Existing Room
        </h3>
        <form onSubmit={handleJoin} className="flex flex-col gap-3 md:flex-row md:items-center">
          <input placeholder="Room ID" value={joinId} onChange={e => setJoinId(e.target.value)} className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm shadow-black/5" />
          <select value={joinSide} onChange={e => setJoinSide(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm shadow-black/5">
            <option value="FOR">Join as FOR</option>
            <option value="AGAINST">Join as AGAINST</option>
          </select>
          <button type="submit" disabled={loading} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? 'Joining...' : 'Join Room'}</button>
        </form>
      </div>
    </div>
  );
}
