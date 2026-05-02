'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useCollection, useDoc, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import { LoginButton } from '@/components/login-button';
import { where, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw, AlertCircle, Loader, MessageSquare, Ticket, ChevronRight, CheckCircle2, Menu, Bell, Wallet, Info, Trash2, XCircle, BarChart3, Clock, User, Key, Percent } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { updatePassword } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';

const paymentMethods = [
    { name: 'USDT', imageUrl: 'https://i.postimg.cc/ZRTpmnTk/download_(4).png' },
    { name: 'Apple Pay', imageUrl: 'https://i.postimg.cc/G2qYmRpg/download_(6).png' },
    { name: 'Binance', imageUrl: 'https://i.postimg.cc/BQVwY9J3/binance.jpg' },
    { name: 'Visa', imageUrl: 'https://i.postimg.cc/50DfvbkH/Screenshot-2026-01-29-at-05-45-16.png' },
    { name: 'MasterCard', imageUrl: 'https://i.postimg.cc/P57tbr3p/download_(1).png' },
    { name: 'Bitcoin', imageUrl: 'https://i.postimg.cc/rwH8GFn4/download_(2).png' },
    { name: 'Ethereum', imageUrl: 'https://i.postimg.cc/0y48G2WY/download_(3).png' },
    { name: 'Skrill', imageUrl: 'https://i.postimg.cc/Z5QTPK7p/images.png' },
    { name: 'Perfect Money', imageUrl: 'https://i.postimg.cc/6pP9V5jC/images.jpg' },
    { name: 'Cash App', imageUrl: 'https://i.postimg.cc/Df6jpBcX/download.png' },
];

interface Order {
  id: string;
  orderId: string;
  createdAt: { toDate: () => Date };
  model: string;
  imei: string;
  status: 'confirming_payment' | 'approved' | 'declined' | 'processing' | 'unlocked' | 'ready_for_activation_bulk' | 'ready_for_activation';
  price: number;
}

interface UserProfile {
    id: string;
    displayName: string;
    balance?: number;
    email: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  createdAt: { toDate: () => Date };
}

interface Counters {
  usdtAddress?: string;
}

const CopyToClipboard = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const { toast } = useToast();
  handleCopy();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "Address has been copied.",
      duration: 2000,
    });
  };

  return (
    <div onClick={handleCopy} className="cursor-pointer">
      {children}
    </div>
  );
};

