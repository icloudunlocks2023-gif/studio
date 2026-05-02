
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, Send, Users, User, Loader, Search, Link as LinkIcon } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users based on search term (ID, Email, or Name)
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm.trim()) return allUsers;
    const term = searchTerm.toLowerCase();
    return allUsers.filter((u: any) => 
      u.id.toLowerCase().includes(term) || 
      u.email?.toLowerCase().includes(term) || 
      u.displayName?.toLowerCase().includes(term)
    );
  }, [allUsers, searchTerm]);

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
        link: link.trim() || null,
        createdAt: serverTimestamp(),
        readBy: []
      };

      await addDoc(collection(firestore, 'notifications'), notifData);
      toast({ title: "Notification Sent Successfully!" });
      setMessage('');
      setLink('');
      setSelectedUser('');
      setSearchTerm('');
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
              <div className="space-y-3 animate-fade-in border-l-4 border-primary/20 pl-4 py-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                    <Search className="h-3 w-3" />
                    Search Recipient (ID, Email or Name)
                  </Label>
                  <Input 
                    placeholder="Type user details..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 shadow-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Select from Results</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={searchTerm ? `Found ${filteredUsers.length} matches...` : "Select a user"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{u.email} ({u.displayName})</span>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {u.id}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-center text-gray-500 italic">
                          No users matching "{searchTerm}"
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notification Message</Label>
              <Textarea 
                placeholder="Type your announcement here..." 
                className="min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-3 w-3" /> Link (Optional)
              </Label>
              <Input 
                placeholder="https://example.com" 
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 italic">This URL will be clickable in the user's notification tray.</p>
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
