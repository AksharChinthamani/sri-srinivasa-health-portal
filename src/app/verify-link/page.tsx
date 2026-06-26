'use client';
import { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

export default function VerifyLinkPage() {
  const [status, setStatus] = useState('Verifying your login link...');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleVerify = async () => {
      // 1. Check if the link is a valid Firebase email link
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        // 2. If email is missing from storage (e.g. user opened link on a different device)
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }

        if (!email) {
          setError('Email is required to sign in.');
          setStatus('');
          return;
        }

        try {
          // 3. Complete the sign in
          const result = await signInWithEmailLink(auth, email, window.location.href);
          
          // Clear email from storage
          window.localStorage.removeItem('emailForSignIn');
          
          setStatus('Authentication successful! Routing to dashboard...');

          // 4. Fetch the user's role from Firestore to route them
          const userDocRef = doc(db, 'users', result.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          let role = 'PATIENT'; // default fallback
          
          if (userDoc.exists()) {
            role = userDoc.data().role || 'PATIENT';
          } else {
            // New user signed up via link without registration
            // Create a basic patient document
            await setDoc(userDocRef, {
              uid: result.user.uid,
              email: result.user.email,
              name: email.split('@')[0], // Basic name fallback
              role: 'PATIENT',
              createdAt: new Date().toISOString()
            });
          }

          // 5. Redirect based on role
          const roleMap: Record<string, string> = {
            ADMIN: '/admin/dashboard',
            PHARMACIST: '/pharmacy/dashboard',
            PATIENT: '/patient/dashboard',
            DOCTOR: '/doctor/dashboard',
            STAFF: '/staff/dashboard',
          };
          
          // Note: Wait slightly to let AuthContext pick up the state change if needed
          setTimeout(() => {
             router.push(roleMap[role] || '/patient/dashboard');
          }, 500);
          
        } catch (err: any) {
          console.error('Error signing in with email link', err);
          if (err instanceof FirebaseError && err.code === 'auth/invalid-action-code') {
            setError('This login link is invalid or has already been used. Please request a new one.');
          } else {
             setError(err.message || 'Failed to authenticate.');
          }
          setStatus('');
        }
      } else {
        setError('This is not a valid sign-in link.');
        setStatus('');
      }
    };

    handleVerify();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center space-y-4">
        {status && (
          <div className="flex flex-col items-center gap-3">
             <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
             <h2 className="text-xl font-bold text-slate-200">{status}</h2>
          </div>
        )}
        
        {error && (
          <div className="space-y-4">
             <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 font-medium">
               {error}
             </div>
             <button 
               onClick={() => router.push('/login')}
               className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold transition"
             >
               Return to Login
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
