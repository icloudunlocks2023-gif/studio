'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useCollection } from '@/firebase';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationListener() {
  const { data: user } = useUser();
  const [showPopup, setShowPopup] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Memoize constraints to prevent infinite loops
  const constraints = useMemo(() => [], []);

  const { data: notifications } = useCollection<any>('notifications', { constraints });

  // 1. Detection logic: Identifies when a truly new notification has arrived
  useEffect(() => {
    if (notifications && user) {
      // Find the most recent unread notification
      const unread = notifications.filter(n => {
        const isTarget = n.userId === 'all' || n.userId === user.uid;
        const isUnread = !n.readBy?.includes(user.uid);
        return isTarget && isUnread;
      }).sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      if (unread.length > 0) {
        const latest = unread[0];
        
        // Only trigger if this is a truly new notification ID we haven't seen in this session
        if (latest.id !== lastNotificationId) {
          setLastNotificationId(latest.id);
          setShowPopup(true);
        }
      }
    }
  }, [notifications, user, lastNotificationId]);

  // 2. Timer logic: Manages the visibility duration independently of data refreshes
  useEffect(() => {
    if (showPopup && lastNotificationId) {
      // Show popup for exactly 4 seconds
      const popupTimer = setTimeout(() => {
        handleTriggerTray();
      }, 4000);

      return () => clearTimeout(popupTimer);
    }
  }, [showPopup, lastNotificationId]);

  const handleTriggerTray = () => {
    setShowPopup(false);
    // Trigger the dropdown tray to open automatically
    const event = new CustomEvent('open-notification-tray', { 
        detail: { newId: lastNotificationId } 
    });
    window.dispatchEvent(event);
  };

  if (!user || !showPopup) return null;

  return (
    <div 
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 cursor-pointer"
      onClick={handleTriggerTray}
    >
      <div className="bg-primary text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md hover:scale-105 transition-transform active:scale-95">
        <div className="relative">
            <Bell className="h-4 w-4 fill-white/20" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
        </div>
        <span className="text-sm font-bold tracking-tight uppercase">New Notification</span>
      </div>
    </div>
  );
}