function MyAccountContent() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const orderConstraints = useMemo(() => {
    if (!user) return [where('userId', '==', 'none')];
    return [where('userId', '==', user.uid)];
  }, [user]);

  const { data: orders, loading: ordersLoading } = useCollection<Order>(
    'orders',
    { constraints: orderConstraints }
  );

  const ticketConstraints = useMemo(() => {
    if (!user) return [where('userId', '==', 'none')];
    return [where('userId', '==', user.uid)];
  }, [user]);

  const { data: tickets, loading: ticketsLoading } = useCollection<SupportTicket>(
    'tickets',
    { constraints: ticketConstraints }
  );
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || ' ');
  const { data: counters } = useDoc<Counters>('counters', 'metrics');
  const usdtAddress = counters?.usdtAddress || '0x2a2aA545c902de10dbE882ddaF4aF431982a8E5f';
  
  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkPaid, setBulkPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  // Withdrawal State
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawalProcessing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [withdrawAmount, setWithdrawalAmount] = useState('');
  const [withdrawMethod, setWithdrawalMethod] = useState('');
  const [withdrawReason, setWithdrawalReason] = useState('');

  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Password State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login?redirect=/my-account');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBulkPayModalOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isBulkPayModalOpen) {
      setIsBulkPayModalOpen(false);
      toast({
        title: "Payment window expired",
        description: "Please try again.",
        variant: "destructive",
      });
    }

    return () => clearInterval(timer);
  }, [isBulkPayModalOpen, timeLeft, toast]);

  const handleOpenBulkModal = () => {
    setTimeLeft(20 * 60);
    setIsBulkPayModalOpen(true);
  };
  
  const ordersForBulkPay = orders?.filter(order => order.status === 'confirming_payment') || [];
  const canPayBulk = ordersForBulkPay.length > 1 && !bulkPaid;
  const bulkTotal = ordersForBulkPay.reduce((acc, order) => acc + order.price, 0);
  const bulkDiscount = bulkTotal * 0.2;
  const bulkFinalTotal = bulkTotal - bulkDiscount;
  
  const currentBalance = userProfile?.balance || 0;
  const bulkAmountToPay = Math.max(0, bulkFinalTotal - currentBalance);

  const handleBulkPaid = () => {
    if (isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    setTimeout(() => {
        setIsBulkPayModalOpen(false);
        setBulkPaid(true);
        setIsSubmittingBulk(false);
        toast({
          title: "Success",
          description: "Bulk payment notification sent to administrator.",
        });
    }, 1500);
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBalance < 50) return;
    const amt = parseFloat(withdrawAmount);
    if (amt > currentBalance || amt < 50) {
        return toast({ title: "Invalid Amount", description: "Min withdrawal is $50 and cannot exceed balance.", variant: "destructive" });
    }

    setIsWithdrawalProcessing(true);
    
    setTimeout(async () => {
      try {
        await addDoc(collection(firestore, 'withdrawals'), {
            userId: user?.uid,
            userEmail: user?.email,
            amount: amt,
            method: withdrawMethod,
            reason: withdrawReason,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        setIsWithdrawalProcessing(false);
        setWithdrawalSuccess(true);
      } catch (e) {
        setIsWithdrawalProcessing(false);
        toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
      }
    }, 120000); // 2 minutes
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await addDoc(collection(firestore, 'tickets'), {
        userId: user?.uid,
        userName: user?.displayName || 'Client',
        userEmail: user?.email,
        category: 'Account Deletion',
        subject: 'Account Deletion Request',
        message: 'I would like to request the permanent deletion of my account and all associated data.',
        status: 'open',
        replies: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    
    const tgMessage = `⚠️ <b>ACCOUNT DELETION REQUEST!</b> ⚠️\n\n<b>User:</b> ${user?.email}\n<b>ID:</b> ${user?.uid}`;
    fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tgMessage }),
    });

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    toast({ title: "Request Submitted", description: "Our team will process your deletion request within 48 hours." });
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast({ title: "Short Password", description: "Min 6 characters.", variant: "destructive" });
    if (!auth.currentUser) return;

    setIsUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: "Password Updated", description: "You have successfully changed your password." });
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update password. Try logging in again.", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClaimDiscount = () => {
    const completedOrders = orders?.filter(o => o.status === 'unlocked' || o.status === 'approved').length || 0;
    if (completedOrders < 2) {
      toast({ 
        title: "Offer Unavailable", 
        description: "You have not completed two separate unlock orders and do not qualify for the current discount offer.",
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: "You qualify for a loyalty discount! Contact support to apply it to your next order." 
      });
    }
  };

  const stats = useMemo(() => {
    if (!orders) return { unlocked: 0, declined: 0 };
    return {
        unlocked: orders.filter(o => o.status === 'unlocked').length,
        declined: orders.filter(o => o.status === 'declined').length,
    };
  }, [orders]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatStatus = (status: string) => {
    if (status === 'ready_for_activation_bulk') return 'Ready for activation (bulk)';
    if (status === 'ready_for_activation') return 'Ready for activation';
    return status.replace(/_/g, ' ');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'approved':
      case 'unlocked':
        return 'secondary';
      case 'declined':
      case 'closed':
        return 'destructive';
      case 'replied':
        return 'default';
      default:
        return 'outline';
    }
  };

  const usdtImage = getImage('usdt-icon');
  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');
  
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  if (userLoading || !user || profileLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                 <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
              {user && (
                  <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ring-1 ring-inset ring-primary">My Account</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
              )}
              {user && <NotificationDropdown />}
              <LoginButton />
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 p-4">
                    <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                    <Link href="/services" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                    {user && (
                        <Link href="/my-account" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
                    )}
                    {user && (
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-gray-700 text-base font-medium">Notifications</span>
                        <NotificationDropdown />
                      </div>
                    )}
                    <div className='pt-4'>
                      <LoginButton />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
           <div>
              <h1 className="text-4xl font-bold mb-2">Welcome Back, {userProfile?.displayName || 'User'}</h1>
              <p className="text-gray-500">Manage your device unlocks and account details from here.</p>
           </div>
           <Button onClick={handleClaimDiscount} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold gap-2 h-11 px-8 rounded-xl shadow-lg transition-all hover:scale-105">
             <Percent className="h-5 w-5" /> Claim Discount
           </Button>
        </div>
        
        {/* User Details Card */}
        <Card className="bg-white border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
              <p className="text-lg font-semibold">{userProfile?.displayName || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
              <p className="text-lg font-semibold">{userProfile?.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">User ID / Username</p>
              <p className="text-lg font-mono font-semibold text-blue-600 truncate">{user?.uid}</p>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="bg-gray-50/30 p-4">
             <Button variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5" onClick={() => setIsPasswordModalOpen(true)}>
               <Key className="h-4 w-4" /> Change Password
             </Button>
          </CardFooter>
        </Card>

        {/* Account Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Wallet className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase">Balance</p><p className="text-2xl font-black">${userProfile?.balance?.toFixed(2) || '0.00'}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600"><CheckCircle2 className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase">Unlocked</p><p className="text-2xl font-black">{stats.unlocked}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-2xl text-red-600"><XCircle className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase">Declined</p><p className="text-2xl font-black">{stats.declined}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-primary shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><BarChart3 className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p><p className="text-2xl font-black">{orders?.length || 0}</p></div>
                </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-2xl text-blue-600 flex items-center gap-2"><Wallet className="h-6 w-6" /> Financial Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200">
                        <p className="font-bold mb-4">Deposit via Crypto:</p>
                        <div className="flex items-center gap-3">
                           {usdtImage && (
                             <Image 
                                src={usdtImage.imageUrl} 
                                alt="USDT" 
                                width={48} 
                                height={42} 
                                className="rounded-full shadow-sm"
                             />
                           )}
                           <div className="flex-1">
                             <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">USDT BEP20 Address:</p>
                             <div className="font-mono text-[11px] sm:text-xs bg-white p-3 rounded-xl break-all flex items-center justify-between border shadow-sm group">
                                <span>{usdtAddress}</span>
                                <CopyToClipboard text={usdtAddress}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"/>
                                    </Button>
                                </CopyToClipboard>
                             </div>
                           </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="font-bold mb-2">Withdraw Funds</h4>
                        <p className="text-sm text-gray-500 mb-4">You can request a withdrawal of your available balance. Min: $50.</p>
                        <Button 
                            onClick={() => setIsWithdrawalModalOpen(true)} 
                            variant="outline" 
                            className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50 h-11 px-6 rounded-xl font-bold"
                            disabled={currentBalance < 50}
                        >
                            Request Withdrawal
                        </Button>
                        {currentBalance < 50 && (
                            <p className="text-[10px] text-red-500 mt-2 font-medium flex items-center gap-1">
                                <Info className="h-3 w-3" /> You do not have sufficient balance to withdraw.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MessageSquare className="text-blue-600 h-5 w-5" />
                            Support Center
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">Having issues? Our technician is available 24/7. Response time: 1-24 hours.</p>
                        <Link href="/my-account/tickets/new" className="w-full">
                            <Button className="w-full btn-primary text-white h-11 rounded-xl shadow-lg">
                                <Ticket className="mr-2 h-4 w-4" />
                                New Support Ticket
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-red-100 bg-red-50/30">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-red-600 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Account Deletion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] text-gray-500 mb-3">Permanently remove your account and all history.</p>
                        <Button 
                            variant="link" 
                            className="text-red-500 p-0 h-auto text-xs font-bold hover:text-red-700"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            Request Deletion
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Alert className="mb-12 border-blue-200 bg-blue-50/50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 font-bold">Refresh Account</AlertTitle>
            <AlertDescription className="text-blue-700 text-sm">
                If you just deposited, click the refresh button below to update your balance and order status.
            </AlertDescription>
        </Alert>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                Order History
            </h2>
            <div className="flex items-center gap-4">
                 {canPayBulk && (
                    <Button onClick={handleOpenBulkModal} className="btn-primary text-white shadow-lg animate-pulse">
                        Pay Bulk ({ordersForBulkPay.length})
                    </Button>
                )}
                <Button variant="outline" onClick={() => router.refresh()} className="h-10 rounded-xl">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>
          </div>
          {ordersLoading ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-lg"><Loader className="animate-spin h-8 w-8 mx-auto text-primary" /></div>
          ) : orders && orders.length > 0 ? (
            <Card className="overflow-hidden border-none shadow-xl">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IMEI/Serial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-xs text-gray-500">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-600">{order.orderId}</TableCell>
                      <TableCell className="text-sm font-semibold">{order.model}</TableCell>
                      <TableCell className="font-mono text-[10px] text-gray-400">{order.imei}</TableCell>
                      <TableCell>
                        <Badge variant={
                            order.status === 'approved' || order.status === 'unlocked' ? 'secondary' : 
                            order.status === 'declined' ? 'destructive' : 'default'
                        } className={cn("text-[10px] uppercase font-bold", (order.status === 'confirming_payment' || order.status === 'processing' ) && "animate-pulse")}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-sm">${order.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="text-center py-20 px-6 bg-white rounded-3xl shadow-inner border border-dashed">
                <p className="text-gray-400 font-medium">Your order history will appear here once you place an order.</p>
            </div>
          )}
        </section>

        <section>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    Support Tickets
                </h2>
                <Link href="/my-account/tickets/new">
                    <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 h-10 px-4 rounded-xl font-bold">
                        <Ticket className="mr-2 h-4 w-4" />
                        New Ticket
                    </Button>
                </Link>
            </div>
            {ticketsLoading ? (
                <p>Loading tickets...</p>
            ) : tickets && tickets.length > 0 ? (
                <Card className="overflow-hidden border-none shadow-xl">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.sort((a, b) => {
                                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                                return timeB - timeA;
                            }).map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="text-xs text-gray-500">{ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-xs font-bold text-gray-400 uppercase">{ticket.category}</TableCell>
                                    <TableCell className="font-semibold text-sm">{ticket.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.status)} className="text-[10px] uppercase font-bold">
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/my-account/tickets/${ticket.id}`}>
                                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 font-bold text-xs gap-1">
                                                View
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-inner border border-dashed">
                    <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400">You haven't submitted any support tickets yet.</p>
                </div>
            )}
        </section>
      </main>
      
      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Key className="h-5 w-5 text-primary" />
               Change Your Password
            </DialogTitle>
            <DialogDescription>Enter a new secure password below.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="Min 6 characters..." 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
             </div>
             <p className="text-[10px] text-gray-500 italic">For security, you may be asked to log in again after updating your password.</p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={isUpdatingPassword}>Cancel</Button>
             <Button onClick={handleUpdatePassword} className="btn-primary text-white" disabled={isUpdatingPassword}>
               {isUpdatingPassword ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
               Update Password
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Pay Modal */}
      <Dialog open={isBulkPayModalOpen} onOpenChange={setIsBulkPayModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-5 py-2.5 border-b bg-white">
                <DialogTitle className="text-base sm:text-lg flex items-center gap-3 pr-12">
                    {timeLeft > 0 && (
                        <span className="text-xs sm:text-sm font-mono bg-blue-100 text-blue-800 rounded-md px-2 py-0.5">
                            {formatTime(timeLeft)}
                        </span>
                    )}
                    <span>Bulk Payment (20% Off)</span>
                </DialogTitle>
                <DialogDescription className="text-sm">
                    Pay for multiple orders at once and receive a discount. Send the exact amount.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-5">
              <div className="space-y-4 pt-1 pb-8">
                  <div className="text-xs bg-gray-100 p-3 rounded-xl text-gray-600 space-y-1 mt-2">
                      <p className="font-semibold text-gray-900">Unlocking {ordersForBulkPay.length} devices:</p>
                      <ul className="list-disc list-inside text-xs leading-tight">
                          {ordersForBulkPay.map(order => (
                              <li key={order.id}>{order.model} - <span className='font-mono'>{order.imei}</span></li>
                          ))}
                      </ul>
                  </div>

                  <Alert variant="default" className="bg-blue-50 border-blue-200 py-1.5">
                    <AlertDescription className="text-[11px] text-center">
                      For other payment options, contact the <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-600">admin</a>.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Original Total</p>
                              <p className="line-through text-base font-medium opacity-60">${bulkTotal.toFixed(2)}</p>
                          </div>
                          <div>
                              <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Bulk Discount (20%)</p>
                              <p className="text-base font-bold text-green-600">-${bulkDiscount.toFixed(2)}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Your Balance</p>
                              <p className="text-base font-bold text-green-600">-${currentBalance.toFixed(2)}</p>
                          </div>
                          <div></div>
                      </div>
                      <div className="text-center bg-gray-50 py-3 rounded-xl border border-dashed">
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Amount to Pay</p>
                          <p className="text-3xl font-black">${bulkAmountToPay.toFixed(2)}</p>
                      </div>
                  </div>
                  
                  {bulkAmountToPay > 0 && (
                    <div className="px-4 py-4 border rounded-2xl bg-white shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            {usdtImage && <Image src={usdtImage.imageUrl} alt="USDT BEP20" width={36} height={36} className="rounded-full" data-ai-hint="usdt logo" />}
                            <div>
                                <p className="font-bold text-sm">USDT (BEP20 Network)</p>
                                <p className="text-[10px] text-gray-500">Recommended: Use Binance Smart Chain.</p>
                            </div>
                        </div>
                        <div className="font-mono bg-gray-100 p-3 rounded-xl break-all text-xs flex items-center justify-between border">
                            <span className="font-medium">{usdtAddress}</span>
                            <CopyToClipboard text={usdtAddress}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-gray-100">
                                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"/>
                                </Button>
                            </CopyToClipboard>
                        </div>
                    </div>
                  )}

                  {bulkAmountToPay <= 0 && (
                    <div className="text-center p-6 bg-green-50 border border-green-100 text-green-800 rounded-2xl animate-fade-in">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500"/><p className="font-bold text-base">Your balance covers the full amount!</p><p className="text-xs opacity-80">Click "Confirm" to use your balance for this bulk order.</p>
                    </div>
                  )}

                  <Alert className="bg-yellow-50 border-yellow-100 py-2 rounded-xl">
                      <AlertDescription className="text-[10px] text-center text-yellow-800 font-medium">
                          Payments made within the timer will be automatically applied.
                      </AlertDescription>
                  </Alert>
              </div>
            </ScrollArea>
            <div className="px-5 py-3 bg-red-50 border-t border-red-100">
               <p className="text-[11px] text-red-700 leading-tight text-center font-semibold">
                 ⚠️ If the user clicks “I Paid” without making payment or without prior communication with support, their account may be restricted and certain features will be limited.
               </p>
            </div>
            <DialogFooter className="p-3 border-t flex flex-row gap-3 mt-auto bg-gray-50">
                <Button variant="outline" className="flex-1 h-11 rounded-xl text-sm font-bold shadow-sm" onClick={() => setIsBulkPayModalOpen(false)}>Cancel</Button>
                <Button onClick={handleBulkPaid} className="btn-primary text-white flex-1 h-11 rounded-xl text-sm font-bold shadow-md" disabled={isSubmittingBulk}>
                  {isSubmittingBulk ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </+>
                  ) : (
                    bulkAmountToPay > 0 ? 'Paid' : 'Confirm'
                  )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Modal */}
      <Dialog open={isWithdrawalModalOpen} onOpenChange={(v) => !isWithdrawing && !withdrawalSuccess && setIsWithdrawalModalOpen(v)}>
        <DialogContent className="sm:max-w-[450px]">
          {isWithdrawing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <Loader className="h-16 w-16 animate-spin text-primary" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Processing Withdrawal</h3>
                <p className="text-sm text-gray-500 px-6">We are verifying your account and processing the request. This may take a few moments...</p>
              </div>
              <p className="text-[10px] text-gray-400 font-mono animate-pulse">ESTIMATED TIME: 120s</p>
            </div>
          ) : withdrawalSuccess ? (
            <div className="py-10 text-center space-y-6 animate-fade-in">
              <CheckCircle2 className="h-20 w-24 mx-auto text-green-500" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Request Submitted!</h3>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 text-sm leading-relaxed mx-2">
                    Support will review and process your withdrawal. If it takes more than 2 days, please submit a support ticket.
                </div>
              </div>
              <Button onClick={() => { setIsWithdrawalModalOpen(false); setWithdrawalSuccess(false); }} className="w-full btn-primary text-white">Great, Thanks</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>Minimum withdrawal amount is $50. Processing time: 1-48 hours.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWithdrawalSubmit} className="space-y-5 py-4">
                <div className="space-y-2">
                    <Label htmlFor="w-amount">Amount to Withdraw ($)</Label>
                    <Input id="w-amount" type="number" placeholder="Min $50" value={withdrawAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="w-method">Payment Method</Label>
                    <Select value={withdrawMethod} onValueChange={setWithdrawalMethod} required>
                        <SelectTrigger id="w-method"><SelectValue placeholder="Choose method..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="usdt-bep20">USDT (BEP20)</SelectItem>
                            <SelectItem value="usdt-trc20">USDT (TRC20)</SelectItem>
                            <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="w-reason">Reason for Withdrawal</Label>
                    <Textarea id="w-reason" placeholder="e.g., Change of plans, surplus balance..." value={withdrawReason} onChange={(e) => setWithdrawalReason(e.target.value)} required />
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full btn-primary text-white h-12 font-bold shadow-lg">Proceed with Withdrawal</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">Confirm Account Deletion</DialogTitle>
                <DialogDescription>This action is irreversible. All your orders, balance, and history will be lost.</DialogDescription>
            </DialogHeader>
            <div className="py-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-medium">
                ⚠️ Your request will be reviewed by an administrator within 48 hours. If you have an active balance, it will be forfeited unless withdrawn first.
            </div>
            <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 font-bold">
                    {isDeleting ? <Loader className="animate-spin h-4 w-4" /> : 'Confirm Deletion'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
                    </div>
                    <p className="text-gray-400">Professional Apple device unlocking service</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                        <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                        <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
                        <li><Link href="/unlocking-guide" className="hover:text-white">Unlocking Guide</Link></li>
                        <li><Link href="/bulk-unlock-discount" className="hover:text-white">Bulk Unlock Discont: Get 20% Off!</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Contact Us</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li className='block'>
                            <a href="https://t.me/iUnlock_Apple1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Telegram Channel
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Support 1
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/iUnlock_Apple" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Support 2
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/Chris_Morgan057" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {telegramIcon && <Image src={telegramIcon.imageUrl} alt="Telegram" width={18} height={18} className="mr-2" />}
                                Technician
                            </a>
                        </li>
                        <li className='block'>
                           <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                {whatsappIcon && <Image src={whatsappIcon.imageUrl} alt="WhatsApp" width={18} height={18} className="mr-2" />}
                                WhatsApp
                            </a>
                        </li>
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold mb-4">Accepted Payments</h4>
                    <div className="flex flex-wrap gap-2">
                        {paymentMethods.map(method => (
                            <div key={method.name} className="bg-white rounded-md flex items-center justify-center h-[25px] w-[40px] overflow-hidden">
                                <Image src={method.imageUrl} alt={method.name} width={40} height={25} style={{objectFit: 'contain'}} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                 <p>
                    <Link href="/terms">Terms & Conditions</Link> |
                    <Link href="/privacy">Privacy Policy</Link> |
                    <a href="/reviews">Reviews</a> |
                    <Link href="/contact">Contact Us</Link> |
                    <Link href="/faq">FAQ</Link>
                </p>
                <p className="mt-4">&copy; 2023 iCloud Unlocks. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}


export default function MyAccountPage() {
    return <MyAccountContent />
}