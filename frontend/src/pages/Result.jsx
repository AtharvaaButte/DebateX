import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResult } from '../services/api';

export default function Result() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRes = async () => {
      try {
        const res = await getResult(roomId);
        setResultData(res.result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRes();
  }, [roomId]);

  if (loading) return <h2>Evaluating AI metrics... please wait.</h2>;
  if (error) return <div style={{ color: 'red' }}><h2>Error loading results</h2><p>{error}</p></div>;
  if (!resultData) return null;

  const winBg = resultData.winner === 'FOR' ? '#cce5ff' : resultData.winner === 'AGAINST' ? '#f8d7da' : '#fff3cd';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2>Final Evaluation</h2>
        <button onClick={() => navigate('/')} style={{ background: '#6c757d' }}>Home</button>
      </div>

      <div style={{ 
        background: winBg, 
        padding: '20px', 
        borderRadius: '8px', 
        textAlign: 'center',
        margin: '20px 0',
        border: '1px solid #ccc'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>Winner: {resultData.winner}</h1>
        <p style={{ fontStyle: 'italic', margin: 0, fontSize: '1.2rem' }}>"{resultData.reason}"</p>
      </div>

      <div className="card" style={{ background: '#fafafa', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h3>FOR Score</h3>
          <h2 style={{ color: '#0056b3' }}>{resultData.for_score || resultData.rule_based_for_score}</h2>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3>AGAINST Score</h3>
          <h2 style={{ color: '#dc3545' }}>{resultData.against_score || resultData.rule_based_against_score}</h2>
        </div>
      </div>

      <div>
        <h3>Moderator Feedback</h3>
        <div style={{ background: '#f8f9fa', padding: '15px', borderLeft: '4px solid #000', whiteSpace: 'pre-wrap' }}>
          {resultData.feedback}
        </div>
      </div>
    </div>
  );
}
