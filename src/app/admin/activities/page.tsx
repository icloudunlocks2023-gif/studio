
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity, Clock, Globe, MapPin, Wifi, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { orderBy, limit } from 'firebase/firestore';

interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  country: string;
  action: string;
  path: string;
  timestamp: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function AdminActivitiesPage() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: activities, loading: activitiesLoading } = useCollection<UserActivity>('activities', {
    constraints: [orderBy('timestamp', 'desc'), limit(100)]
  });

  // Derived "Online" status: Users with activity in the last 5 minutes
  const onlineUsers = useMemo(() => {
    if (!activities) return [];
    const now = Date.now();
    const activeWindow = 5 * 60 * 1000; // 5 minute window for "online"
    
    const uniqueUsers = new Map();
    
    activities.forEach(act => {
      const timestamp = act.timestamp?.toDate ? act.timestamp.toDate().getTime() : now;
      if (now - timestamp < activeWindow) {
        if (!uniqueUsers.has(act.userId)) {
          uniqueUsers.set(act.userId, {
            id: act.userId,
            email: act.userEmail,
            ip: act.ipAddress,
            country: act.country,
            lastSeen: timestamp,
            lastAction: act.action
          });
        }
      }
    });
    
    return Array.from(uniqueUsers.values());
  }, [activities]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <Link href="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">User Activity & Live Monitoring</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates Enabled
          </div>
        </div>

        {/* Active Now Section */}
        <section className="animate-fade-in">
          <Card className="border-green-100 bg-green-50/10">
            <CardHeader className="pb-3 border-b border-green-50">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <Wifi className="h-5 w-5 text-green-600" />
                Active Sessions Now ({onlineUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {onlineUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {onlineUsers.map((u) => (
                    <div key={u.id} className="bg-white p-3 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-gray-900 truncate">{u.email}</span>
                          <span className="text-[10px] text-gray-400 font-mono">UID: {u.id.slice(0, 8)}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-5 bg-green-50 text-green-700 border-green-200">ONLINE</Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-400" />
                          <span className="truncate">{u.country || 'Unknown Location'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-blue-500">
                          <Globe className="h-3 w-3" />
                          {u.ip}
                        </div>
                      </div>
                      <div className="mt-1 pt-2 border-t border-gray-50">
                        <p className="text-[9px] uppercase font-black text-gray-300 tracking-tighter mb-0.5">Last Interaction</p>
                        <p className="text-[10px] text-gray-700 font-medium truncate italic">"{u.lastAction}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-gray-200" />
                  <p>No users currently active on the site.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Activity Log Table */}
        <Card>
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Real-time Activity Feed (Last 100)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activitiesLoading ? (
              <div className="p-8 text-center">Loading activities...</div>
            ) : activities && activities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map(act => (
                    <TableRow key={act.id}>
                      <TableCell className="text-[10px] whitespace-nowrap">
                        {act.timestamp?.toDate ? format(act.timestamp.toDate(), 'HH:mm:ss (MMM dd)') : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{act.userEmail}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{act.userId.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-blue-600">
                          <Globe className="h-3 w-3" />
                          {act.ipAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <MapPin className="h-2 w-2" />
                          {act.country || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-gray-700">{act.action}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{act.path}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-gray-500">No activity recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
