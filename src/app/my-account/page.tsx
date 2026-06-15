'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useCollection, useDoc, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { getImage } from '@/lib/placeholder-images';
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
import { Copy, RefreshCw, AlertCircle, Loader, MessageSquare, Ticket, ChevronRight, CheckCircle2, Menu, Wallet, Info, Trash2, XCircle, BarChart3, Clock, User, Key, Percent, ArrowLeft, Mail, Landmark } from 'lucide-react';
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
import { ThemeToggle } from '@/components/theme-toggle';

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
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "Address has been copied.",
      duration: 2000,
    });
    // Log specific copy action
    window.dispatchEvent(new CustomEvent('user-activity-log', { 
        detail: { action: `Copied address: ${text}` } 
    }));
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

  // Deposit State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStep, setDepositStep] = useState<'amount' | 'methods' | 'details'>('amount');
  const [selectedDepositMethod, setSelectedDepositMethod] = useState<any>(null);
  const [depositEmail, setDepositEmail] = useState('');
  const [depositTimer, setDepositTimer] = useState(20 * 60);
  const [showDepositRequestSuccess, setShowDepositRequestSuccess] = useState(false);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  // Withdrawal State
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawalProcessing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [withdrawAmount, setWithdrawalAmount] = useState('');
  const [withdrawMethod, setWithdrawalMethod] = useState('');
  const [withdrawDetails, setWithdrawalDetails] = useState('');
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (depositStep === 'details' && selectedDepositMethod?.type === 'crypto' && depositTimer > 0) {
        timer = setInterval(() => {
            setDepositTimer(prev => prev - 1);
        }, 1000);
    } else if (depositTimer === 0 && depositStep === 'details' && selectedDepositMethod?.type === 'crypto') {
        setDepositStep('methods');
        toast({ title: "Session Expired", description: "Deposit session timed out. Please try again.", variant: "destructive" });
    }
    return () => clearInterval(timer);
  }, [depositStep, depositTimer, selectedDepositMethod, toast]);

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
    const amt = parseFloat(withdrawAmount);
    
    if (isNaN(amt) || amt < 15) {
        return toast({ title: "Invalid Amount", description: "Minimum withdrawal amount is $15.00", variant: "destructive" });
    }
    if (amt > currentBalance) {
        return toast({ title: "Insufficient Funds", description: "Withdrawal amount cannot exceed your available balance.", variant: "destructive" });
    }

    setIsWithdrawalProcessing(true);
    
    // Simulate processing for 10 seconds
    setTimeout(async () => {
      try {
        const withdrawalData = {
            userId: user?.uid,
            userEmail: user?.email,
            amount: amt,
            method: withdrawMethod,
            details: withdrawDetails,
            reason: withdrawReason,
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'withdrawals'), withdrawalData);
        
        // Notify Admin via Telegram
        const tgMessage = `💸 <b>NEW WITHDRAWAL REQUEST!</b> 🚀\n\n<b>User:</b> ${user?.email}\n<b>Amount:</b> $${amt}\n<b>Method:</b> ${withdrawMethod}\n<b>Details:</b> ${withdrawDetails}\n<b>Reason:</b> ${withdrawReason || 'N/A'}`;
        fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: tgMessage }),
        });

        setIsWithdrawalProcessing(false);
        setWithdrawalSuccess(true);
        // Clear fields
        setWithdrawalAmount('');
        setWithdrawalMethod('');
        setWithdrawalDetails('');
        setWithdrawalReason('');
      } catch (e) {
        setIsWithdrawalProcessing(false);
        toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
      }
    }, 10000); 
  };

  const handleDepositSubmitRequest = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 15) {
        return toast({ title: "Invalid Amount", description: "Minimum deposit is $15.00", variant: "destructive" });
    }
    setDepositStep('methods');
  };

  const handleNonCryptoProceed = async () => {
    if (!depositEmail || !depositEmail.includes('@')) {
        return toast({ title: "Valid Email Required", variant: "destructive" });
    }
    setIsProcessingDeposit(true);

    const tgMessage = `💰 <b>NEW NON-CRYPTO DEPOSIT REQUEST!</b> 💰\n\n<b>User:</b> ${user?.email}\n<b>Amount:</b> $${depositAmount}\n<b>Method:</b> ${selectedDepositMethod.name}\n<b>Client Email:</b> ${depositEmail}`;
    
    try {
        await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: tgMessage }),
        });
        setShowDepositRequestSuccess(true);
        setDepositStep('amount');
        setDepositAmount('');
        setDepositEmail('');
    } catch (e) {
        toast({ title: "Error", description: "Failed to notify support.", variant: "destructive" });
    } finally {
        setIsProcessingDeposit(false);
    }
  };

  const handleCryptoPaid = async () => {
      setIsProcessingDeposit(true);
      const tgMessage = `🚀 <b>CRYPTO DEPOSIT CLAIM!</b> 🚀\n\n<b>User:</b> ${user?.email}\n<b>Amount:</b> $${depositAmount}\n<b>Method:</b> ${selectedDepositMethod.name}`;
      
      try {
          await fetch('/api/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: tgMessage }),
          });
          toast({ title: "Deposit Notification Sent", description: "Administrator will verify your transaction shortly." });
          setDepositStep('amount');
          setDepositAmount('');
      } catch (e) {
          toast({ title: "Error", description: "Failed to notify admin.", variant: "destructive" });
      } finally {
          setIsProcessingDeposit(false);
      }
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

  const isCryptoMethod = (method: string) => {
    return ['usdt-bep20', 'usdt-trc20', 'bitcoin', 'eth', 'usdc'].includes(method.toLowerCase());
  };

  const usdtImage = getImage('usdt-icon');
  const bitcoinImage = getImage('bitcoin-icon');
  const usdcImage = getImage('usdc-icon');
  const ethImage = getImage('eth-icon');

  const additionalMethods = [
    { id: 'usdt-bep20', name: 'USDT (BEP20)', icon: usdtImage, address: usdtAddress, type: 'crypto' },
    { id: 'btc', name: 'Bitcoin (BTC)', icon: bitcoinImage, address: 'bc1qzrxlnds0lrx7txvxg0fhyqctjvztfdjw3uf8lr', type: 'crypto' },
    { id: 'usdt-trc20', name: 'USDT (TRC20)', icon: getImage('usdt-trc20-icon'), address: 'TCRCzCURBYfZB459umToj54nXftEKU1G9q', type: 'crypto' },
    { id: 'usdc-erc20', name: 'USDC (ERC20)', icon: usdcImage, address: '0x21A9f32db018aDd719Ea4e9a329058661c552dd9', type: 'crypto' },
    { id: 'eth', name: 'Ethereum (ETH)', icon: ethImage, address: '0x21A9f32db018aDd719Ea4e9a329058661c552dd9', type: 'crypto' },
    { id: 'cashapp', name: 'Cash App', icon: getImage('cashapp-icon'), type: 'manual' },
    { id: 'paypal', name: 'PayPal', icon: getImage('paypal-icon'), type: 'manual' },
    { id: 'venmo', name: 'Venmo', icon: getImage('venmo-icon'), type: 'manual' },
    { id: 'zelle', name: 'Zelle', icon: getImage('zelle-icon'), type: 'manual' },
    { id: 'applecash', name: 'Apple Cash', icon: getImage('apple-pay-icon'), type: 'manual' },
    { id: 'wu', name: 'Western Union', icon: getImage('wu-icon'), type: 'manual' },
  ];
  
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  if (userLoading || !user || profileLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-background text-foreground flex flex-col min-h-screen">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                 <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Services</Link>
              {user && (
                  <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium ring-1 ring-inset ring-primary">My Account</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Admin</Link>
              )}
              {user && <NotificationDropdown />}
              <ThemeToggle />
              <LoginButton />
            </div>
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
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
                    <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                    <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors ring-1 ring-inset ring-primary">Services</Link>
                    {user && (
                        <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
                    )}
                    {user && (
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-gray-700 dark:text-gray-300 text-base font-medium">Notifications</span>
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
              <h1 className="text-4xl font-bold mb-2 text-foreground">Welcome Back, {userProfile?.displayName || 'User'}</h1>
              <p className="text-muted-foreground">Manage your device unlocks and account details from here.</p>
           </div>
           <Button onClick={handleClaimDiscount} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white dark:text-white font-bold gap-2 h-11 px-8 rounded-xl shadow-lg transition-all hover:scale-105">
             <Percent className="h-5 w-5" /> Claim Discount
           </Button>
        </div>
        
        <Card className="bg-card border border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</p>
              <p className="text-lg font-semibold text-foreground">{userProfile?.displayName || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
              <p className="text-lg font-semibold text-foreground">{userProfile?.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User ID / Username</p>
              <p className="text-lg font-mono font-semibold text-blue-600 truncate">{user?.uid}</p>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="bg-muted/10 p-4">
             <Button variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5" onClick={() => setIsPasswordModalOpen(true)}>
               <Key className="h-4 w-4" /> Change Password
             </Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-l-4 border-l-blue-500 shadow-sm border border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-2xl text-blue-600"><Wallet className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-muted-foreground uppercase">Balance</p><p className="text-2xl font-black text-foreground">${userProfile?.balance?.toFixed(2) || '0.00'}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-card border-l-4 border-l-green-500 shadow-sm border border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-2xl text-green-600"><CheckCircle2 className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-muted-foreground uppercase">Unlocked</p><p className="text-2xl font-black text-foreground">{stats.unlocked}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-card border-l-4 border-l-red-500 shadow-sm border border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-2xl text-red-600"><XCircle className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-muted-foreground uppercase">Declined</p><p className="text-2xl font-black text-foreground">{stats.declined}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-card border-l-4 border-l-primary shadow-sm border border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><BarChart3 className="h-6 w-6" /></div>
                    <div><p className="text-xs font-bold text-muted-foreground uppercase">Total Orders</p><p className="text-2xl font-black text-foreground">{orders?.length || 0}</p></div>
                </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <Card className="lg:col-span-2 border border-border overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border">
                    <CardTitle className="text-2xl text-blue-600 flex items-center gap-2"><Wallet className="h-6 w-6" /> Deposit Funds into Account</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                        <p className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Info className="h-3 w-3" /> Note:
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed mb-3">
                            USDT, Bitcoin, USDC, and Ethereum payments are instant, recommended, and more convenient. <strong>Minimum deposit: $15.00</strong>
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                            Other payment methods (Cash App, PayPal, Venmo, Zelle, Apple Cash, Western Union) require a <strong>minimum deposit of $200</strong> and may take longer to process.
                        </p>
                    </div>

                    {depositStep === 'amount' && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="space-y-3">
                                <Label htmlFor="deposit-amount" className="text-sm font-bold text-foreground">Enter Amount to Deposit (USD)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground">$</span>
                                    <input 
                                        id="deposit-amount" 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={depositAmount} 
                                        onChange={(e) => setDepositAmount(e.target.value)} 
                                        className="w-full h-16 pl-10 text-3xl font-black text-foreground bg-background border-2 border-border focus:border-primary transition-all rounded-2xl outline-none"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic pl-1">Enter the exact amount you wish to add to your balance.</p>
                            </div>
                            <Button 
                                onClick={handleDepositSubmitRequest}
                                className="w-full h-14 btn-primary text-white text-lg font-black rounded-2xl shadow-xl transition-all active:scale-95"
                            >
                                Submit Deposit Request
                            </Button>
                        </div>
                    )}

                    {depositStep === 'methods' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-foreground">Select Payment Method</h3>
                                <Button variant="ghost" size="sm" onClick={() => setDepositStep('amount')} className="text-xs text-muted-foreground gap-1"><ArrowLeft className="h-3 w-3" /> Back</Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Crypto Options</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {additionalMethods.filter(m => m.type === 'crypto').map(method => (
                                            <button 
                                                key={method.id}
                                                onClick={() => { setSelectedDepositMethod(method); setDepositStep('details'); setDepositTimer(20 * 60); }}
                                                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                            >
                                                <div className="h-10 w-10 flex-shrink-0 relative overflow-hidden rounded-full bg-background border border-border p-1">
                                                    {method.icon && <Image src={method.icon.imageUrl} alt={method.name} fill style={{objectFit: 'contain'}} />}
                                                </div>
                                                <span className="font-bold text-sm text-foreground group-hover:text-primary">{method.name}</span>
                                                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Other Options</p>
                                    <div className="max-h-[350px] overflow-y-auto pr-2 pb-60 scrollbar-thin">
                                        <div className="grid grid-cols-1 gap-2">
                                            {additionalMethods.filter(m => m.type === 'manual').map(method => {
                                                const isAmountLow = parseFloat(depositAmount) < 200;
                                                return (
                                                    <button 
                                                        key={method.id}
                                                        disabled={isAmountLow}
                                                        onClick={() => { setSelectedDepositMethod(method); setDepositStep('details'); }}
                                                        className={cn(
                                                            "flex items-center gap-3 p-4 rounded-xl border transition-all text-left relative",
                                                            isAmountLow ? "bg-muted/50 border-border opacity-60 cursor-not-allowed" : "bg-card border-border hover:border-primary hover:bg-primary/5 group"
                                                        )}
                                                    >
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">
                                                            {method.icon ? <div className='h-8 w-8 relative'><Image src={method.icon.imageUrl} alt={method.name} fill style={{objectFit:'contain'}}/></div> : method.name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn("font-bold text-sm text-foreground", !isAmountLow && "group-hover:text-primary")}>{method.name}</span>
                                                            {isAmountLow && <span className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Min: $200</span>}
                                                        </div>
                                                        {!isAmountLow && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {depositStep === 'details' && selectedDepositMethod?.type === 'crypto' && (
                        <div className="space-y-6 animate-fade-in p-2">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 flex-shrink-0 relative overflow-hidden rounded-full bg-background border border-border p-1.5 shadow-sm">
                                        {selectedDepositMethod.icon && <Image src={selectedDepositMethod.icon.imageUrl} alt={selectedDepositMethod.name} fill style={{objectFit: 'contain'}} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground">Pay with {selectedDepositMethod.name}</h3>
                                        <p className="text-xs text-muted-foreground">Send exact amount: <span className="text-foreground font-black">${depositAmount}</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono text-sm px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                        {formatTime(depositTimer)}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setDepositStep('methods')} className="h-7 text-[10px] uppercase font-bold text-muted-foreground">Cancel</Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 border border-dashed border-border rounded-2xl">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-2">{selectedDepositMethod.name} Address:</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 font-mono text-xs bg-background p-4 rounded-xl border border-border break-all text-foreground shadow-inner">
                                            {selectedDepositMethod.address}
                                        </div>
                                        <CopyToClipboard text={selectedDepositMethod.address}>
                                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 hover:bg-muted active:scale-90 transition-all">
                                                <Copy className="h-5 w-5 text-primary" />
                                            </Button>
                                        </CopyToClipboard>
                                    </div>
                                </div>

                                <Alert variant="default" className="bg-muted/50 border-border rounded-2xl py-3">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                                        Please complete your payment within the time provided. After payment, click the <strong>‘I Paid’</strong> button to verify and update your account balance.
                                    </AlertDescription>
                                </Alert>

                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                                    <p className="text-[11px] text-red-700 dark:text-red-300 leading-tight text-center font-black uppercase tracking-tighter">
                                        ⚠️ Clicking “I Paid” button without making payment or without prior communication with support account may be restricted and certain features will be limited.
                                    </p>
                                </div>

                                <Button 
                                    onClick={handleCryptoPaid}
                                    disabled={isProcessingDeposit}
                                    className="w-full h-14 btn-primary text-white text-lg font-black rounded-2xl shadow-xl transition-all active:scale-95"
                                >
                                    {isProcessingDeposit ? <Loader className="animate-spin h-6 w-6" /> : 'I Paid'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {depositStep === 'details' && selectedDepositMethod?.type === 'manual' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center font-black text-white shadow-lg">
                                        {selectedDepositMethod.name.charAt(0)}
                                    </div>
                                    <h3 className="font-black text-foreground">Request Details for {selectedDepositMethod.name}</h3>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setDepositStep('methods')} className="text-xs text-muted-foreground">Change Method</Button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="non-crypto-email" className="text-sm font-bold text-foreground">Confirm Your Contact Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="non-crypto-email" 
                                                type="email" 
                                                placeholder="your@email.com" 
                                                value={depositEmail} 
                                                onChange={(e) => setDepositEmail(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-background border-border text-foreground"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">We will send payment instructions to this email address.</p>
                                    </div>
                                    <div className="text-center py-2 bg-background/50 rounded-xl border border-dashed border-border">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Requesting Deposit for</p>
                                        <p className="text-2xl font-black text-foreground">${depositAmount}</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleNonCryptoProceed}
                                    disabled={isProcessingDeposit}
                                    className="w-full h-14 btn-primary text-white font-black rounded-2xl shadow-xl transition-all active:scale-95"
                                >
                                    {isProcessingDeposit ? <Loader className="animate-spin h-6 w-6" /> : 'Proceed with Deposit Request'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6">
                {/* New Withdrawal Section */}
                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                            <Landmark className="text-primary h-5 w-5" />
                            Withdraw Funds
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Available Balance</p>
                            <p className="text-xl font-black text-foreground">${currentBalance.toFixed(2)}</p>
                        </div>
                        
                        {currentBalance < 15 ? (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-border rounded-xl">
                                <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                                    {currentBalance === 0 
                                        ? "You do not have any funds available to withdraw." 
                                        : "Minimum withdrawal amount is $15.00"}
                                </p>
                            </div>
                        ) : (
                            <Button 
                                onClick={() => setIsWithdrawalModalOpen(true)}
                                className="w-full btn-primary text-white h-11 rounded-xl shadow-lg"
                            >
                                <Landmark className="mr-2 h-4 w-4" />
                                Withdraw Balance
                            </Button>
                        )}
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">Processing takes 0-3 hours. Crypto withdrawals are faster.</p>
                    </CardContent>
                </Card>

                <Card className="border border-border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                            <MessageSquare className="text-blue-600 h-5 w-5" />
                            Support Center
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Having issues? Our technician is available 24/7. Response time: 1-24 hours.</p>
                        <Link href="/my-account/tickets/new" className="w-full">
                            <Button className="w-full btn-primary text-white dark:text-white h-11 rounded-xl shadow-lg">
                                <Ticket className="mr-2 h-4 w-4" />
                                New Support Ticket
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-red-600 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Account Deletion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] text-muted-foreground mb-3">Permanently remove your account and all history.</p>
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

        <Alert className="mb-12 border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 font-bold">Refresh Account</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                If you just deposited, click the refresh button below to update your balance and order status.
            </AlertDescription>
        </Alert>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                <Clock className="h-8 w-8 text-primary" />
                Order History
            </h2>
            <div className="flex items-center gap-4">
                 {canPayBulk && (
                    <Button onClick={handleOpenBulkModal} className="btn-primary text-white dark:text-white shadow-lg animate-pulse">
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
            <div className="text-center py-16 px-6 bg-card rounded-2xl shadow-lg border border-border"><Loader className="animate-spin h-8 w-8 mx-auto text-primary" /></div>
          ) : orders && orders.length > 0 ? (
            <Card className="overflow-hidden border border-border shadow-xl">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Order Date</TableHead>
                    <TableHead className="text-foreground">Order ID</TableHead>
                    <TableHead className="text-foreground">Device</TableHead>
                    <TableHead className="text-foreground">IMEI/Serial</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-right text-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-muted/50 border-border">
                      <TableCell className="text-xs text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-600">{order.orderId}</TableCell>
                      <TableCell className="text-sm font-semibold text-card-foreground">{order.model}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{order.imei}</TableCell>
                      <TableCell>
                        <Badge variant={
                            order.status === 'approved' || order.status === 'unlocked' ? 'secondary' : 
                            order.status === 'declined' ? 'destructive' : 'default'
                        } className={cn("text-[10px] uppercase font-bold", (order.status === 'confirming_payment' || order.status === 'processing' ) && "animate-pulse")}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-sm text-foreground">${order.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="text-center py-20 px-6 bg-card rounded-3xl shadow-inner border border-dashed border-border">
                <p className="text-muted-foreground font-medium">Your order history will appear here once you place an order.</p>
            </div>
          )}
        </section>

        <section>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    Support Tickets
                </h2>
                <Link href="/my-account/tickets/new">
                    <Button variant="outline" size="sm" className="bg-card border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 h-10 px-4 rounded-xl font-bold">
                        <Ticket className="mr-2 h-4 w-4" />
                        New Ticket
                    </Button>
                </Link>
            </div>
            {ticketsLoading ? (
                <p className="text-muted-foreground">Loading tickets...</p>
            ) : tickets && tickets.length > 0 ? (
                <Card className="overflow-hidden border border-border shadow-xl">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border">
                                <TableHead className="text-foreground">Date</TableHead>
                                <TableHead className="text-foreground">Category</TableHead>
                                <TableHead className="text-foreground">Subject</TableHead>
                                <TableHead className="text-foreground">Status</TableHead>
                                <TableHead className="text-right text-foreground">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.sort((a, b) => {
                                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                                return timeB - timeA;
                            }).map(ticket => (
                                <TableRow key={ticket.id} className="border-border">
                                    <TableCell className="text-xs text-muted-foreground">{ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-xs font-bold text-muted-foreground uppercase">{ticket.category}</TableCell>
                                    <TableCell className="font-semibold text-sm text-card-foreground">{ticket.subject}</TableCell>
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
                <div className="text-center py-16 px-6 bg-card rounded-3xl shadow-inner border border-dashed border-border">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">You haven't submitted any support tickets yet.</p>
                </div>
            )}
        </section>
      </main>
      
      <Dialog open={isPasswordModalOpen} onOpenChange={isPasswordModalOpen ? (v) => !isUpdatingPassword && setIsPasswordModalOpen(v) : setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
               <Key className="h-5 w-5 text-primary" />
               Change Your Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Enter a new secure password below.</DialogDescription>
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
             <p className="text-[10px] text-muted-foreground italic">For security, you may be asked to log in again after updating your password.</p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={isUpdatingPassword}>Cancel</Button>
             <Button onClick={handleUpdatePassword} className="btn-primary text-white dark:text-white" disabled={isUpdatingPassword}>
               {isUpdatingPassword ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
               Update Password
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkPayModalOpen} onOpenChange={setIsBulkPayModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-5 py-2.5 border-b border-border bg-card">
                <DialogTitle className="text-base sm:text-lg flex items-center gap-3 pr-12 text-foreground">
                    {timeLeft > 0 && (
                        <span className="text-xs sm:text-sm font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md px-2 py-0.5">
                            {formatTime(timeLeft)}
                        </span>
                    )}
                    <span>Bulk Payment (20% Off)</span>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                    Pay for multiple orders at once and receive a discount. Send the exact amount.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-5">
              <div className="space-y-4 pt-1 pb-60">
                  <div className="text-xs bg-muted p-3 rounded-xl text-muted-foreground space-y-1 mt-2">
                      <p className="font-semibold text-foreground">Unlocking {ordersForBulkPay.length} devices:</p>
                      <ul className="list-disc list-inside text-xs leading-tight">
                          {ordersForBulkPay.map(order => (
                              <li key={order.id}>{order.model} - <span className='font-mono'>{order.imei}</span></li>
                          ))}
                      </ul>
                  </div>

                  <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 py-1.5">
                    <AlertDescription className="text-[11px] text-center text-blue-800 dark:text-blue-300">
                      For other payment options, contact the <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-600">admin</a>.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Original Total</p>
                              <p className="line-through text-base font-medium opacity-60 text-foreground">${bulkTotal.toFixed(2)}</p>
                          </div>
                          <div>
                              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Bulk Discount (20%)</p>
                              <p className="text-base font-bold text-green-600">-${bulkDiscount.toFixed(2)}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Your Balance</p>
                              <p className="text-base font-bold text-green-600">-${currentBalance.toFixed(2)}</p>
                          </div>
                          <div></div>
                      </div>
                      <div className="text-center bg-muted/30 py-3 rounded-xl border border-dashed border-border">
                          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Amount to Pay</p>
                          <p className="text-3xl font-black text-foreground">${bulkAmountToPay.toFixed(2)}</p>
                      </div>
                  </div>
                  
                  {bulkAmountToPay > 0 && (
                    <div className="px-4 py-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            {usdtImage && <Image src={usdtImage.imageUrl} alt="USDT BEP20" width={36} height={36} className="rounded-full" />}
                            <div>
                                <p className="font-bold text-sm text-foreground">USDT (BEP20 Network)</p>
                                <p className="text-[10px] text-muted-foreground">Recommended: Use Binance Smart Chain.</p>
                            </div>
                        </div>
                        <div className="font-mono bg-muted p-3 rounded-xl break-all text-xs flex items-center justify-between border border-border text-foreground">
                            <span className="font-medium">{usdtAddress}</span>
                            <CopyToClipboard text={usdtAddress}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-black/5 dark:hover:bg-white/5">
                                    <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>
                                </Button>
                            </CopyToClipboard>
                        </div>
                    </div>
                  )}

                  {bulkAmountToPay <= 0 && (
                    <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300 rounded-2xl animate-fade-in">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500"/><p className="font-bold text-base">Your balance covers the full amount!</p><p className="text-xs opacity-80">Click "Confirm" to use your balance for this bulk order.</p>
                    </div>
                  )}

                  <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-border rounded-xl">
                      <AlertDescription className="text-[10px] text-center text-yellow-800 dark:text-yellow-300 font-medium">
                          Payments made within the timer will be automatically applied.
                      </AlertDescription>
                  </Alert>
                  
                  {/* Added spacer to ensure Western Union and Apple Cash are fully scrollable */}
                  <div className="space-y-2 pb-60">
                    {/* Additional Methods will be rendered here if necessary, adding the padding to their common container if they were here */}
                  </div>
              </div>
            </ScrollArea>
            <div className="px-5 py-3 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/30">
               <p className="text-[11px] text-red-700 dark:text-red-300 leading-tight text-center font-semibold">
                 ⚠️ Clicking “I Paid” button without making payment or without prior communication with support account may be restricted and certain features will be limited.
               </p>
            </div>
            <DialogFooter className="p-3 border-t border-border flex flex-row gap-3 mt-auto bg-card">
                <Button variant="outline" className="flex-1 h-11 rounded-xl text-sm font-bold shadow-sm" onClick={() => setIsBulkPayModalOpen(false)}>Cancel</Button>
                <Button onClick={handleBulkPaid} className="btn-primary text-white dark:text-white flex-1 h-11 rounded-xl text-sm font-bold shadow-md" disabled={isSubmittingBulk}>
                  {isSubmittingBulk ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                  ) : (
                    bulkAmountToPay > 0 ? 'Paid' : 'Confirm'
                  )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawalModalOpen} onOpenChange={(v) => !isWithdrawing && !withdrawalSuccess && setIsWithdrawalModalOpen(v)}>
        <DialogContent className="sm:max-w-[450px]">
          {isWithdrawing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <Loader className="h-16 w-16 animate-spin text-primary" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Processing Withdrawal</h3>
                <p className="text-sm text-muted-foreground px-6">Processing your withdrawal request...</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono animate-pulse uppercase">Estimated time: 10s</p>
            </div>
          ) : withdrawalSuccess ? (
            <div className="py-10 text-center space-y-6 animate-fade-in">
              <CheckCircle2 className="h-20 w-24 mx-auto text-green-500" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground">Request Submitted!</h3>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl text-green-800 dark:text-green-300 text-sm leading-relaxed mx-2">
                    Your withdrawal request has been submitted. Our support team will review and process your request. If it takes more than 2 days, please submit a support ticket.
                </div>
              </div>
              <Button onClick={() => { setIsWithdrawalModalOpen(false); setWithdrawalSuccess(false); }} className="w-full btn-primary text-white">Understood</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Withdraw Funds</DialogTitle>
                <DialogDescription className="text-muted-foreground">Minimum withdrawal is $15.00. Processing time: 0–3 hours.</DialogDescription>
              </DialogHeader>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                      Once your withdrawal request is approved, you will be required to submit a support ticket with the details of where you would like to receive your funds.
                  </p>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-5 py-4">
                <div className="space-y-2">
                    <Label htmlFor="w-amount">Amount to Withdraw (USD)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                        <Input id="w-amount" type="number" placeholder="Min 15.00" value={withdrawAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className="pl-7" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="w-method">Payment Method</Label>
                    <Select value={withdrawMethod} onValueChange={setWithdrawalMethod} required>
                        <SelectTrigger id="w-method"><SelectValue placeholder="Select method..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USDT">USDT (Crypto)</SelectItem>
                            <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                            <SelectItem value="USDC">USDC (Crypto)</SelectItem>
                            <SelectItem value="CashApp">Cash App</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Venmo">Venmo</SelectItem>
                            <SelectItem value="Zelle">Zelle</SelectItem>
                            <SelectItem value="AppleCash">Apple Cash</SelectItem>
                            <SelectItem value="WesternUnion">Western Union</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {withdrawMethod && (
                    <div className="space-y-2 animate-fade-in">
                        <Label htmlFor="w-details">{isCryptoMethod(withdrawMethod) ? 'Wallet Address' : 'Email Address'}</Label>
                        <Input 
                            id="w-details" 
                            placeholder={isCryptoMethod(withdrawMethod) ? 'Paste your wallet address...' : 'Enter your email address...'} 
                            value={withdrawDetails} 
                            onChange={(e) => setWithdrawalDetails(e.target.value)} 
                            required 
                        />
                        {!isCryptoMethod(withdrawMethod) && (
                            <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                Enter the email address where you would like to be notified once your withdrawal request is approved. You will also receive notifications on the website.
                            </p>
                        )}
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="w-reason">Reason for Withdrawal (Optional)</Label>
                    <Textarea id="w-reason" placeholder="e.g., Change of plans, surplus balance..." value={withdrawReason} onChange={(e) => setWithdrawalReason(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full btn-primary text-white dark:text-white h-12 font-bold shadow-lg">Proceed with Withdrawal Request</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={isDeleteModalOpen ? (v) => !isDeleting && setIsDeleteModalOpen(v) : setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">Confirm Account Deletion</DialogTitle>
                <DialogDescription className="text-muted-foreground">This action is irreversible. All your orders, balance, and history will be lost.</DialogDescription>
            </DialogHeader>
            <div className="py-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-800 dark:text-red-300 text-xs font-medium">
                ⚠️ Your request will be reviewed by an administrator within 48 hours. If you have an active balance, it will be forfeited unless withdrawn first.
            </div>
            <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1" disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 font-bold">
                    {isDeleting ? <Loader className="animate-spin h-4 w-4" /> : 'Confirm Deletion'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDepositRequestSuccess} onOpenChange={setShowDepositRequestSuccess}>
        <DialogContent className="sm:max-w-[450px]">
            <div className="py-10 text-center space-y-6 animate-fade-in">
                <div className="h-20 w-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                    <DialogTitle className="text-2xl font-black text-foreground">Request Received!</DialogTitle>
                    <div className="p-5 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl text-green-800 dark:text-green-300 text-sm leading-relaxed mx-2 shadow-sm">
                        "Your deposit request has been received. Support has been notified and will provide payment details and instructions via notifications and email shortly."
                    </div>
                </div>
                <Button onClick={() => setShowDepositRequestSuccess(false)} className="w-full btn-primary text-white h-12 rounded-xl font-bold shadow-lg">Understood, Thanks</Button>
            </div>
        </DialogContent>
      </Dialog>

      <footer className="bg-slate-950 text-white py-12">
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
                            <a href="https://t.me/iCloudUnlocks2023" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                <Image src="https://i.postimg.cc/0NsBwhhG/Screenshot-2025-11-29-at-11-01-37.png" alt="Telegram" width={18} height={18} className="mr-2" />
                                Telegram Channel
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                <Image src="https://i.postimg.cc/0NsBwhhG/Screenshot-2025-11-29-at-11-01-37.png" alt="Telegram" width={18} height={18} className="mr-2" />
                                Support 1
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/iUnlock_Apple" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                <Image src="https://i.postimg.cc/0NsBwhhG/Screenshot-2025-11-29-at-11-01-37.png" alt="Telegram" width={18} height={18} className="mr-2" />
                                Support 2
                            </a>
                        </li>
                        <li className='block'>
                            <a href="https://t.me/Chris_Morgan057" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                <Image src="https://i.postimg.cc/0NsBwhhG/Screenshot-2025-11-29-at-11-01-37.png" alt="Telegram" width={18} height={18} className="mr-2" />
                                Technician
                            </a>
                        </li>
                        <li className='block'>
                           <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
                                <Image src="https://i.postimg.cc/3Jbr4p5L/icon.png" alt="WhatsApp" width={18} height={18} className="mr-2" />
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