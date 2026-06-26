'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, Clock, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  message: string;
  link?: string;
  createdAt: any;
  readBy: string[];
}

export default function UserNotificationsPage() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();

  // Memoize constraints to prevent infinite loop of listener restarts
  const constraints = useMemo(() => [orderBy('createdAt', 'desc')], []);

  const { data: notifications, loading: notificationsLoading } = useCollection<Notification>('notifications', {
    constraints: constraints
  });

  const filteredNotifications = useMemo(() => {
    if (!user || !notifications) return [];
    return notifications.filter(n => n.userId === 'all' || n.userId === user.uid);
  }, [user, notifications]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/my-account/notifications');
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <Link href="/my-account" className="text-sm font-medium hover:text-blue-600 transition-colors">My Account</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/my-account"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-3xl font-bold">System Notifications</h1>
        </div>

        <div className="space-y-4">
          {notificationsLoading ? (
            <div className="p-12 text-center text-gray-500">Loading history...</div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notif => (
              <Card key={notif.id} className={cn("hover:shadow-md transition-shadow", !notif.readBy?.includes(user.uid) && "border-l-4 border-l-primary")}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), 'PPP p') : 'Recent'}
                    </div>
                    {!notif.readBy?.includes(user.uid) && (
                      <Badge className="bg-primary text-white text-[10px]">NEW</Badge>
                    )}
                  </div>
                  <p className="text-gray-800 leading-relaxed font-medium">{notif.message}</p>
                  
                  {notif.link && (
                    <div className="mt-4">
                      <a 
                        href={notif.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Attached Link
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-inner border border-dashed">
              <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No system notifications found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
