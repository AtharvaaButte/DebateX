import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { getProfile } from '@/services/api';

export default function LoginForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (localStorage.getItem('debate_token')) {
          getProfile().then(() => navigate('/')).catch(() => navigate('/profile'));
        }
    }, [navigate]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            setTimeout(async () => {
                try {
                    await getProfile();
                    navigate('/');
                } catch { navigate('/profile'); }
            }, 100);
        } catch { setLoading(false); }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);

        try {
            if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
            else await signInWithEmailAndPassword(auth, email, password);
            setTimeout(async () => {
                try { await getProfile(); navigate('/'); } 
                catch { navigate('/profile'); }
            }, 100);
        } catch { setLoading(false); }
    };

    return (
        <div className="flex h-screen w-full fixed inset-0 z-[100] bg-white">
            <div className="w-full hidden md:inline-block h-full border-r border-gray-200">
                <img className="h-full w-full object-cover" src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/leftSideImage.png" alt="leftSideImage" />
            </div>
        
            <div className="w-full h-full flex flex-col items-center justify-center bg-white">
        
                <form onSubmit={handleEmailAuth} className="md:w-96 w-80 flex flex-col items-center justify-center">
                    <h2 className="text-4xl text-gray-900 font-medium">{isSignUp ? 'Create account' : 'Sign in'}</h2>
                    <p className="text-sm text-gray-500/90 mt-3">{isSignUp ? 'Fill out your details to continue' : 'Welcome back! Please sign in to continue'}</p>
        
                    <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full mt-8 bg-gray-100 border border-gray-300 flex items-center justify-center h-12 rounded-full hover:bg-gray-200 transition-colors">
                        <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
                    </button>
        
                    <div className="flex items-center gap-4 w-full my-5">
                        <div className="w-full h-px bg-gray-300/90"></div>
                        <p className="w-full text-nowrap text-sm text-gray-500/90">or {isSignUp ? 'create account' : 'sign in'} with email</p>
                        <div className="w-full h-px bg-gray-300/90"></div>
                    </div>
        
                    <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 focus-within:border-gray-500 transition-colors">
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
                        </svg>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email id" className="bg-transparent text-gray-900 placeholder-gray-500/80 outline-none text-sm w-full h-full" required />                 
                    </div>
        
                    <div className="flex items-center mt-6 w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 focus-within:border-gray-500 transition-colors">
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
                        </svg>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="bg-transparent text-gray-900 placeholder-gray-500/80 outline-none text-sm w-full h-full" required />
                    </div>
        
                    {!isSignUp && (
                        <div className="w-full flex items-center justify-start mt-8 text-gray-500/80">
                            <div className="flex items-center gap-2">
                                <input className="h-5 accent-primary" type="checkbox" id="checkbox" />
                                <label className="text-sm cursor-pointer" htmlFor="checkbox">Remember me</label>
                            </div>
                        </div>
                    )}
        
                    <button type="submit" disabled={loading} className="mt-8 w-full h-11 rounded-full text-white bg-[#6e56cf] hover:opacity-90 transition-opacity">
                        {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Login')}
                    </button>
                    
                    <p className="text-gray-500/90 text-sm mt-4">
                        {isSignUp ? 'Already have an account? ' : 'Don’t have an account? '}
                        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[#6e56cf] hover:underline font-medium">
                            {isSignUp ? 'Sign in' : 'Create account'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
