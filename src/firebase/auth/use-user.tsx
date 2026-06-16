
'use client';
import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User,
  Auth,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
  Firestore,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { FirebaseError } from 'firebase/app';

interface CustomUser extends User {
    customClaims?: {
        role?: string;
    }
}

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
            const tokenResult = await user.getIdTokenResult();
            const userWithClaims: CustomUser = { 
                ...user, 
                customClaims: tokenResult.claims as { role?: string }
            };
            setUser(userWithClaims);
        } else {
            setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { data: user, loading, error };
}

export async function signInWithEmail(auth: Auth, email:string, password:string): Promise<UserCredential | null> {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result;
    } catch(error) {
        if (error instanceof FirebaseError && error.code === 'auth/invalid-credential') {
            throw error;
        }
        throw error;
    }
}

export async function signUpWithEmail(
    auth: Auth, 
    firestore: Firestore, 
    email: string, 
    password: string, 
    displayName: string,
    extraData: {
        username: string;
        country: string;
        whatsappNumber: string;
        accountType: string;
        deviceOwnership: string;
    }
): Promise<UserCredential | null> {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Update the user's profile with the display name
        await updateProfile(user, { displayName });

        // Get accurate IP address for session
        let ipAddress = 'unknown';
        if (typeof window !== 'undefined') {
            ipAddress = localStorage.getItem('detected_ip') || 'unknown';
        }

        const userRef = doc(firestore, 'users', user.uid);
        const userData = {
            displayName: displayName,
            username: extraData.username,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
            balance: 0,
            ipAddress: ipAddress,
            country: extraData.country,
            whatsappNumber: extraData.whatsappNumber || '',
            accountType: extraData.accountType,
            deviceOwnership: extraData.deviceOwnership,
            isReseller: false,
            resellerPricingActive: false,
            createdAt: serverTimestamp()
        };

        const metricsRef = doc(firestore, 'counters', 'metrics');

        // Create profile in non-blocking way
        setDoc(userRef, userData, { merge: true }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        
        getDoc(metricsRef).then(metricsDoc => {
            if (metricsDoc.exists()) {
                const currentCount = metricsDoc.data().registeredUsers || 0;
                setDoc(metricsRef, { registeredUsers: currentCount + 1 }, { merge: true });
            } else {
                setDoc(metricsRef, { registeredUsers: 1 }, { merge: true });
            }
        });

        // Notify Telegram of New Client
        const tgMessage = `🆕 <b>New Client Signed Up!</b> 🚀\n\n<b>Name:</b> ${displayName}\n<b>Email:</b> ${email}\n<b>Country:</b> ${extraData.country}\n<b>Type:</b> ${extraData.accountType}\n<b>UID:</b> <code>${user.uid}</code>`;
        
        fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: tgMessage }),
        }).catch(err => console.error("Signup Telegram alert failed:", err));

        await user.reload();
        return result;
    } catch (error) {
        console.error('Error signing up with email', error);
        throw error;
    }
}

export async function signOut(auth: Auth) {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out', error);
  }
}
