'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Building2, ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Hardcoded Admin Credentials check
    const isValidAdmin = (username === 'admin' || username === '0564436581') && 
                        (password === 'password@' || password === 'Admin@0011');

    if (isValidAdmin) {
      try {
        const adminEmail = 'admin@rentrevision.pro';
        const loginPassword = password === 'password@' ? 'Admin@0011' : password;
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, adminEmail, loginPassword);
        } catch (err: any) {
          if (err.code === 'auth/operation-not-allowed') {
            throw new Error('Email/Password login is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
          }
          
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, adminEmail, loginPassword);
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: 'MD RAFI-AL MOKIB',
                role: 'admin',
                phone: '0564436581',
                email: adminEmail,
                createdAt: new Date().toISOString()
              });
            } catch (createErr: any) {
              if (createErr.code === 'auth/operation-not-allowed') {
                throw new Error('Email/Password login is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
              }
              throw err;
            }
          } else {
            throw err;
          }
        }
        
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        onLogin(userDoc.data() || { uid: userCredential.user.uid, name: 'MD RAFI-AL MOKIB', role: 'admin' });
      } catch (err: any) {
        console.error("Admin login error:", err);
        setError(err.message || 'Login failed');
      }
    } else {
      // 2. Tenant ID/Password check (Search by Phone)
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'users'), where('phone', '==', username), where('password', '==', password));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          onLogin({ id: querySnapshot.docs[0].id, ...userData });
        } else {
          setError('Invalid credentials. Please check your ID and Password.');
        }
      } catch (err) {
        console.error("Tenant login error:", err);
        setError('Login failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        onLogin(userDoc.data());
      } else {
        // New user defaults to tenant, unless it's the owner email
        const userData = {
          uid: user.uid,
          name: user.displayName || 'New Tenant',
          email: user.email,
          role: user.email === 'mokibmirda@gmail.com' ? 'admin' : 'tenant',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), userData);
        onLogin(userData);
      }
    } catch (err) {
      setError('Google login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/30">
              <Building2 className="text-cyan-400 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Rent Revision Pro</h1>
            <p className="text-slate-400 text-sm mt-2 text-center">AI-Powered Property Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">User ID / Phone</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ID or Phone"
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or Social Login</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <Image 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              width={20} 
              height={20} 
              alt="Google" 
              referrerPolicy="no-referrer"
            />
            Continue with Google
          </button>

          <p className="text-[10px] text-slate-500 text-center mt-4 px-4">
            <span className="text-cyan-400 font-semibold">Tip:</span> Owner (mokibmirda@gmail.com) can log in via Google to get instant Admin access.
          </p>

          <div className="mt-8 flex justify-center">
            <button className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Install App (PWA)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
