'use client';

import { useEffect, useMemo, useState } from 'react';
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

function ClientDate({ date, formatStr }: { date: Date, formatStr: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="opacity-0">...</span>;
  return <span>{format(date, formatStr)}</span>;
}

export default function AdminActivitiesPage() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Stabilize constraints to prevent infinite listener restarts
  const activityConstraints = useMemo(() => [
    orderBy('timestamp', 'desc'), 
    limit(500) 
  ], []);

  const { data: activities, loading: activitiesLoading } = useCollection<UserActivity>('activities', {
    constraints: activityConstraints
  });

  // Derived "Online" status: Users with activity in the last 5 minutes
  // We use a fixed reference time for server rendering to avoid mismatch
  const onlineUsers = useMemo(() => {
    if (!activities || !hasHydrated) return [];
    const now = Date.now();
    const activeWindow = 5 * 60 * 1000; 
    
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
  }, [activities, hasHydrated]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen bg-background">Loading...</div>;
  }

  return (
    <div className="bg-background text-foreground min-h-screen pb-12 transition-colors duration-300">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin Dashboard</Link>
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates Enabled
          </div>
        </div>

        {/* Active Now Section */}
        <section className="animate-fade-in">
          <Card className="border-green-100 dark:border-green-900/30 bg-green-50/10 dark:bg-green-950/5">
            <CardHeader className="pb-3 border-b border-green-50 dark:border-green-900/20">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-300">
                <Wifi className="h-5 w-5 text-green-600" />
                Active Sessions Now ({onlineUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {onlineUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {onlineUsers.map((u) => (
                    <div key={u.id} className="bg-card p-3 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-foreground truncate">{u.email}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">UID: {u.id.slice(0, 8)}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">ONLINE</Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-400" />
                          <span className="truncate">{u.country || 'Unknown Location'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-blue-500">
                          <Globe className="h-3 w-3" />
                          {u.ip}
                        </div>
                      </div>
                      <div className="mt-1 pt-2 border-t border-muted/50">
                        <p className="text-[9px] uppercase font-black text-muted-foreground/50 tracking-tighter mb-0.5">Last Interaction</p>
                        <p className="text-[10px] text-foreground font-medium truncate italic">"{u.lastAction}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-muted/20" />
                  <p>No users currently active on the site.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Activity Log Table */}
        <Card className="border-border">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Real-time Activity Feed (Last 500)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activitiesLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading activities...</div>
            ) : activities && activities.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Time</TableHead>
                    <TableHead className="text-foreground">User</TableHead>
                    <TableHead className="text-foreground">Network</TableHead>
                    <TableHead className="text-foreground">Country</TableHead>
                    <TableHead className="text-foreground">Action</TableHead>
                    <TableHead className="text-foreground">Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map(act => (
                    <TableRow key={act.id} className="border-border hover:bg-muted/20">
                      <TableCell className="text-[10px] whitespace-nowrap text-muted-foreground">
                        {act.timestamp?.toDate ? (
                          <ClientDate date={act.timestamp.toDate()} formatStr="HH:mm:ss (MMM dd)" />
                        ) : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">{act.userEmail}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{act.userId.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                          <Globe className="h-3 w-3" />
                          {act.ipAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] gap-1 border-border text-foreground">
                          <MapPin className="h-2 w-2 text-red-500" />
                          {act.country || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-foreground">{act.action}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{act.path}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">No activity recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
