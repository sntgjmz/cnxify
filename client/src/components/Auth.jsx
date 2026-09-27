// client/src/components/Auth.jsx
import { useState } from 'react';
import { Mic2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function Auth({ setToken }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin ? { email, password } : { email, username, password };

        try {
            const response = await fetch(apiUrl(endpoint), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (isLogin) {
                localStorage.setItem('cnxify_token', data.token);
                setToken(data.token);
            } else {
                setMessage(data.message);
                setIsLogin(true); // Switch to login view after successful registration
                setPassword(''); // Clear password for safety
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#433254] via-[#2c2137] to-[#150f1a] p-4 font-sans text-white">
            
            <div className="bg-[#21182a]/80 backdrop-blur-xl p-10 rounded-[2rem] w-full max-w-md border border-[#3b2d47] shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-[#f2cdd6] p-4 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(242,205,214,0.2)] mb-4">
                        <Mic2 size={32} className="text-[#2c2137]" />
                    </div>
                    <h2 className="text-3xl font-black text-center tracking-tight">
                        {isLogin ? 'Welcome back' : 'Join the Soundroom'}
                    </h2>
                    <p className="text-center text-gray-400 text-sm mt-2">
                        {isLogin ? 'Log in to your CNX account' : 'Register with your @concentrix.com email'}
                    </p>
                </div>
                
                {/* Status Messages */}
                {error && (
                    <div className="bg-red-950/50 border border-red-900 text-red-200 p-3 rounded-xl mb-6 text-sm text-center font-medium">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-[#3b2d47] border border-[#f2cdd6]/30 text-[#f2cdd6] p-3 rounded-xl mb-6 text-sm text-center font-medium">
                        {message}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#f2cdd6] transition-colors" size={18} />
                        <input 
                            type="email" 
                            placeholder="Email (@concentrix.com)" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#150f1a] text-white pl-12 pr-4 py-3.5 rounded-xl border border-[#3b2d47] focus:border-[#f2cdd6] outline-none transition-colors text-sm font-medium"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#f2cdd6] transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Username" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#150f1a] text-white pl-12 pr-4 py-3.5 rounded-xl border border-[#3b2d47] focus:border-[#f2cdd6] outline-none transition-colors text-sm font-medium"
                                required
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#f2cdd6] transition-colors" size={18} />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#150f1a] text-white pl-12 pr-4 py-3.5 rounded-xl border border-[#3b2d47] focus:border-[#f2cdd6] outline-none transition-colors text-sm font-medium"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="mt-4 py-4 bg-[#f2cdd6] text-[#2c2137] font-black rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                        {!isLoading && <ArrowRight size={18} strokeWidth={3} />}
                    </button>
                </form>

                {/* Toggle Link */}
                <div className="mt-8 text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setMessage('');
                        }} 
                        className="text-[#f2cdd6] font-bold hover:underline"
                    >
                        {isLogin ? 'Register here' : 'Log in here'}
                    </button>
                </div>

            </div>
            
            {/* Minimal Footer */}
            <div className="fixed bottom-6 text-xs text-gray-500 font-medium">
                For Concentrix Colleagues Only
            </div>
        </div>
    );
}
