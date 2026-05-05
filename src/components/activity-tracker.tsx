'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function ActivityTracker() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const { firestore } = useFirebase();
  const lastPath = useRef<string>('');

  const logActivity = (action: string) => {
    // Don't log if no user or if it's the admin
    if (!user || user.email === 'iunlockapple01@gmail.com') return;

    // Prioritize locally cached IP/Country for session consistency
    let ip = typeof window !== 'undefined' ? localStorage.getItem('detected_ip') || 'unknown' : 'unknown';
    let country = typeof window !== 'undefined' ? localStorage.getItem('detected_country') || 'unknown' : 'unknown';
    
    // Only fetch if nothing has been captured yet and we're on the client
    if (ip === 'unknown' && typeof window !== 'undefined') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        fetch('https://ipapi.co/json/', { signal: controller.signal })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            clearTimeout(timeoutId);
            if (data && data.ip) {
              localStorage.setItem('detected_ip', data.ip);
              localStorage.setItem('detected_country', data.country_name || 'unknown');
            }
          })
          .catch(() => {
            clearTimeout(timeoutId);
          });
      } catch (fetchError) {
        // Fallback silently
      }
    }

    const activityData = {
      userId: user.uid,
      userEmail: user.email,
      ipAddress: ip,
      country: country,
      action: action,
      path: pathname,
      timestamp: serverTimestamp(),
    };

    // Non-blocking write
    addDoc(collection(firestore, 'activities'), activityData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'activities',
          operation: 'create',
          requestResourceData: activityData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
        const buttonText = target.innerText?.replace(/\s+/g, ' ').trim();
        const buttonTitle = target.getAttribute('title');
        const buttonLabel = target.getAttribute('aria-label');
        
        const finalName = buttonText || buttonTitle || buttonLabel || 'Action Component';
        logActivity(`Clicked: ${finalName}`);
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
