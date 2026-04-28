
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Bell, Info } from 'lucide-react';

export function NotificationListener() {
  const { data: user } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);

  // Constraints for global or user-specific notifications
  const constraints = useMemo(() => {
    if (!user) return [where('userId', '==', 'none')];
    // This is a simplification. For complex "all" vs "user" logic, multiple queries or client filter needed
    return []; 
  }, [user]);

  const { data: notifications } = useCollection<any>('notifications', { constraints });

  useEffect(() => {
    if (notifications && user) {
      // Find notifications the user hasn't "read" (or seen popup for)
      const unread = notifications.filter(n => {
        const isTarget = n.userId === 'all' || n.userId === user.uid;
        const isUnread = !n.readBy?.includes(user.uid);
        return isTarget && isUnread;
      });

      if (unread.length > 0) {
        setCurrentNotification(unread[0]);
        setOpen(true);
      }
    }
  }, [notifications, user]);

  const handleClose = async () => {
    if (user && currentNotification) {
      const notifRef = doc(firestore, 'notifications', currentNotification.id);
      await updateDoc(notifRef, {
        readBy: arrayUnion(user.uid)
      });
    }
    setOpen(false);
  };

  const handleView = () => {
    handleClose();
    router.push('/my-account/notifications');
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Bell className="h-5 w-5" />
            System Notification
          </DialogTitle>
          <DialogDescription>
            You have received an important update.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="p-4 bg-gray-50 border rounded-xl flex gap-3 items-start shadow-inner">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-800 leading-relaxed font-medium">
              {currentNotification?.message}
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleView} className="btn-primary text-white w-full sm:w-auto">View All Notifications</Button>
          <Button onClick={handleClose} variant="outline" className="w-full sm:w-auto">Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
