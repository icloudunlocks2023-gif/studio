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
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (ipRes.ok) {
          const data = await ipRes.json();
          ip = data.ip || 'unknown';
          country = data.country_name || 'unknown';
        }
      } catch (fetchError) {
        // Fallback silently if the external API is blocked or offline
        console.warn('Geolocation lookup failed in Activity Tracker.');
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
      const target = e.target.closest('button');
      if (target) {
        // Extract meaningful text from buttons
        const buttonText = target.innerText.replace(/\s+/g, ' ').trim();
        const buttonTitle = target.getAttribute('title');
        const buttonLabel = target.getAttribute('aria-label');
        
        const finalName = buttonText || buttonTitle || buttonLabel || 'Icon Action';
        logActivity(`Clicked button: ${finalName}`);
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail?.action) {
        logActivity(e.detail.action);
      }
    };

    window.addEventListener('click', handleAction);
    window.addEventListener('user-activity-log', handleCustomEvent);
    
    return () => {
      window.removeEventListener('click', handleAction);
      window.removeEventListener('user-activity-log', handleCustomEvent);
    };
  }, [user, pathname]);

  return null;
}
