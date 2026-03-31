import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthorFormCard } from '../components/ui/author-form-card';

export default function SetupProfile() {
    const navigate = useNavigate();
    const { refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFormSubmit = async (data) => {
        setError('');
        setLoading(true);
        try {
            await setupProfile({ username: data.name, avatar: data.imageUrl, bio: data.title });
            await refreshProfile();
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to setup profile.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] w-full items-center justify-center bg-background p-4 relative">
             <div className="w-full max-w-lg">
                {error && <div className="mb-6 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md animate-in fade-in">{error}</div>}
                {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"><div className="animate-pulse font-medium text-lg">Saving profile...</div></div>}
                
                {/* Dynamically loads smoothly independent of dialog buttons exactly matching the requirement */}
                <AuthorFormCard onSubmit={handleFormSubmit} />
             </div>
        </div>
    );
}
