
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity, Clock, Globe, MapPin } from 'lucide-react';
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

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">User Activities</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Live Feed (Last 100)
          </div>
        </div>

        <Card>
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Real-time Engagement
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
