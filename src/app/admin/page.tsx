'use client';

import {
  useUser,
  useFirebase,
  useCollection,
  useDoc
} from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  where,
  addDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { LoginButton } from '@/components/login-button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Ban, Menu, Users, Server, ServerOff, MessageSquare, CheckCircle, XCircle, Clock, ShieldAlert, Activity, Bell, MapPin, Wallet, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface Submission {
  id: string;
  userId: string;
  model: string;
  price: number;
  imei: string;
  status: 'waiting' | 'feedback' | 'paid' | 'eligible' | 'not_supported' | 'find_my_off' | 'device_found' | 'chimaera' | 'banned';
  icloudStatus?: 'clean' | 'lost';
  successRate?: number;
  feedback: string[] | null;
  ipAddress?: string;
  country?: string;
}

interface Order {
  id: string;
  orderId: string;
  userId: string;
  imei: string;
  model: string;
  price: number;
  status: 'confirming_payment' | 'approved' | 'declined' | 'unlocked' | 'processing' | 'ready_for_activation_bulk' | 'ready_for_activation';
  createdAt: any;
}

interface PaymentClaim {
  id: string;
  orderId: string;
  userId: string;
  submissionId: string;
  imei: string;
  model: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  balance: number;
  ipAddress?: string;
}

interface SupportTicket {
  id: string;
  status: string;
}

interface Counters {
    registeredUsers: number;
    unlockedDevices: number;
    orderCounter?: number;
    isServerOnline?: boolean;
    usdtAddress?: string;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

function AdminDashboard() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const submissionConstraints = useMemo(() => {
    if (userLoading || !user) return [where('userId', '==', 'none')];
    if (isAdmin) return [];
    return [where('userId', '==', user.uid)];
  }, [isAdmin, user, userLoading]);

  const orderConstraints = useMemo(() => {
    if (userLoading || !user) return [where('userId', '==', 'none')];
    if (isAdmin) return [];
    return [where('userId', '==', user.uid)];
  }, [isAdmin, user, userLoading]);

  const openTicketsConstraints = useMemo(() => [where('status', '==', 'open')], []);

  const { data: submissions, loading: submissionsLoading } =
    useCollection<Submission>('submissions', { constraints: submissionConstraints });
  const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', { constraints: orderConstraints });
  const { data: counters, loading: countersLoading } = useDoc<Counters>('counters', 'metrics');
  const { data: claims, loading: claimsLoading } = useCollection<PaymentClaim>('payment_claims');
  const { data: allUsers } = useCollection<UserProfile>('users');
  const { data: openTickets } = useCollection<SupportTicket>('tickets', { constraints: openTicketsConstraints });

  const [feedbackValues, setFeedbackValues] = useState<{ [key: string]: string }>({});
  const [feedbackStatus, setFeedbackStatus] = useState<{ [key: string]: Submission['status'] }>({});
  const [feedbackIcloudStatus, setFeedbackIcloudStatus] = useState<{ [key: string]: 'clean' | 'lost' }>({});
  const [selectedRates, setSelectedRates] = useState<{ [key: string]: number }>({});
  
  const [registeredUsers, setRegisteredUsers] = useState<number>(0);
  const [unlockedDevices, setUnlockedDevices] = useState<number>(0);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [usdtAddress, setUsdtAddress] = useState<string>('0x2a2aA545c902de10dbE882ddaF4aF431982a8E5f');

  const hasOpenTickets = (openTickets?.length || 0) > 0;

