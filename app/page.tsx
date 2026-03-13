'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from '@/components/Login';
import AdminDashboard from '@/components/AdminDashboard';
import TenantPortal from '@/components/TenantPortal';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          } else {
            // Fallback for new users
            const newUser = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              role: 'tenant',
              email: firebaseUser.email
            };
            setUser(newUser);
          }
        } catch (err) {
          console.error("Auth error:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Initializing Systems...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <TenantPortal user={user} onLogout={handleLogout} />
      )}
    </>
  );
}
