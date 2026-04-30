
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { Bell, X, Clock, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: any;
  readBy: string[];
}

export function NotificationDropdown() {
  const { data: user } = useUser();
  const { firestore } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  // Memoize constraints to prevent infinite loops
  const constraints = useMemo(() => [orderBy('createdAt', 'desc')], []);

  const { data: notifications } = useCollection<Notification>('notifications', {
    constraints: constraints
  });

  const filteredNotifications = useMemo(() => {
    if (!user || !notifications) return [];
    return notifications.filter(n => n.userId === 'all' || n.userId === user.uid);
  }, [user, notifications]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return filteredNotifications.filter(n => !n.readBy?.includes(user.uid)).length;
  }, [user, filteredNotifications]);

  // Handle external triggers to open the tray
  useEffect(() => {
    const handleOpenTrigger = (e: any) => {
      setIsOpen(true);
      if (e.detail?.newId) {
        setHighlightedIds(prev => Array.from(new Set([...prev, e.detail.newId])));
      }
    };

    window.addEventListener('open-notification-tray', handleOpenTrigger);
    return () => window.removeEventListener('open-notification-tray', handleOpenTrigger);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // When the tray is closed, clear the session highlights
    if (!open) {
      setHighlightedIds([]);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !filteredNotifications) return;
    const unread = filteredNotifications.filter(n => !n.readBy?.includes(user.uid));
    
    unread.forEach(n => {
      const ref = doc(firestore, 'notifications', n.id);
      updateDoc(ref, {
        readBy: arrayUnion(user.uid)
      });
    });
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    const ref = doc(firestore, 'notifications', id);
    await updateDoc(ref, {
      readBy: arrayUnion(user.uid)
    });
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group">
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            unreadCount > 0 ? "text-primary fill-primary/10" : "text-gray-600 group-hover:text-primary"
          )} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white items-center justify-center font-bold shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-[400px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 rounded-t-md">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">System Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-600 border-blue-100">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 font-bold"
                onClick={markAllAsRead}
              >
                Clear Unread
              </Button>
            )}
            <PopoverClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </Button>
            </PopoverClose>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notif) => {
                const isRead = notif.readBy?.includes(user.uid);
                const isHighlighted = highlightedIds.includes(notif.id);

                return (
                  <div 
                    key={notif.id} 
                    className={cn(
                        "p-4 transition-colors cursor-pointer relative",
                        !isRead ? "bg-blue-50/20 hover:bg-blue-50/40" : "hover:bg-gray-50",
                        isHighlighted && "ring-2 ring-inset ring-primary/20 bg-blue-100/30"
                    )}
                    onClick={() => markAsRead(notif.id)}
                  >
                    {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                    <div className="flex gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                        !isRead ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-400"
                      )}>
                        <Info className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 overflow-hidden flex-1">
                        <div className="flex justify-between items-start gap-2">
                            <p className={cn(
                                "text-xs leading-relaxed flex-1",
                                !isRead ? "text-gray-900 font-bold" : "text-gray-500"
                            )}>
                            {notif.message}
                            </p>
                            {isHighlighted && (
                                <Badge className="bg-primary text-white text-[9px] animate-pulse">NEW</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                          <Clock className="h-3 w-3" />
                          {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), 'MMM dd, p') : 'Just now'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center text-gray-300">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Your notification tray is empty</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t bg-gray-50 text-center rounded-b-md">
            <p className="text-[10px] text-gray-400 font-medium tracking-tight">Stay updated with the latest service news.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
