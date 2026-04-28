
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, Send, Users, User, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function AdminNotificationsPage() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const { data: allUsers } = useCollection<any>('users');

  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  const handleSend = async () => {
    if (!message.trim()) return toast({ title: "Message Required" });
    if (targetType === 'specific' && !selectedUser) return toast({ title: "User Required" });

    setIsSubmitting(true);
    try {
      const notifData = {
        userId: targetType === 'all' ? 'all' : selectedUser,
        message: message.trim(),
        createdAt: serverTimestamp(),
        readBy: []
      };

      await addDoc(collection(firestore, 'notifications'), notifData);
      toast({ title: "Notification Sent Successfully!" });
      setMessage('');
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to send notification.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || !user || !isAdmin) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <Link href="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-3xl font-bold">Broadcast Notifications</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="text-primary h-5 w-5" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="flex gap-4">
                <Button 
                  variant={targetType === 'all' ? 'default' : 'outline'} 
                  className="flex-1 gap-2"
                  onClick={() => setTargetType('all')}
                >
                  <Users className="h-4 w-4" /> All Users
                </Button>
                <Button 
                  variant={targetType === 'specific' ? 'default' : 'outline'} 
                  className="flex-1 gap-2"
                  onClick={() => setTargetType('specific')}
                >
                  <User className="h-4 w-4" /> Specific User
                </Button>
              </div>
            </div>

            {targetType === 'specific' && (
              <div className="space-y-2 animate-fade-in">
                <Label>Select Recipient</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.email} ({u.displayName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notification Message</Label>
              <Textarea 
                placeholder="Type your announcement here..." 
                className="min-h-[150px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 italic">This message will appear as a popup for online users.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSend} className="w-full btn-primary text-white h-12" disabled={isSubmitting}>
              {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
