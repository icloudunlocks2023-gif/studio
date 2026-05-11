'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoginButton } from '@/components/login-button';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Copy, Menu, Loader, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, XCircle, Info, MessageSquare, Bell, Mail } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VerificationAnimation } from '@/components/ui/verification-animation';
import { cn } from '@/lib/utils';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { Progress } from '@/components/ui/progress';
import { PaymentVerificationAnimation } from '@/components/ui/payment-verification-animation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { ThemeToggle } from '@/components/theme-toggle';

interface Submission {
  id: string;
  userId: string;
  model: string;
  price: number;
  image: string;
  imei: string;
  status: 'waiting' | 'eligible' | 'not_supported' | 'paid' | 'feedback' | 'find_my_off' | 'device_found' | 'chimaera' | 'banned';
  icloudStatus?: 'clean' | 'lost';
  successRate?: number;
  feedback: string[] | null;
  ipAddress?: string;
  country?: string;
  createdAt: any;
}

interface UserProfile {
    id: string;
    balance?: number;
    ipAddress?: string;
    country?: string;
}

interface BannedUser {
    id: string;
    userId: string;
    createdAt: any;
}

interface Counters {
    isServerOnline?: boolean;
    usdtAddress?: string;
}

interface PaymentClaim {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
}

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

const verificationStepsList = [
    "Validating request and input format",
    "Normalizing device identifier (IMEI / Serial / TAC)",
    "Completing Cloudflare security verification",
    "Connecting to iCloud unlock servers",
    "Querying manufacturer and model reference database",
    "Checking device model details",
    "Checking iCloud (Find My) activation status",
    "Checking blacklist / carrier status",
    "Searching multiple secure data sources",
    "Correlating results and resolving matches",
    "Applying server-side validation rules",
    "Verifying unlock server support eligibility",
    "Finalizing compatibility check"
];

