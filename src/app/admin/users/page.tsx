
'use client';

import {
  useUser,
  useFirebase,
  useCollection,
} from '@/firebase';
import { doc, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { LoginButton } from '@/components/login-button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Menu, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  email: string;
  balance?: number;
  ipAddress?: string;
  country?: string;
  whatsappNumber?: string;
  accountType?: string;
  deviceOwnership?: string;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

function UserManagementDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL;

  const userConstraints = useMemo(() => {
    if (userLoading || !user) return [where('email', '==', 'none')];
    if (isAdmin) return [];
    return [where('email', '==', user.email)];
  }, [isAdmin, user, userLoading]);

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users', { constraints: userConstraints });
  const [balances, setBalances] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login?redirect=/admin/users');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  useEffect(() => {
    if (users) {
      const initialBalances = users.reduce((acc, u) => {
        acc[u.id] = u.balance || 0;
        return acc;
      }, {} as { [key: string]: number });
      setBalances(initialBalances);
    }
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleBalanceChange = (userId: string, value: string) => {
    setBalances(prev => ({ ...prev, [userId]: Number(value) }));
  };

  const handleUpdateBalance = (userId: string) => {
    const newBalance = balances[userId];
    if (newBalance === undefined || isNaN(newBalance)) return toast({ title: "Error", description: "Invalid balance.", variant: "destructive" });

    const userRef = doc(firestore, 'users', userId);
    const updatedData = { balance: newBalance };

    updateDoc(userRef, updatedData)
      .then(() => toast({ title: "Success", description: "User balance updated successfully!" }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (userLoading || !user || !isAdmin) return <div className="flex justify-center items-center h-screen bg-background">Loading...</div>;

  return (
    <div className="bg-background text-foreground flex flex-col min-h-screen">
       <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center"><Link href="/" className="flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link></div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin Dashboard</Link>
              <LoginButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Link href="/admin"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <h1 className="text-3xl font-bold">User Management</h1>
            </div>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {usersLoading ? (
            <div className="flex justify-center py-20"><Search className="animate-spin h-8 w-8 text-primary" /></div>
        ) : filteredUsers.length === 0 ? (
            <Card className="p-20 text-center text-muted-foreground italic border-dashed">No users found.</Card>
        ) : (
            <Card className="overflow-hidden border-border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>User Details</TableHead>
                            <TableHead>Network & WhatsApp</TableHead>
                            <TableHead>Account Info</TableHead>
                            <TableHead>Balance Management</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredUsers.map(u => (
                        <TableRow key={u.id} className="hover:bg-muted/20">
                            <TableCell>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-sm">{u.displayName}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{u.id}</span>
                                    <span className="text-xs text-blue-600 font-medium">{u.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className="w-fit text-[10px]">{u.country || 'Unknown'}</Badge>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <span className="font-mono">{u.ipAddress || '0.0.0.0'}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-green-600">
                                        WhatsApp: {u.whatsappNumber && u.whatsappNumber !== '' ? u.whatsappNumber : 'Nil'}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Type</span>
                                    <Badge className="w-fit text-[9px] h-5">{u.accountType || 'Personal'}</Badge>
                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter mt-1">Ownership</span>
                                    <span className="text-[10px] font-medium">{u.deviceOwnership || 'N/A'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">$</span>
                                        <Input 
                                            type="number" 
                                            value={balances[u.id] ?? ''} 
                                            onChange={(e) => handleBalanceChange(u.id, e.target.value)} 
                                            className="w-24 pl-5 h-8 text-xs font-bold" 
                                            placeholder="0.00" 
                                        />
                                    </div>
                                    <Button size="sm" className="h-8 px-3 text-xs btn-primary text-white" onClick={() => handleUpdateBalance(u.id)}>Update</Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">Current: <strong>${u.balance?.toFixed(2) || '0.00'}</strong></p>
                            </TableCell>
                        </TableRow>))}
                    </TableBody>
                </Table>
            </Card>)}
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
    return <UserManagementDashboard />
}
