
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, UserCheck, UserPlus, UserX, ShieldCheck, ShieldAlert, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  email: string;
  country?: string;
  accountType?: string;
  isReseller: boolean;
  resellerPricingActive: boolean;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';
const ELIGIBLE_TYPES = ['Reseller', 'Technician', 'Repair Shop / Business'];

export default function ResellersPage() {
  const { data: currentUser, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');

  useEffect(() => {
    if (userLoading) return;
    if (!currentUser || !isAdmin) router.push('/');
  }, [currentUser, userLoading, isAdmin, router]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
        const matchesType = filterType === 'all' ? true : u.accountType === filterType;
        const matchesSearch = 
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Show users who are ALREADY resellers OR eligible to be one
        const isEligible = ELIGIBLE_TYPES.includes(u.accountType || '');
        return (u.isReseller || isEligible) && matchesType && matchesSearch;
    });
  }, [users, searchTerm, filterType]);

  const updateResellerStatus = (userId: string, data: Partial<UserProfile>) => {
    const userRef = doc(firestore, 'users', userId);
    updateDoc(userRef, data).then(() => {
        toast({ title: "Settings Updated" });
    }).catch(() => {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    });
  };

  if (userLoading || !currentUser || !isAdmin) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
                <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="Logo" width={90} height={24} />
            </Link>
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Link href="/admin"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <h1 className="text-3xl font-bold">Reseller Management</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Account Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Eligible Types</SelectItem>
                        <SelectItem value="Reseller">Resellers</SelectItem>
                        <SelectItem value="Technician">Technicians</SelectItem>
                        <SelectItem value="Repair Shop / Business">Repair Shop / Business</SelectItem>
                    </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search users..." 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {usersLoading ? (
            <div className="flex justify-center py-20"><Loader className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
            <Card className="overflow-hidden border-border shadow-lg">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Reseller Details</TableHead>
                            <TableHead>Location & Type</TableHead>
                            <TableHead>Program Status</TableHead>
                            <TableHead className="text-right">Admin Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredUsers.map(u => (
                        <TableRow key={u.id} className={cn("hover:bg-muted/10 transition-colors", u.isReseller && "bg-primary/[0.02]")}>
                            <TableCell>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{u.displayName}</span>
                                        {u.isReseller && <Badge variant="secondary" className="h-4 text-[8px] bg-blue-100 text-blue-700">PRO</Badge>}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono">ID: {u.id}</span>
                                    <span className="text-xs text-primary font-medium">@{u.username || 'no-username'}</span>
                                    <span className="text-[10px] text-muted-foreground">{u.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">{u.country || 'Global'}</Badge>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{u.accountType}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <Badge variant={u.isReseller ? "default" : "outline"} className={cn("w-fit text-[9px] uppercase", u.isReseller ? "bg-green-600" : "")}>
                                        {u.isReseller ? "Reseller Active" : "Not Registered"}
                                    </Badge>
                                    <div className="flex items-center gap-1.5">
                                        {u.resellerPricingActive ? (
                                            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                            <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        )}
                                        <span className={cn("text-[10px] font-bold", u.resellerPricingActive ? "text-green-600" : "text-muted-foreground/60")}>
                                            {u.resellerPricingActive ? "PRICING: ACTIVE (15%)" : "PRICING: STANDARD"}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex gap-2">
                                        {!u.isReseller ? (
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1.5 border-primary/20 text-primary" onClick={() => updateResellerStatus(u.id, { isReseller: true })}>
                                                <UserPlus className="h-3 w-3" /> Add to Program
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1.5 border-red-200 text-red-600 hover:bg-red-50" onClick={() => updateResellerStatus(u.id, { isReseller: false, resellerPricingActive: false })}>
                                                <UserX className="h-3 w-3" /> Remove Reseller
                                            </Button>
                                        )}
                                    </div>
                                    {u.isReseller && (
                                        <Button 
                                            size="sm" 
                                            variant={u.resellerPricingActive ? "destructive" : "default"} 
                                            className="h-8 text-[10px] font-bold w-full sm:w-auto"
                                            onClick={() => updateResellerStatus(u.id, { resellerPricingActive: !u.resellerPricingActive })}
                                        >
                                            {u.resellerPricingActive ? "Disable Pricing" : "Activate Pricing"}
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>))}
                    </TableBody>
                </Table>
            </Card>
        )}
      </main>
    </div>
  );
}