  const userIdCounts = useMemo(() => {
    if (!submissions) return {};
    const counts: Record<string, number> = {};
    submissions.forEach((sub) => {
      counts[sub.userId] = (counts[sub.userId] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  const ipCounts = useMemo(() => {
    if (!submissions) return {};
    const counts: Record<string, number> = {};
    submissions.forEach((sub) => {
      if (sub.ipAddress) {
        counts[sub.ipAddress] = (counts[sub.ipAddress] || 0) + 1;
      }
    });
    return counts;
  }, [submissions]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login?redirect=/admin');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  useEffect(() => {
    if (counters) {
      setRegisteredUsers(counters.registeredUsers || 0);
      setUnlockedDevices(counters.unlockedDevices || 0);
      setIsServerOnline(counters.isServerOnline !== false);
      if (counters.usdtAddress) setUsdtAddress(counters.usdtAddress);
    }
  }, [counters]);

  const pendingClaims = useMemo(() => {
    return claims?.filter(c => c.status === 'pending') || [];
  }, [claims]);

  const sortedSubmissions = useMemo(() => {
    if (!submissions) return [];
    const isPriority = (status: Submission['status']) => status === 'waiting' || status === 'device_found';
    return [...submissions].sort((a, b) => {
      if (isPriority(a.status) && !isPriority(b.status)) return -1;
      if (!isPriority(a.status) && isPriority(b.status)) return 1;
      return 0;
    });
  }, [submissions]);

  const handleFeedbackChange = (id: string, value: string) => {
    setFeedbackValues(prev => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (id: string, value: Submission['status']) => {
    setFeedbackStatus(prev => ({ ...prev, [id]: value }));
  };

  const handleIcloudStatusChange = (id: string, value: 'clean' | 'lost') => {
    setFeedbackIcloudStatus(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDeviceFound = (submissionId: string) => {
    const submissionRef = doc(firestore, 'submissions', submissionId);
    const updatedData = {
      status: 'device_found' as const,
      updatedAt: serverTimestamp(),
    };
    updateDoc(submissionRef, updatedData)
      .then(() => toast({ title: "Client notified." }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleSendFeedback = (submissionId: string) => {
    const feedbackTextRaw = feedbackValues[submissionId] || '';
    const status = feedbackStatus[submissionId];
    const icloudStatus = feedbackIcloudStatus[submissionId];
    
    if (!status) return toast({ title: "Selection Required", description: "Select an outcome.", variant: "destructive" });
    
    const sub = submissions?.find(s => s.id === submissionId);
    if (!sub) return;

    let lines: string[] = [];

    if (status === 'banned') {
        const bannedUserRef = doc(firestore, 'banned_users', sub.userId);
        setDoc(bannedUserRef, {
            userId: sub.userId,
            createdAt: serverTimestamp(),
        }).catch(err => console.error("Auto-ban failed:", err));

        lines = [
            "Maximum Free Checks Reached",
            "You have checked multiple devices without placing any unlock orders and have now reached the maximum limit for free IMEI / Serial checks.",
            "",
            "To continue using the service, please proceed with an unlock order for any device you have previously checked, or request an account reset. This limit helps us manage server load and ensure fair usage for all clients.",
            "",
            "If you are ready to proceed, kindly contact the Admin or submit a support ticket. Once confirmed, your account will be reset and access restored, allowing you to continue with device checks and processing.",
            "",
            "Thank you for your understanding."
        ];
    } else {
        const feedbackText = feedbackTextRaw
            .replace(/undefined/gi, '')
            .replace(/\(undefined\)/gi, '')
            .replace(/(iPhone)(\d+)/gi, '$1 $2')
            .trim();

        if (feedbackText === '' && status !== 'eligible' && status !== 'find_my_off' && status !== 'feedback' && status !== 'not_supported' && status !== 'chimaera') {
            return toast({ title: "Input Required", description: "Enter feedback.", variant: "destructive" });
        }

        lines = feedbackText.split('\n').filter(l => l.trim() && !l.startsWith('TIMESTAMP:'));
        if (status === 'eligible') lines.push('FIND_MY_ON_STATUS');
        if (status === 'find_my_off') lines.push('FIND_MY_OFF_STATUS');
        if (status === 'chimaera') {
            lines.push('Chimaera Device Policy & Blacklist (Blocked by Apple)');
        }
    }
    
    const timestamp = format(new Date(), "PPpp"); 
    lines.push(`TIMESTAMP:${timestamp}`);

    const submissionRef = doc(firestore, 'submissions', submissionId);
    const updatedData: any = {
      feedback: lines,
      status: status,
      updatedAt: serverTimestamp(),
    };

    if (icloudStatus) {
      updatedData.icloudStatus = icloudStatus;
    }

    if ((status === 'eligible' || status === 'chimaera') && selectedRates[submissionId]) {
      updatedData.successRate = selectedRates[submissionId];
    }

    updateDoc(submissionRef, updatedData)
      .then(() => {
        toast({ title: "Feedback sent!" });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: submissionRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleBanIp = (ip: string) => {
    if (!ip || ip === 'unknown') return;
    const ipId = ip.replace(/\./g, '_');
    const ipRef = doc(firestore, 'banned_ips', ipId);
    setDoc(ipRef, {
        ip: ip,
        createdAt: serverTimestamp(),
    }).then(() => {
        toast({ title: "IP Banned", description: `${ip} has been blacklisted.` });
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: ipRef.path,
            operation: 'create',
            requestResourceData: { ip, createdAt: '...' },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDelete = (submissionId: string) => {
    if (!submissionId) return;
    const submissionRef = doc(firestore, 'submissions', submissionId);
    deleteDoc(submissionRef)
      .then(() => toast({ title: "Submission deleted" }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: submissionRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleOrderStatusChange = (orderId: string, status: Order['status']) => {
    const orderRef = doc(firestore, 'orders', orderId);
    const updatedData = { status, updatedAt: serverTimestamp() };
    updateDoc(orderRef, updatedData)
        .then(() => toast({ title: "Order status updated", description: `Updated to ${status.replace(/_/g, ' ')}` }))
        .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleToggleServer = (checked: boolean) => {
    setIsServerOnline(checked);
    const metricsRef = doc(firestore, 'counters', 'metrics');
    updateDoc(metricsRef, { isServerOnline: checked }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: metricsRef.path,
            operation: 'update',
            requestResourceData: { isServerOnline: checked },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleUpdateMetrics = () => {
    const metricsRef = doc(firestore, 'counters', 'metrics');
    const metricsData = {
      registeredUsers: Number(registeredUsers),
      unlockedDevices: Number(unlockedDevices),
      isServerOnline: isServerOnline,
      usdtAddress: usdtAddress.trim()
    };
    setDoc(metricsRef, metricsData, { merge: true })
      .then(() => toast({ title: "Site settings updated!" }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: metricsRef.path,
          operation: 'write',
          requestResourceData: metricsData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleApproveClaim = (claim: PaymentClaim) => {
    const claimRef = doc(firestore, 'payment_claims', claim.id);
    const orderData = {
      orderId: claim.orderId,
      userId: claim.userId,
      submissionId: claim.submissionId,
      imei: claim.imei,
      model: claim.model,
      price: claim.price,
      status: 'confirming_payment' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    updateDoc(claimRef, { status: 'approved' })
      .then(() => {
        addDoc(collection(firestore, 'orders'), orderData);
        toast({ title: "Claim Approved", description: "Order created and client notified." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: claimRef.path,
          operation: 'update',
          requestResourceData: { status: 'approved' },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleRejectClaim = (claimId: string) => {
    const claimRef = doc(firestore, 'payment_claims', claimId);
    updateDoc(claimRef, { status: 'rejected' })
      .then(() => toast({ title: "Claim Rejected", description: "Client notified of non-payment." }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: claimRef.path,
          operation: 'update',
          requestResourceData: { status: 'rejected' },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const getUserDetails = (userId: string) => {
    return allUsers?.find(u => u.id === userId);
  };

  if (userLoading || !user || !isAdmin) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
       <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
              {user && <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>}
              {isAdmin && <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">Admin</Link>}
              <LoginButton />
            </div>
             <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader><SheetTitle className="sr-only">Mobile Menu</SheetTitle></SheetHeader>
                  <div className="flex flex-col gap-4 p-4">
                    <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                    <Link href="/services" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                    {user && <Link href="/my-account" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">My Account</Link>}
                    {isAdmin && <Link href="/admin" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors ring-1 ring-inset ring-primary">Admin</Link>}
                    <div className='pt-4'><LoginButton /></div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 space-y-12">
        {pendingClaims.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="text-blue-600" />
              Payment Verification Requests ({pendingClaims.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingClaims.map(claim => {
                const client = getUserDetails(claim.userId);
                return (
                  <Card key={claim.id} className="border-2 border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-blue-900">{claim.orderId}</CardTitle>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">Verifying...</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client Info</p>
                        <p className="font-medium">{client?.displayName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{client?.email || 'N/A'}</p>
                        <p className="text-[10px] font-mono text-gray-400 break-all">UID: {claim.userId}</p>
                        <p className="text-xs font-semibold text-green-600">Balance: ${client?.balance?.toFixed(2) || '0.00'}</p>
                      </div>
                      <Separator className="bg-blue-100" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Device Details</p>
                        <p className="font-bold">{claim.model}</p>
                        <p className="font-mono text-[11px] bg-white/50 px-2 py-1 rounded border break-all">{claim.imei}</p>
                        <p className="font-bold text-blue-700 mt-1">Cost: ${claim.price.toFixed(2)}</p>
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-2">
                        <Clock className="h-3 w-3" />
                        Clicked "I Paid": {claim.createdAt?.toDate ? format(claim.createdAt.toDate(), 'PPpp') : 'Just now'}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-0">
                      <Button onClick={() => handleApproveClaim(claim)} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 h-9 text-xs">
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button onClick={() => handleRejectClaim(claim.id)} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2 h-9 text-xs">
                        <XCircle className="h-4 w-4" /> No Payment
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
              <div className="mb-12 space-y-6">
                  <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><span>Site Settings & Metrics</span></CardTitle></CardHeader>
                      <CardContent className="space-y-6">
                          {countersLoading ? <p>Loading settings...</p> : (
                              <>
                                  <div className="p-4 rounded-lg bg-gray-50 border flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-full ${isServerOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                              {isServerOnline ? <Server size={20} /> : <ServerOff size={20} />}
                                          </div>
                                          <div><Label htmlFor="server-status" className="text-base font-bold">Device Check Server</Label><p className="text-sm text-gray-500">Status: <span className={isServerOnline ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{isServerOnline ? 'ONLINE' : 'OFFLINE'}</span></p></div>
                                      </div>
                                      <Switch id="server-status" checked={isServerOnline} onCheckedChange={handleToggleServer} />
                                  </div>
                                  <div className='grid gap-4 sm:grid-cols-2'>
                                      <div className='grid gap-2'><Label htmlFor="registeredUsers">Registered Users</Label><Input id="registeredUsers" type="number" value={registeredUsers} onChange={(e) => setRegisteredUsers(Number(e.target.value))} /></div>
                                      <div className='grid gap-2'><Label htmlFor="unlockedDevices">Unlocked Devices</Label><Input id="unlockedDevices" type="number" value={unlockedDevices} onChange={(e) => setUnlockedDevices(Number(e.target.value))} /></div>
                                  </div>
                              </>)}
                      </CardContent>
                      <CardFooter className="flex flex-col items-stretch gap-4">
                          <Button onClick={handleUpdateMetrics} className="btn-primary text-white w-full">Save All Settings</Button>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Link href="/admin/activities" className="w-full">
                                <Button variant="outline" className="w-full text-xs gap-1 border-blue-200">
                                  <Activity className="h-3 w-3" /> Activities
                                </Button>
                              </Link>
                              <Link href="/admin/notifications" className="w-full">
                                <Button variant="outline" className="w-full text-xs gap-1 border-primary/30">
                                  <Bell className="h-3 w-3" /> Notifications
                                </Button>
                              </Link>
                              <Link href="/admin/tickets" className="w-full">
                                <Button variant="outline" className="relative w-full text-xs gap-1 border-blue-200 bg-blue-50 text-blue-700">
                                  <MessageSquare className="h-3 w-3" /> Tickets
                                  {hasOpenTickets && (
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                  )}
                                </Button>
                              </Link>
                              <Link href="/admin/users" className="w-full">
                                <Button variant="outline" className="w-full text-xs gap-1"><Users className="h-3 w-3" />Users</Button>
                              </Link>
                          </div>
                      </CardFooter>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Wallet className="h-5 w-5" />
                        Global Wallet Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="usdt-address">USDT BEP20 Wallet Address</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="usdt-address" 
                            placeholder="Paste new address..." 
                            value={usdtAddress} 
                            onChange={(e) => setUsdtAddress(e.target.value)} 
                            className="font-mono text-xs"
                          />
                          <Button onClick={handleUpdateMetrics} className="gap-2">
                            <Save className="h-4 w-4" /> Update
                          </Button>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">This address is displayed sitewide in payment popups.</p>
                      </div>
                    </CardContent>
                  </Card>
              </div>

              <h1 className="text-4xl font-bold text-center mb-10">Submissions</h1>
              {submissionsLoading ? <p>Loading submissions...</p> : sortedSubmissions.length === 0 ? <p className='text-center text-gray-500'>None found.</p> : (
                <div className="space-y-6">
                  {sortedSubmissions.map(sub => (
                    <Card key={sub.id} className={`bg-white ${sub.status === 'waiting' || sub.status === 'device_found' ? 'border-2 border-primary' : ''}`}>
                      <CardHeader><CardTitle className='flex justify-between items-center'><span>{sub.model}</span><Badge variant={sub.status === 'waiting' ? 'default' : 'secondary'} className={sub.status === 'waiting' || sub.status === 'device_found' ? 'animate-pulse' : ''}>{sub.status.replace('_', ' ')}</Badge></CardTitle></CardHeader>
                      <CardContent className="space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                            <div className="space-y-1">
                                <p className="text-gray-400 uppercase font-bold tracking-tighter">Client Details</p>
                                <p className="break-all">UID: <span className="font-mono">{sub.userId}</span></p>
                                <p className="font-bold text-blue-600">Submissions: {userIdCounts[sub.userId] || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-400 uppercase font-bold tracking-tighter">Network Info</p>
                                <p className="break-all flex items-center gap-1">
                                  IP: <span className="font-mono text-blue-700">{sub.ipAddress || 'unknown'}</span>
                                </p>
                                <p className="flex items-center gap-1 font-semibold text-gray-700">
                                  <MapPin className="h-3 w-3 text-red-500" />
                                  Country: <span className="text-primary">{sub.country || 'Auto-detecting...'}</span>
                                </p>
                                <p className="font-bold text-red-600">IP Frequency: {sub.ipAddress ? ipCounts[sub.ipAddress] : 0}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 break-all">IMEI/Serial: <strong>{sub.imei}</strong></p>
                        <p className="text-sm text-gray-600">Price: ${sub.price}</p>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Sent Feedback History:</label>
                                {sub.feedback && sub.feedback.length > 0 ? (
                                    <div className="p-2 bg-gray-50 border rounded-md max-h-32 overflow-y-auto text-[10px] font-mono text-gray-600 space-y-1 shadow-inner">
                                        {sub.feedback.map((line, idx) => (
                                            <div key={idx} className={line.startsWith('TIMESTAMP:') ? 'text-blue-500 border-t mt-1 pt-1' : ''}>{line}</div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-2 bg-gray-50 border rounded-md text-[10px] text-gray-400 italic">No feedback sent yet.</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Update Feedback Message:</label>
                                <Textarea value={feedbackValues[sub.id] || sub.feedback?.filter(l => !l.startsWith('FIND_MY_') && !l.startsWith('TIMESTAMP:') && !l.includes('Chimaera Device Policy')).join('\n') || ''} onChange={(e) => handleFeedbackChange(sub.id, e.target.value)} className="font-mono text-sm" placeholder="Type message to send to client..." />
                            </div>
                        </div>
                      </CardContent>
                      <CardFooter className='flex-col items-stretch gap-3'>
                        {sub.status === 'waiting' && <Button onClick={() => handleDeviceFound(sub.id)} className="w-full">Device Found</Button>}
                        
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-bold text-gray-400">Outcome</Label>
                              <Select onValueChange={(value: Submission['status']) => handleStatusChange(sub.id, value)}>
                                  <SelectTrigger><SelectValue placeholder="Select Outcome..." /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="eligible">Eligible for Unlock</SelectItem>
                                      <SelectItem value="not_supported">Not Supported for Unlock</SelectItem>
                                      <SelectItem value="feedback">Select the above device model and check again</SelectItem>
                                      <SelectItem value="find_my_off">Find My: OFF</SelectItem>
                                      <SelectItem value="chimaera">Chimaera Device Policy & Blacklist (Blocked by Apple)</SelectItem>
                                      <SelectItem value="banned">Ban Member</SelectItem>
                                  </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-bold text-gray-400">iCloud Status</Label>
                              <Select onValueChange={(value: 'clean' | 'lost') => handleIcloudStatusChange(sub.id, value)}>
                                  <SelectTrigger><SelectValue placeholder="Status (Clean/Lost)" /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="clean">Clean</SelectItem>
                                      <SelectItem value="lost">Lost</SelectItem>
                                  </SelectContent>
                              </Select>
                           </div>
                        </div>

                        {(feedbackStatus[sub.id] === 'eligible' || feedbackStatus[sub.id] === 'chimaera') && (
                          <div className="p-4 border rounded-lg bg-gray-50 space-y-3 animate-fade-in">
                            <Label className="text-xs font-bold uppercase text-gray-500">Select Success Rate</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">High Success Rate</p>
                                <div className="flex gap-2">
                                  <Button 
                                    variant={selectedRates[sub.id] === 98 ? 'default' : 'outline'} 
                                    size="sm"
                                    className={cn("flex-1 h-8", selectedRates[sub.id] === 98 && "bg-green-600 hover:bg-green-700")}
                                    onClick={() => setSelectedRates(prev => ({...prev, [sub.id]: 98}))}
                                  >98%</Button>
                                  <Button 
                                    variant={selectedRates[sub.id] === 75 ? 'default' : 'outline'} 
                                    size="sm"
                                    className={cn("flex-1 h-8", selectedRates[sub.id] === 75 && "bg-green-50 hover:bg-green-600")}
                                    onClick={() => setSelectedRates(prev => ({...prev, [sub.id]: 75}))}
                                  >75%</Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Low Success Rate</p>
                                <div className="flex gap-2">
                                  <Button 
                                    variant={selectedRates[sub.id] === 45 ? 'default' : 'outline'} 
                                    size="sm"
                                    className={cn("flex-1 h-8", selectedRates[sub.id] === 45 && "bg-red-500 hover:bg-red-600")}
                                    onClick={() => setSelectedRates(prev => ({...prev, [sub.id]: 45}))}
                                  >45%</Button>
                                  <Button 
                                    variant={selectedRates[sub.id] === 25 ? 'default' : 'outline'} 
                                    size="sm"
                                    className={cn("flex-1 h-8", selectedRates[sub.id] === 25 && "bg-red-600 hover:bg-red-700")}
                                    onClick={() => setSelectedRates(prev => ({...prev, [sub.id]: 25}))}
                                  >25%</Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className='flex items-center gap-2 flex-wrap'>
                            <Button onClick={() => handleSendFeedback(sub.id)} className="btn-primary text-white flex-1">Send Feedback</Button>
                            {sub.ipAddress && (
                                <Button variant="outline" size="icon" title="Ban IP Address" onClick={() => handleBanIp(sub.ipAddress!)} className="text-red-600 border-red-200 hover:bg-red-50">
                                    <ShieldAlert className="h-4 w-4" />
                                </Button>
                            )}
                            <Button onClick={() => handleDelete(sub.id)} variant="destructive">Delete</Button>
                        </div>
                      </CardFooter>
                    </Card>))}
                </div>)}
          </div>
          <div>
              <h1 className="text-4xl font-bold text-center mb-10">Client Orders</h1>
              {ordersLoading ? <p>Loading orders...</p> : orders?.length === 0 ? <p className='text-center text-gray-500'>No orders found.</p> : (
                  <Card>
                      <Table>
                          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Order ID</TableHead><TableHead>Model</TableHead><TableHead>IMEI</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                          <TableBody>
                          {orders?.map(order => (
                              <TableRow key={order.id}>
                                  <TableCell>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                  <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                                  <TableCell>{order.model}</TableCell>
                                  <TableCell className="font-mono text-xs break-all">{order.imei}</TableCell>
                                  <TableCell><Badge variant={order.status === 'approved' || order.status === 'unlocked' ? 'secondary' : order.status === 'declined' ? 'destructive' : 'default'} className={order.status === 'confirming_payment' || order.status === 'processing' ? 'animate-pulse' : ''}>{order.status.replace(/_/g, ' ')}</Badge></TableCell>
                                  <TableCell><Select value={order.status} onValueChange={(value: Order['status']) => handleOrderStatusChange(order.id, value)}><SelectTrigger className='h-8'><SelectValue placeholder="Update Status" /></SelectTrigger><SelectContent><SelectItem value="confirming_payment">Confirming Payment</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="declined">Declined</SelectItem><SelectItem value="unlocked">Unlocked</SelectItem><SelectItem value="ready_for_activation">Ready for activation</SelectItem><SelectItem value="ready_for_activation_bulk">Ready for activation (bulk)</SelectItem></SelectContent></Select></TableCell>
                              </TableRow>))}
                          </TableBody>
                      </Table>
                  </Card>)}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
    return <AdminDashboard />
}