function VerificationSteps({ steps }: { steps: string[] }) {
    const [revealedStep, setRevealedStep] = useState(0);

    useEffect(() => {
        if (revealedStep < steps.length) {
            const timer = setTimeout(() => {
                setRevealedStep(prev => prev + 1);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [revealedStep, steps.length]);

    return (
        <div className="w-full text-left p-4 md:p-6 space-y-3">
            {steps.slice(0, revealedStep).map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-sm animate-fade-in">
                    {index < revealedStep - 1 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                        <Loader className="h-5 w-5 animate-spin text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-foreground">{step}</span>
                </div>
            ))}
        </div>
    );
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
    // Log the specific copy action
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

function DeviceCheckContent() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const model = searchParams.get('model') || 'Unknown Model';
  const price = Number(searchParams.get('price')) || 0;
  const lostPrice = price > 50 ? price - 15 : price - 10;
  const image = searchParams.get('image') || '/placeholder.svg';
  const { toast } = useToast();

  const [imei, setImei] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { data: submission, loading: submissionLoading } = useDoc<Submission>('submissions', submissionId || ' ');
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || ' ');
  const { data: bannedUser, loading: bannedUserLoading } = useDoc<BannedUser>('banned_users', user?.uid || ' ');
  const { data: counters } = useDoc<Counters>('counters', 'metrics');

  const isServerOnline = counters?.isServerOnline !== false;
  const usdtAddress = counters?.usdtAddress || '0x2a2aA545c902de10dbE882ddaF4aF431982a8E5f';

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(true);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing payment...');
  const [isChecking, setIsChecking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  
  const [showDeviceFoundNotif, setShowDeviceFoundNotif] = useState(false);
  const [startVerificationSteps, setStartVerificationSteps] = useState(false);

  const [showCachedDataNotification, setShowCachedDataNotification] = useState(false);
  const [isCachedCheck, setIsCachedCheck] = useState(false);
  
  const [isOfflineSimulating, setIsOfflineSimulating] = useState(false);
  const [offlineError, setOfflineError] = useState(false);

  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [claimRejected, setClaimRejected] = useState(false);

  // New States for enhanced payment flow
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [nonCryptoEmail, setNonCryptoEmail] = useState('');
  const [showDepositRequestSuccess, setShowDepositRequestSuccess] = useState(false);

  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');
  const usdtImage = getImage('usdt-icon');
  const bitcoinImage = getImage('bitcoin-icon');
  const ethereumImage = getImage('eth-icon');
  const usdcImage = getImage('usdc-icon');

  const formDisabled = isChecking || isSearching || !!submission || isOfflineSimulating || !!verifyingClaimId || isPolicyModalOpen;
  const shouldShowLoader = (isChecking || (submission && submission.status === 'waiting') || isOfflineSimulating) && !offlineError;

  useEffect(() => {
    if (submission?.status === 'device_found') {
        setShowDeviceFoundNotif(true);
        const timer = setTimeout(() => {
            setShowDeviceFoundNotif(false);
            setStartVerificationSteps(true);
        }, 5000);
        return () => clearTimeout(timer);
    } else if (submission?.status && submission.status !== 'waiting') {
        setShowDeviceFoundNotif(false);
        setStartVerificationSteps(false);
    }
  }, [submission?.status, submission?.id]);

  useEffect(() => {
    if (!verifyingClaimId || !firestore) return;

    const claimRef = doc(firestore, 'payment_claims', verifyingClaimId);
    const unsubscribe = onSnapshot(claimRef, (snapshot) => {
      if (snapshot.exists()) {
        const claimData = snapshot.data() as PaymentClaim;
        if (claimData.status === 'approved') {
          router.push('/my-account');
          toast({
            title: "Payment Verified",
            description: "Your payment has been confirmed. Opening your account...",
          });
        } else if (claimData.status === 'rejected') {
          setVerifyingClaimId(null);
          setClaimRejected(true);
        }
      }
    });

    return () => unsubscribe();
  }, [verifyingClaimId, firestore, router, toast]);

  const feedbackData = useMemo(() => {
    if (!submission?.feedback) return { lines: [], timestamp: null };
    const lines = submission.feedback.filter(line => !line.startsWith('TIMESTAMP:'));
    const timestampLine = submission.feedback.find(line => line.startsWith('TIMESTAMP:'));
    const timestamp = timestampLine ? timestampLine.replace('TIMESTAMP:', '') : null;
    return { lines, timestamp };
  }, [submission?.feedback]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPaymentModalOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPaymentModalOpen) {
      setPaymentModalOpen(false);
      toast({
        title: "Payment window expired",
        description: "Please try again.",
        variant: "destructive",
      });
    }
    return () => clearInterval(timer);
  }, [isPaymentModalOpen, timeLeft, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submission?.status === 'waiting') {
      timer = setTimeout(() => {
        setOfflineError(true);
      }, 5 * 60 * 1000);
    }
    return () => clearTimeout(timer);
  }, [submission?.status]);
  
  const handleClear = () => {
    setImei('');
    setSubmissionId(null);
    setValidationError(null);
    setShowDeviceFoundNotif(false);
    setStartVerificationSteps(false);
    setShowCachedDataNotification(false);
    setIsCachedCheck(false);
    setIsOfflineSimulating(false);
    setOfflineError(false);
    setIsChecking(false);
    setIsSearching(false);
    setVerifyingClaimId(null);
    setClaimRejected(false);
    setSelectedMethod(null);
    setNonCryptoEmail('');
  };

  useEffect(() => {
    handleClear();
  }, [model]);

  useEffect(() => {
    if (!userLoading && !user) {
      const redirectPath = `/client-portal?${searchParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [user, userLoading, router, searchParams]);
  
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  const handleSubmitImei = async () => {
    if (!user || isSearching || isChecking) return;

    const trimmedImei = imei.trim();
    const isImeiValid = /^\d{15}$/.test(trimmedImei);
    const isSerialValid = /^[a-zA-Z0-9]{10,13}$/.test(trimmedImei);

    setValidationError(null);
    setShowDeviceFoundNotif(false);
    setStartVerificationSteps(false);
    setOfflineError(false);
    setClaimRejected(false);

    setIsSearching(true);

    // Prioritize stored IP/Country for consistency
    let clientIp = userProfile?.ipAddress || localStorage.getItem('detected_ip') || 'unknown';
    let country = userProfile?.country || localStorage.getItem('detected_country') || 'unknown';

    // Only fetch if not already captured or cached
    if (clientIp === 'unknown') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const ipResponse = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              clientIp = ipData.ip || 'unknown';
              country = ipData.country_name || 'unknown';
              
              // Persist locally for future requests in this session or revisits
              if (clientIp !== 'unknown') {
                  localStorage.setItem('detected_ip', clientIp);
                  localStorage.setItem('detected_country', country);
              }
            }
        } catch (e) {
            console.warn("IP/Country fetch failed during submission, using fallback.");
        }
    }

    const tgMessage = `🚨 <b>Device Check Attempt!</b> 🚀\n\n<b>Model:</b> ${model}\n<b>IMEI/Serial:</b> ${trimmedImei || '<i>(empty)</i>'}\n<b>User ID:</b> ${user.uid}\n<b>IP:</b> ${clientIp}\n<b>Country:</b> ${country}\n<b>Format Status:</b> ${isImeiValid || isSerialValid ? 'Format OK' : 'Invalid Format'}`;
    
    fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: tgMessage }),
    }).then(res => {
      if (!res.ok) {
        console.error('Notification failed to send. Check server logs.');
      }
    }).catch(err => {
      console.error('Notification network error:', err);
    });

    const ipBanRef = doc(firestore, 'banned_ips', clientIp.replace(/\./g, '_'));
    const ipBanDoc = await getDoc(ipBanRef);
    if (ipBanDoc.exists()) {
        setIsSearching(false);
        setValidationError('Access Restricted\n\nThis network has been flagged for unusual activity, such as creating multiple accounts or exceeding the limit for free IMEI / Serial checks.\n\nAs a result, access to device checking services from this network has been temporarily restricted to protect system integrity and ensure fair usage for all clients.\n\nIf you believe this restriction has been applied in error or would like to continue using the service, please contact Support for review. Our team will verify your activity and may reset your access if appropriate.\n\nThank you for your understanding and cooperation.');
        return;
    }
    
    if (bannedUser) {
        setIsSearching(false);
        setValidationError('Maximum Free Checks Reached\n\nYou have reached the limit for free IMEI / Serial checks without placing an unlock order.\n\nThis may also happen if an order was created and the “I Paid” button was clicked without completing or arranging the payment with Support.\n\nPlease contact the Admin if you wish to proceed and have your account reset.');
        return;
    }
    
    if (!isImeiValid && !isSerialValid) {
        setIsSearching(false);
        setValidationError('Enter Valid IMEI or Serial');
        return;
    }

    try {
      const submissionsRef = collection(firestore, 'submissions');
      const q = query(
        submissionsRef,
        where('imei', '==', trimmedImei)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Submission) }));
        const docsWithFeedback = existingDocs.filter(s => s.status !== 'waiting');
        
        const notSupportedMatch = docsWithFeedback.find(s => s.status === 'not_supported');
        if (notSupportedMatch) {
            setIsSearching(false);
            setIsChecking(true);
            setIsCachedCheck(true);
            setTimeout(() => {
                setIsChecking(false);
                setShowCachedDataNotification(true);
                setTimeout(() => {
                    setShowCachedDataNotification(false);
                    setSubmissionId(notSupportedMatch.id);
                }, 3000); 
            }, 4000); 
            return;
        }

        const eligibleMismatch = docsWithFeedback.find(s => (s.status === 'eligible' || s.status === 'chimaera') && s.model !== model);
        if (eligibleMismatch) {
            setIsSearching(false);
            setValidationError(`Device Mismatch\n\nThis IMEI / Serial Number is already registered in our database as eligible for unlock under a different model: ${eligibleMismatch.model}.\n\nPlease ensure you have selected the correct device model or contact support.`);
            return;
        }

        const sameModelMatch = docsWithFeedback.find(s => s.model === model);
        if (sameModelMatch) {
            setIsSearching(false);
            setIsChecking(true);
            setIsCachedCheck(true);
            setTimeout(() => {
                setIsChecking(false);
                setShowCachedDataNotification(true);
                setTimeout(() => {
                    setShowCachedDataNotification(false);
                    setSubmissionId(sameModelMatch.id);
                }, 3000); 
            }, 4000); 
            return;
        }
      }
    } catch (e) {
        console.error("Submission check error:", e);
    }

    setIsSearching(false);
    setIsChecking(true);

    const newSubmission = {
      userId: user.uid,
      model,
      price,
      image,
      imei: trimmedImei,
      status: 'waiting' as const,
      feedback: null,
      ipAddress: clientIp,
      country: country,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(firestore, 'submissions'), newSubmission)
      .then((docRef) => {
        setSubmissionId(docRef.id);
        
        if (!isServerOnline) {
            setIsChecking(false);
            setIsOfflineSimulating(true);
            setTimeout(() => {
                setIsOfflineSimulating(false);
                setOfflineError(true);
            }, 10000);
        } else {
            setIsChecking(false);
        }
      })
      .catch(async (serverError) => {
        setIsChecking(false);
        const permissionError = new FirestorePermissionError({
          path: 'submissions',
          operation: 'create',
          requestResourceData: newSubmission,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const openPaymentModal = async () => {
    if (!submission?.imei) return;

    setIsLoading(true);
    setLoadingMessage('Verifying status...');

    try {
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('imei', '==', submission.imei), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsLoading(false);
        toast({
          title: "Order Already Submitted",
          description: "An unlock order of the device had already been submitted. Contact admin for any assistance or submit a ticket with the Order ID.",
          variant: "destructive",
          duration: 6000,
        });
        return;
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    }

    setTimeLeft(20 * 60);
    setLoadingMessage('Processing payment...');
    setShowOtherPayments(false);
    setSelectedMethod(null);

    setTimeout(() => {
      setLoadingMessage('Checking account balance...');
      setTimeout(() => {
        setLoadingMessage('No enough balance. Proceeding with payment details...');
        setTimeout(() => {
          setIsLoading(false);
          setPaymentModalOpen(true);
        }, 3000);
      }, 2000);
    }, 2000);
  };
  
  const handlePaid = () => {
    if (isSubmittingOrder) return;
    if (!submissionId || !submission || !user) return;

    setIsSubmittingOrder(true);

    const generateRandomPart = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const newOrderId = `#ORD-${generateRandomPart(5)}`;

    const effectivePrice = submission.icloudStatus === 'lost' ? lostPrice : submission.price;

    const newClaimData = {
      orderId: newOrderId,
      userId: user.uid,
      submissionId: submissionId,
      imei: submission.imei,
      model: submission.model,
      price: effectivePrice,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(firestore, 'payment_claims'), newClaimData)
      .then((docRef) => {
        // Send instant Telegram notification for crypto payment claim
        const tgMessage = `💰 <b>CRYPTO PAYMENT CLAIM!</b> 🚀\n\n<b>User:</b> ${user.email}\n<b>Device:</b> ${submission.model}\n<b>IMEI:</b> ${submission.imei}\n<b>Amount:</b> $${effectivePrice}\n<b>Order ID:</b> ${newOrderId}\n<b>Status:</b> Awaiting verification.`;
        
        fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: tgMessage }),
        }).catch(err => console.error("Telegram notification failed:", err));

        setVerifyingClaimId(docRef.id);
        setPaymentModalOpen(false);
        setIsSubmittingOrder(false);
        toast({
          title: "Payment Claim Received",
          description: "Our system is now scanning for your payment. Please stay on this page.",
        });
      })
      .catch(async (serverError) => {
        setIsSubmittingOrder(false);
        const permissionError = new FirestorePermissionError({
          path: 'payment_claims',
          operation: 'create',
          requestResourceData: newClaimData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleNonCryptoProceed = async () => {
    if (!nonCryptoEmail || !nonCryptoEmail.includes('@')) {
        return toast({ title: "Valid Email Required", variant: "destructive" });
    }
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);

    const generateRandomPart = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const newOrderId = `#ORD-${generateRandomPart(5)}`;
    const effectivePrice = submission?.icloudStatus === 'lost' ? lostPrice : submission?.price || price;

    const claimData = {
      orderId: newOrderId,
      userId: user?.uid,
      submissionId: submissionId,
      imei: submission?.imei,
      model: submission?.model,
      price: effectivePrice,
      status: 'pending' as const,
      method: selectedMethod.name,
      clientEmail: nonCryptoEmail,
      createdAt: serverTimestamp(),
    };

    try {
        await addDoc(collection(firestore, 'payment_claims'), claimData);
        const tgMessage = `💰 <b>NON-CRYPTO UNLOCK REQUEST!</b> 💰\n\n<b>User:</b> ${user?.email}\n<b>Device:</b> ${submission?.model}\n<b>IMEI:</b> ${submission?.imei}\n<b>Amount:</b> $${effectivePrice}\n<b>Method:</b> ${selectedMethod.name}\n<b>Client Email:</b> ${nonCryptoEmail}`;
        
        await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: tgMessage }),
        });

        setPaymentModalOpen(false);
        setShowDepositRequestSuccess(true);
        setIsSubmittingOrder(false);

        setTimeout(() => {
            router.push('/my-account');
        }, 5000);

    } catch (e) {
        setIsSubmittingOrder(false);
        toast({ title: "Error", description: "Failed to notify support.", variant: "destructive" });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentBalance = userProfile?.balance || 0;
  
  const activePrice = submission?.icloudStatus === 'lost' ? lostPrice : submission?.icloudStatus === 'clean' ? price : null;
  const amountToPay = activePrice ? Math.max(0, activePrice - currentBalance) : Math.max(0, price - currentBalance);

  const additionalMethods = [
    { id: 'btc', name: 'Bitcoin (BTC)', address: 'bc1qxk6lezz8qna2zqc5p9kzluyqg0tnnc9n2yf2s5', type: 'crypto', icon: getImage('bitcoin-icon') },
    { id: 'usdt-trc20', name: 'USDT (TRC20)', address: 'TXcf9y4fmH2dU4SD7psf4v4PmDUbiEz9yB', type: 'crypto', icon: getImage('usdt-trc20-icon') },
    { id: 'usdc-erc20', name: 'USDC (ERC20)', address: '0x14f7B2e7EaB06Af1Adab71d05d80649EBcb65692', type: 'crypto', icon: getImage('usdc-icon') },
    { id: 'eth', name: 'Ethereum (ETH)', address: '0x14f7B2e7EaB06Af1Adab71d05d80649EBcb65692', type: 'crypto', icon: getImage('eth-icon') },
    { id: 'cashapp', name: 'Cash App', icon: getImage('cashapp-icon'), type: 'manual' },
    { id: 'paypal', name: 'PayPal', icon: getImage('paypal-icon'), type: 'manual' },
    { id: 'venmo', name: 'Venmo', icon: getImage('venmo-icon'), type: 'manual' },
    { id: 'zelle', name: 'Zelle', icon: getImage('zelle-icon'), type: 'manual' },
    { id: 'applecash', name: 'Apple Cash', icon: getImage('apple-pay-icon'), type: 'manual' },
    { id: 'wu', name: 'Western Union', icon: getImage('wu-icon'), type: 'manual' },
  ];

  if (userLoading || !user || profileLoading || bannedUserLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  const renderContent = () => {
    if (verifyingClaimId) {
      return <PaymentVerificationAnimation />;
    }

    if (claimRejected) {
      return (
        <div className="w-full max-w-lg mx-auto p-8 text-center animate-fade-in">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-4">Verification Failed</h3>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-6 text-red-800 dark:text-red-300 text-sm leading-relaxed">
            "No payment matching this order has been detected. If you believe this is an error, please contact support or submit a support ticket with your payment details so our team can review the transaction and assist you.."
          </div>
          <Button variant="outline" className="mt-6" onClick={() => setClaimRejected(false)}>
            Back to Device Details
          </Button>
        </div>
      );
    }

    if (validationError) {
      return (
          <div className="w-full text-left p-4">
              <div className="p-4 px-5 rounded-md bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm whitespace-pre-wrap font-mono text-red-800 dark:text-red-300 animate-fade-in leading-relaxed">
                {validationError}
              </div>
          </div>
      );
    }

    if (offlineError) {
        return (
            <div className="w-full max-w-2xl mx-auto p-6 text-center animate-blink-slow">
                <div className="flex justify-center mb-4">
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">⚠️ Device Check Failed</h3>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                    <p>We are currently unable to complete your IMEI / Serial device check. One or more device check servers may be temporarily offline or experiencing high traffic volume.</p>
                    <p>Please try again later. Our system will automatically resume full compatibility validation once the server connection is restored.</p>
                    <p className="font-semibold">We appreciate your patience.</p>
                </div>
            </div>
        );
    }
    
    if (shouldShowLoader) return <VerificationAnimation />;

    if (showCachedDataNotification) {
      return (
        <div className="flex flex-col items-center justify-center h-full animate-pop-in">
          <CheckCircle2 className="w-24 h-24 text-blue-500 mb-4" />
          <h2 className="text-3xl font-bold text-foreground text-center px-4">Device data already in the database</h2>
          <div className="flex items-center gap-3 mt-4">
            <Loader className="h-6 w-6 animate-spin text-blue-500" />
            <p className="text-lg text-muted-foreground">Loading existing information...</p>
          </div>
        </div>
      );
    }

    if (!submissionId) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <p className="font-semibold text-foreground">No IMEI submitted yet.</p>
              <p className="text-sm text-muted-foreground">Submit your IMEI or serial number to check if unlock is supported.</p>
            </div>
        );
    }
    if (!submission && submissionId && !submissionLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <p className="font-semibold text-destructive">This submission was not found.</p>
              <p className="text-sm text-muted-foreground">It may have been deleted by an administrator. Please clear and try again.</p>
            </div>
        );
    }

    if (submission?.status === 'device_found') {
        if (showDeviceFoundNotif) {
            return (
                <div className="flex flex-col items-center justify-center h-full animate-pop-in text-center px-6">
                    <CheckCircle2 className="w-24 h-24 text-green-500 mb-4" />
                    <h2 className="text-3xl font-bold text-foreground mb-2">Device Identified.</h2>
                    <div className="text-lg text-muted-foreground flex items-center justify-center">
                        <span>Initializing unlock verification sequence</span>
                        <span className="inline-flex ml-1 font-bold">
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                        </span>
                    </div>
                </div>
            );
        }
        if (startVerificationSteps) return <VerificationSteps steps={verificationStepsList} />;
    }

    if (submission && ['eligible', 'not_supported', 'feedback', 'find_my_off', 'chimaera', 'banned'].includes(submission.status)) {
        if (submission.status === 'banned') {
            const feedbackText = feedbackData.lines.join('\n');
            return (
                <div className="w-full text-left p-4 space-y-6">
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-200 text-sm leading-relaxed whitespace-pre-wrap font-mono animate-fade-in shadow-sm">
                        {feedbackText}
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-2xl animate-fade-in relative overflow-hidden text-center">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-6">Contact Support to Reset Your Account</h3>
                        <div className="relative inline-block group">
                            <div className="absolute -inset-1 bg-white/30 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                            <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="relative block">
                                <Button className="bg-white text-blue-700 hover:bg-gray-50 font-black px-10 h-16 rounded-xl text-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group animate-bounce">
                                    Reset Support
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        const specialStatusLines = feedbackData.lines.filter(line => line === 'FIND_MY_ON_STATUS' || line === 'FIND_MY_OFF_STATUS');
        const chimaeraHeading = "Chimaera Device Policy & Blacklist (Blocked by Apple)";
        const isChimaera = submission.status === 'chimaera' || feedbackData.lines.includes(chimaeraHeading);

        const feedbackText = feedbackData.lines
            .filter(line => !specialStatusLines.includes(line) && line !== chimaeraHeading)
            .map(line => line
                .replace(/undefined/gi, '')
                .replace(/\(undefined\)/gi, '')
                .replace(/(iPhone)(\d+)/gi, '$1 $2')
                .trim()
            )
            .filter(line => line !== '')
            .join('\n');
        
        const shouldAnimate = !isCachedCheck && (submission.status === 'eligible' || submission.status === 'chimaera');

        const getEstimatedTime = (rate: number) => {
          if (rate >= 98) return "Usually completed in less than 24 hours.";
          if (rate >= 75) return "This process may take up to 2 days.";
          if (rate >= 45) return "Maximum expected wait time is up to 72 hours.";
          return "Maximum expected wait time is up to 72 hours.";
        };
        
        return (
            <div className="w-full text-left p-4 space-y-4">
              <div className="space-y-2">
                {submission.icloudStatus && (
                   <div className={cn("p-2 px-3 rounded-md font-mono text-sm border flex items-center gap-2 animate-fade-in mb-2", submission.icloudStatus === 'clean' ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300")}>
                      <span className="font-bold uppercase">iCloud Status: {submission.icloudStatus}</span>
                   </div>
                )}

                {isChimaera && (
                  <div className="p-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 font-bold text-sm sm:text-base animate-fade-in shadow-sm flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>{chimaeraHeading}</span>
                  </div>
                )}

                {specialStatusLines.map((line, index) => {
                  if (line === 'FIND_MY_ON_STATUS') {
                    return (
                      <div key={`special-${index}`} className="p-2 px-3 rounded-md bg-card border border-border text-sm font-mono flex items-center gap-2 animate-fade-in">
                        <span className="text-foreground">Find My:</span>
                        <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">ON</span>
                      </div>
                    )
                  }
                  if (line === 'FIND_MY_OFF_STATUS') {
                    return (
                      <div key={`special-${index}`} className="p-2 px-3 rounded-md bg-card border border-border text-sm font-mono flex items-center gap-2 animate-fade-in">
                        <span className="text-foreground">Find My:</span>
                        <span className="bg-green-500 text-white font-bold px-2 py-0.5 rounded-md text-xs">OFF</span>
                      </div>
                    )
                  }
                  return null;
                })}

                {feedbackText && (
                  shouldAnimate ? (
                    <TypingAnimation 
                        text={feedbackText} 
                        duration={5000} 
                        className="p-2 px-3 rounded-md bg-card border border-border text-sm font-mono text-foreground"
                    />
                  ) : (
                    <div className="p-2 px-3 rounded-md bg-card border border-border text-sm font-mono whitespace-pre-wrap animate-fade-in text-foreground">
                      {feedbackText}
                    </div>
                  )
                )}
              </div>

              {(submission.status === 'eligible' || submission.status === 'chimaera') && submission.successRate && (
                <div className="mt-6 space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wide">
                      <span className={cn(submission.successRate >= 75 ? "text-green-600" : "text-red-600")}>
                        Unlock Success Rate
                      </span>
                      <span className={cn(submission.successRate >= 75 ? "text-green-600" : "text-red-600")}>
                        {submission.successRate}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", submission.successRate >= 75 ? "bg-green-500" : "bg-red-500")}
                        style={{ width: `${submission.successRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[13px] font-bold text-foreground">
                      Estimated processing time: {getEstimatedTime(submission.successRate)}
                    </p>
                    <div className="flex gap-2 bg-muted/30 p-3 rounded-xl border border-border">
                      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                        Unlock processing time depends on server response, device verification stages, and Apple activation server synchronization. In most cases it is completed within the estimated time, but delays can occasionally occur due to server traffic or additional verification checks.
                      </p>
                    </div>
                  </div>
                  
                  {submission.successRate <= 45 && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-[13px] text-red-800 dark:text-red-300 space-y-3 leading-relaxed shadow-sm">
                      <p className="font-bold">Advice: It is recommended not to proceed with the unlock due to the low success probability.</p>
                      <p>If you choose to proceed, please note that in the event the unlock is unsuccessful, only 70% of the payment will be refunded. The remaining 30% will be retained as a processing service fee.</p>
                      <p>If you agree to these terms, you may still proceed with the unlock order.</p>
                      <div className="pt-2 border-t border-red-200 dark:border-red-900/50 space-y-1 text-xs opacity-90">
                        <p>• Refunds will be processed using the same payment method used for the original transaction.</p>
                        <p>• If the unlock order is confirmed unsuccessful, the client must submit a support ticket or contact support with their Order ID to request the refund.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {feedbackData.timestamp && (
                <p className="text-xs text-muted-foreground mt-2 text-right animate-fade-in">Feedback received: {feedbackData.timestamp}</p>
              )}
              {(submission.status === 'eligible' || submission.status === 'chimaera') && (
                <div className="mt-4 flex flex-col sm:flex-row items-center sm:justify-end gap-4 animate-fade-in">
                  <p className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-300 font-semibold p-2 px-3 rounded-lg text-sm block w-full sm:w-auto text-center">
                    ✅ This device is eligible for iCloud Unlock
                  </p>
                  <Button 
                    onClick={openPaymentModal} 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-white transition-all font-bold shadow-sm w-full sm:w-auto"
                  >
                    Proceed with Unlock
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
               {submission.status === 'not_supported' && (
                 <p className="bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-green-300 font-semibold p-2 px-3 rounded-lg mt-4 text-center animate-fade-in text-sm">❌ Unable to proceed with the unlock.</p>
               )}
               {submission.status === 'find_my_off' && (
                 <p className="bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 font-semibold p-2 px-3 rounded-lg mt-4 text-center animate-fade-in text-sm leading-relaxed">
                    Find My is OFF. If you need help restoring your device, please contact the {' '}
                    <a href="https://t.me/Chris_Morgan057" target="_blank" rel="noopener noreferrer" className="underline font-bold">technician</a>.
                 </p>
               )}
               {submission.status === 'feedback' && (
                 <p className="bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 font-semibold p-2 px-3 rounded-lg mt-4 text-center animate-fade-in text-sm">ℹ️ Select the above device model and check again.</p>
               )}
            </div>
        );
    }
    return null;
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
                    <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium ring-1 ring-inset ring-primary">Services</Link>
                    {user && <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">My Account</Link>}
                    {isAdmin && <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Admin</Link>}
                    {user && <NotificationDropdown />}
                    <ThemeToggle />
                    <LoginButton />
                </div>
                <div className="md:hidden flex items-center gap-2">
                  <ThemeToggle />
                  <Sheet>
                    <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 p-4">
                        <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                        <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors ring-1 ring-inset ring-primary">Services</Link>
                        {user && <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">My Account</Link>}
                        {isAdmin && <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Admin</Link>}
                        {user && (
                          <div className="flex items-center gap-2 py-2">
                            <span className="text-gray-700 dark:text-gray-300 text-base font-medium">Notifications</span>
                            <NotificationDropdown />
                          </div>
                        )}
                        <div className='pt-4'><LoginButton /></div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
            </div>
        </div>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-card p-6 rounded-2xl shadow-lg md:flex md:gap-6 md:items-center border border-border">
          <div className="relative w-full md:w-56 h-36 flex-shrink-0 rounded-lg bg-muted overflow-hidden mb-4 md:mb-0">
             <Image src={image} alt={model} layout="fill" objectFit="cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1 text-foreground">{model}</h2>
            <div className="text-xl font-bold mb-2">
              {submission?.icloudStatus ? (
                <span className="text-blue-600">${submission.icloudStatus === 'lost' ? lostPrice : price} ({submission.icloudStatus.charAt(0).toUpperCase() + submission.icloudStatus.slice(1)} iCloud Status)</span>
              ) : (
                <span className="text-blue-600">${price} Clean iCloud Status / <span className="text-red-600">${lostPrice} Lost iCloud Status</span></span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                id="imei-input"
                type="text"
                placeholder="Enter IMEI or Serial number"
                value={submission ? submission.imei : imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full sm:w-80 h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={formDisabled}
              />
              <div className="flex gap-3">
                <Button onClick={handleSubmitImei} className="btn-primary text-white" disabled={formDisabled}>
                    {isSearching ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit
                </Button>
                <Button onClick={handleClear} variant="outline" disabled={formDisabled}>Clear</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              The server will run checks on the submitted IMEI or serial number and return the results on this page. Please do not close the page until the feedback loads. You may minimize the page while waiting.
            </p>
          </div>
        </div>

        <div className={cn("mt-5 rounded-lg border border-border", (shouldShowLoader || verifyingClaimId) ? "bg-card overflow-hidden" : "p-4 bg-muted/30 min-h-[120px] flex items-center justify-center flex-col text-center")}>
          {renderContent()}
        </div>
      </main>

      <footer className="bg-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="mb-4 flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></div>
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
                <p>&copy; 2023 iCloud Unlocks. All rights reserved.</p>
            </div>
        </div>
      </footer>
      
      <Dialog open={isPolicyModalOpen} onOpenChange={() => {}}>
        <DialogContent 
            className="sm:max-w-[550px] p-0 overflow-hidden [&>button]:hidden" 
            onPointerDownOutside={(e) => e.preventDefault()} 
            onEscapeKeyDown={(e) => e.preventDefault()}
        >
            <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                <DialogTitle className="text-xl font-bold text-foreground">Device Check Policy & Account Limits</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground text-base">For new accounts, you are provided with:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>2 premium checks (detailed device information)</li>
                        <li>2 standard checks (less detailed information)</li>
                    </ul>
                    <p>If no unlock order is placed after these checks, your account will be restricted on the 5th check, and access to iCloud unlock services will be limited.</p>
                    
                    <p className="font-semibold text-foreground text-base">To restore access, you can:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Deposit the required amount to unlock a device, or</li>
                        <li>Contact Admin for assistance</li>
                    </ul>

                    <p className="font-semibold text-foreground text-base">If you make a deposit and the device is not supported, you may either:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Use the balance to try unlocking another device, or</li>
                        <li>Request a 100% refund via the same payment method used</li>
                    </ul>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300 text-xs">
                        <p>⚠️ <strong>Please only check devices you are ready to unlock to avoid restrictions.</strong></p>
                    </div>

                    <p className="text-muted-foreground italic">For accounts that have successfully placed unlock orders, all future checks will include premium, detailed device information.</p>
                </div>
            </div>
            <div className="px-6 py-4 border-t bg-muted/30 space-y-4">
                <div className="flex items-start gap-3">
                    <Checkbox 
                        id="policy-check" 
                        checked={policyAccepted} 
                        onCheckedChange={(val) => setPolicyAccepted(!!val)} 
                        className="mt-1"
                    />
                    <Label htmlFor="policy-check" className="text-sm font-medium leading-snug cursor-pointer text-foreground">
                        I have read and agree to the Device Check Policy & Account Limits
                    </Label>
                </div>
                <Button 
                    onClick={() => setIsPolicyModalOpen(false)} 
                    className="w-full btn-primary text-white h-12 font-bold shadow-lg" 
                    disabled={!policyAccepted}
                >
                    OK / Proceed
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className={cn("sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden transition-all duration-300", showOtherPayments && "lg:max-w-[950px]")}>
            <DialogHeader className="px-5 py-2.5 border-b bg-card">
                <DialogTitle className='flex items-center gap-3 text-base sm:text-lg pr-12 text-foreground uppercase tracking-tight font-black'>
                    {timeLeft > 0 && (!selectedMethod || selectedMethod.type === 'crypto') && <span className="text-xs sm:text-sm font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md px-2 py-0.5">{formatTime(timeLeft)}</span>}
                    <span>Make Unlock Payment</span>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">Pay unlock fees for this device. Send the exact amount.</DialogDescription>
                 {submission && <div className="text-xs bg-muted p-2 rounded-md text-muted-foreground mt-1"><p><strong>Model:</strong> {submission.model} | <strong>IMEI/Serial:</strong> {submission.imei}</p></div>}
            </DialogHeader>
             <ScrollArea className="flex-1 px-5">
                <div className={cn("grid grid-cols-1 gap-4 pt-1 pb-10", showOtherPayments && "lg:grid-cols-2 lg:gap-8")}>
                    <div className="space-y-3 animate-fade-in">
                        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 py-1.5 mt-2">
                            <AlertDescription className="text-[11px] text-center text-blue-800 dark:text-blue-300">
                                For other payment options, contact the <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-600">admin</a>.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div><p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Service Cost</p><p className="text-lg font-bold text-foreground">${submission?.icloudStatus === 'lost' ? lostPrice.toFixed(2) : price.toFixed(2)}</p></div>
                                <div><p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Your Balance</p><p className="text-lg font-bold text-green-600">-${currentBalance.toFixed(2)}</p></div>
                            </div>
                            <div className="text-center bg-muted/30 py-2 rounded-xl border border-dashed border-border">
                                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Amount to Pay</p>
                                <p className="text-3xl font-black text-foreground">${amountToPay.toFixed(2)}</p>
                            </div>
                        </div>

                        {amountToPay > 0 && (
                            <>
                                {(!selectedMethod || selectedMethod.type === 'crypto') ? (
                                    <div className="space-y-4">
                                        <div className="px-4 py-3 border border-border rounded-2xl bg-card shadow-sm space-y-2">
                                            <div className="flex items-center gap-3">
                                                {usdtImage && <Image src={usdtImage.imageUrl} alt="USDT" width={32} height={32} className="rounded-full" />}
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{(selectedMethod && selectedMethod.type === 'crypto') ? selectedMethod.name : 'USDT (BEP20 Network) - Recommended'}</p>
                                                    <p className="text-[10px] text-muted-foreground">{(selectedMethod && selectedMethod.type === 'crypto') ? 'Send exact amount below.' : 'Low fees on Binance Smart Chain.'}</p>
                                                </div>
                                            </div>
                                            <div className="font-mono bg-muted p-3 rounded-xl break-all text-xs flex items-center justify-between border border-border text-foreground shadow-inner">
                                                <span className="font-medium">{(selectedMethod && selectedMethod.type === 'crypto') ? selectedMethod.address : usdtAddress}</span>
                                                <CopyToClipboard text={(selectedMethod && selectedMethod.type === 'crypto') ? selectedMethod.address : usdtAddress}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-black/5 dark:hover:bg-white/5">
                                                        <Copy className="w-4 h-4 text-muted-foreground"/>
                                                    </Button>
                                                </CopyToClipboard>
                                            </div>
                                        </div>

                                        <Button 
                                            variant="outline" 
                                            className="w-full h-10 text-foreground bg-muted/50 hover:bg-muted flex items-center justify-center gap-2 border border-border rounded-xl transition-all font-semibold shadow-none"
                                            onClick={() => setShowOtherPayments(!showOtherPayments)}
                                        >
                                            <span className="text-sm">Show Other Payment Methods</span>
                                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 text-muted-foreground", showOtherPayments && "rotate-180")} />
                                        </Button>

                                        {showOtherPayments && (
                                            <div className="lg:hidden mt-1 animate-fade-in">
                                                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Other Options</h4>
                                                <div className="max-h-[300px] overflow-y-auto pr-2 pb-60 scrollbar-thin">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {additionalMethods.map(method => {
                                                            const isCrypto = method.type === 'crypto';
                                                            const isManual = method.type === 'manual';
                                                            const isAmountLow = isManual && amountToPay < 200;
                                                            return (
                                                                <button 
                                                                    key={method.id}
                                                                    disabled={isAmountLow}
                                                                    onClick={() => { setSelectedMethod(method); }}
                                                                    className={cn(
                                                                        "flex items-center gap-3 p-4 rounded-xl border transition-all text-left relative",
                                                                        isAmountLow ? "bg-muted/50 border-border opacity-60 cursor-not-allowed" : "bg-card border-border hover:border-primary hover:bg-primary/5 group"
                                                                    )}
                                                                >
                                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-muted-foreground overflow-hidden">
                                                                        {method.icon ? <Image src={method.icon.imageUrl} alt={method.name} width={40} height={40} /> : method.name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={cn("font-bold text-sm text-foreground", !isAmountLow && "group-hover:text-primary")}>{method.name}</span>
                                                                        {isAmountLow && <span className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Min: $200</span>}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                                                    {selectedMethod.name.charAt(0)}
                                                </div>
                                                <h3 className="font-bold text-sm">{selectedMethod.name} Request</h3>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)} className="h-7 text-[10px] uppercase font-bold text-muted-foreground">Change Method</Button>
                                        </div>

                                        {selectedMethod.type === 'crypto' ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Address:</Label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 font-mono text-xs bg-background p-3 rounded-xl border break-all shadow-inner">
                                                            {selectedMethod.address}
                                                        </div>
                                                        <CopyToClipboard text={selectedMethod.address}>
                                                            <Button variant="outline" size="icon" className="h-10 w-10">
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        </CopyToClipboard>
                                                    </div>
                                                </div>
                                                <Button onClick={handlePaid} className="w-full btn-primary text-white font-bold h-12 rounded-2xl" disabled={isSubmittingOrder}>
                                                    {isSubmittingOrder ? <Loader className="animate-spin h-5 w-5" /> : 'I Paid'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
                                                    <Label htmlFor="manual-email" className="text-sm font-bold">Confirm Your Contact Email</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            id="manual-email" 
                                                            type="email" 
                                                            placeholder="your@email.com" 
                                                            value={nonCryptoEmail} 
                                                            onChange={(e) => setNonCryptoEmail(e.target.value)}
                                                            className="pl-10 h-11 rounded-xl bg-background border-border"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 rounded-2xl">
                                                    <p className="text-[10px] text-yellow-800 dark:text-yellow-300 leading-relaxed italic">
                                                        "Minimum amount for these payment methods is $200. Support will provide payment details via email/notifications after submission."
                                                    </p>
                                                </div>

                                                <Button 
                                                    onClick={handleNonCryptoProceed}
                                                    disabled={isSubmittingOrder}
                                                    className="w-full h-12 btn-primary text-white font-black rounded-2xl shadow-lg transition-all active:scale-95"
                                                >
                                                    {isSubmittingOrder ? <Loader className="animate-spin" /> : 'Proceed with Deposit Request'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {(!selectedMethod || selectedMethod.type === 'crypto') && (
                                    <div className="space-y-3 pt-2">
                                        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 py-2 rounded-xl">
                                            <AlertDescription className="text-[10px] text-center text-yellow-800 dark:text-yellow-300 font-medium">
                                                Payments made within the timer will be automatically applied.
                                            </AlertDescription>
                                        </Alert>
                                        
                                        <div className="px-5 py-3 bg-red-50 dark:bg-red-950/20 border border-red-100 rounded-2xl">
                                           <p className="text-[10px] text-red-700 dark:text-red-300 leading-tight text-center font-bold">
                                             ⚠️ Clicking “I Paid” button without making payment or without prior communication with support account may be restricted and certain features will be limited.
                                           </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {amountToPay <= 0 && <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300 rounded-2xl animate-fade-in"><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500"/><p className="font-bold text-base">Your balance covers the full amount!</p><p className="text-xs opacity-80">Click "Confirm" to use your balance for this unlock.</p></div>}
                    </div>

                    {showOtherPayments && (!selectedMethod || selectedMethod.type === 'crypto') && (
                        <div className="hidden lg:flex flex-col space-y-3 animate-fade-in border-l border-border pl-8">
                            <h4 className="font-black text-xs text-muted-foreground uppercase tracking-widest mb-2">Other Payment Methods</h4>
                            <ScrollArea className="h-[420px] pr-4">
                                <div className="space-y-2 pb-60">
                                    {additionalMethods.map(method => {
                                        const isManual = method.type === 'manual';
                                        const isAmountLow = isManual && amountToPay < 200;
                                        return (
                                            <button 
                                                key={method.id}
                                                disabled={isAmountLow}
                                                onClick={() => { setSelectedMethod(method); }}
                                                className={cn(
                                                    "flex items-center gap-3 p-4 w-full rounded-xl border transition-all text-left relative",
                                                    isAmountLow ? "bg-muted/50 border-border opacity-50 cursor-not-allowed" : "bg-card border-border hover:border-primary hover:bg-primary/5 group"
                                                )}
                                            >
                                                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-muted-foreground overflow-hidden">
                                                    {method.icon ? <Image src={method.icon.imageUrl} alt={method.name} width={40} height={40} /> : method.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className={cn("font-bold text-sm text-foreground", !isAmountLow && "group-hover:text-primary")}>{method.name}</span>
                                                    {isAmountLow && <span className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Minimum amount for these payment methods is $200</span>}
                                                </div>
                                                {!isAmountLow && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {(!selectedMethod || selectedMethod.type === 'crypto') && (
                <DialogFooter className="p-3 border-t border-border flex flex-row gap-3 mt-auto bg-card">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl text-sm font-bold shadow-sm" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                    <Button onClick={handlePaid} className="btn-primary text-white dark:text-white flex-1 h-11 rounded-xl text-sm font-bold shadow-md" disabled={isSubmittingOrder}>
                        {isSubmittingOrder ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Processing...</> : (amountToPay > 0 ? 'I Paid' : 'Confirm')}
                    </Button>
                </DialogFooter>
            )}
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
                    <p className="text-xs text-muted-foreground animate-pulse mt-4">Redirecting to your account dashboard...</p>
                </div>
                <Button onClick={() => router.push('/my-account')} className="w-full btn-primary text-white h-12 rounded-xl font-bold shadow-lg">Go to Account</Button>
            </div>
        </DialogContent>
      </Dialog>

      {isLoading && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"><div className="spinner w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div><p className="font-semibold text-foreground">{loadingMessage}</p></div>}
    </div>
  );
}

export default function ClientPortalPage() {
    return (<Suspense fallback={<div>Loading...</div>}><DeviceCheckContent /></Suspense>)
}