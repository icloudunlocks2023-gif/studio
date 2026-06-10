
'use client';

import {
  useUser,
  useFirebase,
  useCollection,
} from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoginButton } from '@/components/login-button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Menu, Trash2, UserX, ShieldAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface BannedUser {
  id: string;
  userId: string;
  createdAt: { toDate: () => Date };
}

interface BannedIP {
  id: string;
  ip: string;
  createdAt: { toDate: () => Date };
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

function BannedDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const { data: bannedUsers, loading: bannedUsersLoading } = useCollection<BannedUser>('banned_users');
  const { data: bannedIps, loading: bannedIpsLoading } = useCollection<BannedIP>('banned_ips');
  
  const [userIdInput, setUserIdInput] = useState('');
  const [ipInput, setIpInput] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login?redirect=/admin/banned');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  const handleAddBannedUser = async () => {
    const trimmedId = userIdInput.trim();
    if (!trimmedId) return toast({ title: "Error", description: "Please enter a User ID.", variant: "destructive" });

    const bannedUserRef = doc(firestore, 'banned_users', trimmedId);
    const data = { userId: trimmedId, createdAt: serverTimestamp() };

    setDoc(bannedUserRef, data)
      .then(() => {
        toast({ title: "Success", description: "User ID added to banned list." });
        setUserIdInput('');
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({ path: bannedUserRef.path, operation: 'create', requestResourceData: data });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleAddBannedIp = async () => {
    const trimmedIp = ipInput.trim();
    if (!trimmedIp) return toast({ title: "Error", description: "Please enter an IP address.", variant: "destructive" });

    const ipId = trimmedIp.replace(/\./g, '_');
    const bannedIpRef = doc(firestore, 'banned_ips', ipId);
    const data = { ip: trimmedIp, createdAt: serverTimestamp() };

    setDoc(bannedIpRef, data)
      .then(() => {
        toast({ title: "Success", description: "IP added to banned list." });
        setIpInput('');
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({ path: bannedIpRef.path, operation: 'create', requestResourceData: data });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const removeBannedUser = (id: string) => {
    deleteDoc(doc(firestore, 'banned_users', id)).then(() => toast({ title: "Restriction removed" }));
  };

  const removeBannedIp = (id: string) => {
    deleteDoc(doc(firestore, 'banned_ips', id)).then(() => toast({ title: "IP blacklist removed" }));
  };

  if (userLoading || !user || !isAdmin) return <div className="flex justify-center items-center h-screen bg-background">Loading...</div>;

  return (
    <div className="bg-background text-foreground flex flex-col min-h-screen">
       <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Admin Dashboard</Link>
              <LoginButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-5xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-4 mb-10">
            <Link href="/admin"><Button variant="outline" size="icon"><ArrowLeft /></Button></Link>
            <h1 className="text-4xl font-bold">Blacklist Management</h1>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                <TabsTrigger value="users" className="text-lg"><UserX className="mr-2 h-5 w-5" />Banned User IDs</TabsTrigger>
                <TabsTrigger value="ips" className="text-lg"><ShieldAlert className="mr-2 h-5 w-5" />Banned IP Addresses</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
                <Card className="mb-8 border border-border">
                    <CardHeader><CardTitle>Ban a User by ID</CardTitle></CardHeader>
                    <CardContent className="flex gap-2">
                        <Input value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} placeholder="Enter User ID to ban" className="bg-background" />
                        <Button onClick={handleAddBannedUser} className="btn-primary text-white">Ban User</Button>
                    </CardContent>
                </Card>
                <Card className="border border-border">
                    <Table>
                        <TableHeader><TableRow className="border-border"><TableHead>User ID</TableHead><TableHead>Date Added</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {!bannedUsersLoading && bannedUsers?.map(b => (
                            <TableRow key={b.id} className="border-border hover:bg-muted/50 transition-colors">
                                <TableCell className="font-mono text-xs text-foreground">{b.userId}</TableCell>
                                <TableCell className="text-muted-foreground">{b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell><Badge variant="destructive" className="uppercase text-[10px]">Banned</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => removeBannedUser(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                            </TableRow>
                        ))}
                        {bannedUsers?.length === 0 && !bannedUsersLoading && (
                            <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">No banned users found.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

            <TabsContent value="ips">
                <Card className="mb-8 border border-border">
                    <CardHeader><CardTitle>Ban an IP Address</CardTitle></CardHeader>
                    <CardContent className="flex gap-2">
                        <Input value={ipInput} onChange={(e) => setIpInput(e.target.value)} placeholder="Enter IP address to ban" className="bg-background" />
                        <Button onClick={handleAddBannedIp} className="btn-primary text-white">Ban IP</Button>
                    </CardContent>
                </Card>
                <Card className="border border-border">
                    <Table>
                        <TableHeader><TableRow className="border-border"><TableHead>IP Address</TableHead><TableHead>Date Added</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {!bannedIpsLoading && bannedIps?.map(b => (
                            <TableRow key={b.id} className="border-border hover:bg-muted/50 transition-colors">
                                <TableCell className="font-mono text-xs text-blue-600 dark:text-blue-400">{b.ip}</TableCell>
                                <TableCell className="text-muted-foreground">{b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell><Badge variant="destructive" className="uppercase text-[10px]">Restricted</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => removeBannedIp(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                            </TableRow>
                        ))}
                         {bannedIps?.length === 0 && !bannedIpsLoading && (
                            <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">No blacklisted IPs found.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function BannedUsersPage() {
    return <BannedDashboard />
}
