import React, { useState } from 'react';
import {
    Lock, Mail, Eye, EyeOff, Sparkles,
    ArrowRight, Shield, PieChart, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state: RootState) => state.auth);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginStart());
        try {
            const user = await authService.login(email, password);
            dispatch(loginSuccess(user));
            localStorage.setItem('finsight_user', JSON.stringify(user));
            navigate('/dashboard');
        } catch (err: any) {
            dispatch(loginFailure(err.message));
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#020617] relative overflow-hidden">
            {/* Animated Background Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -40, 0],
                    y: [0, 60, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-premium p-10 rounded-[40px] border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-10">
                        <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.8 }}
                            className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-vivid mb-4"
                        >
                            <PieChart className="text-white" size={32} />
                        </motion.div>
                        <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                            FinSight<span className="text-indigo-500">.</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Enterprise Neural Finance Intelligence
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1 mb-2 block">
                                Access Credentials
                            </span>

                            <div className="relative mb-4">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail size={18} className="text-slate-500" />
                                </div>
                                <Input
                                    type="email"
                                    placeholder="email@enterprise.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-white/5 rounded-2xl border-white/5 text-white hover:bg-white/10 transition-colors h-12"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock size={18} className="text-slate-500" />
                                </div>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 bg-white/5 rounded-2xl border-white/5 text-white hover:bg-white/10 transition-colors h-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl p-3 text-sm">
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-2xl font-bold text-lg shadow-vivid text-white normal-case flex gap-3 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Establish Neural Link
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Footer Shortcuts */}
                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4 text-center">
                        <span className="text-slate-600 text-xs uppercase tracking-widest font-bold">
                            Demo Environments
                        </span>
                        <div className="flex justify-center gap-4 text-[10px] font-mono">
                            <span className="text-indigo-400/60 cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => { setEmail('admin@nyx.ai'); setPassword('password123'); }}>ADMIN</span>
                            <span className="text-slate-600 px-2">|</span>
                            <span className="text-emerald-400/60 cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => { setEmail('analyst@nyx.ai'); setPassword('password123'); }}>ANALYST</span>
                            <span className="text-slate-600 px-2">|</span>
                            <span className="text-amber-400/60 cursor-pointer hover:text-amber-400 transition-colors" onClick={() => { setEmail('viewer@nyx.ai'); setPassword('password123'); }}>VIEWER</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 text-slate-600">
                    <div className="flex items-center gap-1">
                        <Shield size={14} />
                        <span className="text-xs font-medium">SSL Encrypted</span>
                    </div>
                    <span className="text-xs font-medium">© 2026 NYX Cognitive Core</span>
                </div>
            </motion.div>
        </div>
    );
};
