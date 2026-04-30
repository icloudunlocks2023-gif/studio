'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function ActivityTracker() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const { firestore } = useFirebase();
  const lastPath = useRef<string>('');

  const logActivity = async (action: string) => {
    // Don't log if no user or if it's the admin
    if (!user || user.email === 'iunlockapple01@gmail.com') return;

    try {
      let ip = 'unknown';
      let country = 'unknown';
      
      try {
        // Use a controller to prevent the fetch from hanging indefinitely
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (ipRes.ok) {
          const data = await ipRes.json();
          ip = data.ip || 'unknown';
          country = data.country_name || 'unknown';
        }
      } catch (fetchError) {
        // Fallback silently if the external API is blocked or offline
        console.warn('Geolocation lookup failed, using fallback.');
      }

      await addDoc(collection(firestore, 'activities'), {
        userId: user.uid,
        userEmail: user.email,
        ipAddress: ip,
        country: country,
        action: action,
        path: pathname,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      // Catch firestore errors but don't crash the UI
      console.error('Failed to log activity:', e);
    }
  };

  useEffect(() => {
    if (pathname !== lastPath.current) {
      logActivity(`Visited ${pathname}`);
      lastPath.current = pathname;
    }
  }, [pathname, user]);

  useEffect(() => {
    const handleAction = (e: any) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const text = e.target.innerText || e.target.closest('button')?.innerText || 'Unknown Button';
        logActivity(`Clicked button: ${text}`);
      }
    };

    window.addEventListener('click', handleAction);
    return () => window.removeEventListener('click', handleAction);
  }, [user, pathname]);

  return null;
}
