'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Plus, ArrowLeft, RefreshCw, Loader, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProcessingOrder {
  id: string;
  orderId?: string;
  imei: string;
  category: string;
  model: string;
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

const MODELS = {
  iPhone: [
    'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max', 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
    'iPhone SE (2020)', 'iPhone SE (2022)', 'iPhone 12 Mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 
    'iPhone 13 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus',
    'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16e', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 17', 
    'iPhone 17 Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'
  ],
  iPad: [
    'iPad 5th Gen (2017)', 'iPad 6th Gen (2018)', 'iPad 7th Gen (2019)', 'iPad 8th Gen (2020)', 'iPad 9th Gen (2021)', 
    'iPad 10th Gen (2022)', 'iPad 11th Gen (2025)', 'iPad Air 3rd Gen (2019)', 'iPad Air 4th Gen (2020)', 
    'iPad Air 5th Gen (2022)', 'iPad Air 6th Gen 11" (M2)', 'iPad Air 6th Gen 13" (M2)', 'iPad Air 7th Gen 11" (M3)', 
    'iPad Air 7th Gen 13" (M3)', 'iPad Pro 10.5" (2017)', 'iPad Pro 12.9" 2nd Gen (2017)', 'iPad Pro 11" 1st Gen (2018)', 
    'iPad Pro 12.9" 3rd Gen (2018)', 'iPad Pro 11" 2nd Gen (2020)', 'iPad Pro 12.9" 4th Gen (2020)', 
    'iPad Pro 11" 3rd Gen (M1, 2021)', 'iPad Pro 12.9" 5th Gen (M1, 2021)', 'iPad Pro 11" 4th Gen (M2, 2022)', 
    'iPad Pro 12.9" 6th Gen (M2, 2022)', 'iPad Pro 11" (M4, 2024)', 'iPad Pro 13" (M4, 2024)', 'iPad Pro 11" (M5, 2025)', 
    'iPad Pro 13" (M5, 2025)', 'iPad Mini 5th Gen (2019)', 'iPad Mini 6th Gen (2021)', 'iPad Mini 7th Gen (A17 Pro, 2024)'
  ],
  'Apple Watch': [
    'Apple Watch Series 2', 'Apple Watch Series 3', 'Apple Watch Series 4', 'Apple Watch Series 5', 
    'Apple Watch Series 6', 'Apple Watch Series 7 (2021)', 'Apple Watch Series 8 (2022)', 'Apple Watch Series 9 (2023)', 
    'Apple Watch Series 10 (2024)', 'Apple Watch Series 11 (2025)', 'Apple Watch SE 1st Gen (2020)', 
    'Apple Watch SE 2nd Gen (2022)', 'Apple Watch SE 3rd Gen (2025)', 'Apple Watch Ultra 1 (2022)', 
    'Apple Watch Ultra 2 (2023)', 'Apple Watch Ultra 3 (2025)'
  ],
  MacBook: [
    'MacBook 2016', 'MacBook 2017', 'MacBook Air 2017', 'MacBook Air 2018', 'MacBook Air 2019', 'MacBook Air (Intel) 2020', 
    'MacBook Air M1 2020', 'MacBook Air M2 13" 2022', 'MacBook Air M2 15" 2023', 'MacBook Air M3 13" 2024', 
    'MacBook Air M3 15" 2024', 'MacBook Air M4 13" 2025', 'MacBook Air M4 15" 2025', 'MacBook Pro 13" 2016', 
    'MacBook Pro 15" 2016', 'MacBook Pro 13" 2017', 'MacBook Pro 15" 2017', 'MacBook Pro 13" 2018', 
    'MacBook Pro 15" 2018', 'MacBook Pro 13" 2019', 'MacBook Pro 15" 2019', 'MacBook Pro 16" (Intel) 2019', 
    'MacBook Pro 13" (Intel) 2020', 'MacBook Pro M1 13" 2020', 'MacBook Pro M1 Pro/Max 14" 2021', 
    'MacBook Pro M1 Pro/Max 16" 2021', 'MacBook Pro M2 13" 2022', 'MacBook Pro M2 Pro/Max 14" 2023', 
    'MacBook Pro M2 Pro/Max 16" 2023', 'MacBook Pro M3 14" 2023', 'MacBook Pro M3 Pro/Max 14" 2023', 
    'MacBook Pro M3 Pro/Max 16" 2023', 'MacBook Pro M4 14" 2024', 'MacBook Pro M4 Pro/Max 14" 2024', 
    'MacBook Pro M4 Pro/Max 16" 2024', 'MacBook Pro M5 14" 2025'
  ],
};

const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ORD-${rand}`;
};

const APPLE_SERIAL_PREFIXES = ['C02', 'C17', 'FVF', 'F2L', 'FH7', 'G99', 'DMP'];
const IMEI_PREFIXES = ['35', '356', '357', '358'];

const generateAppleIMEI = () => {
  const prefix = IMEI_PREFIXES[Math.floor(Math.random() * IMEI_PREFIXES.length)];
  const remainingLen = 15 - prefix.length;
  const suffix = Array.from({ length: remainingLen }, () => Math.floor(Math.random() * 10)).join('');
  return prefix + suffix;
};

const generateAppleSerial = () => {
  const prefix = APPLE_SERIAL_PREFIXES[Math.floor(Math.random() * APPLE_SERIAL_PREFIXES.length)];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; // No I, O
  const remainingLen = 12 - prefix.length;
  const suffix = Array.from({ length: remainingLen }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return prefix + suffix;
};

export default function LiveProcessingPage() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isIMEIHidden, setIsIMEIIMEIHidden] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Form states for manual addition
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualImei, setManualImei] = useState('');
  const [manualCategory, setManualCategory] = useState('iPhone');
  const [manualModel, setManualModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: orders, loading: ordersLoading } = useCollection<ProcessingOrder>('processing_orders', {
    constraints: [orderBy('createdAt', 'desc'), limit(100)]
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) router.push('/');
  }, [user, userLoading, isAdmin, router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Data maintenance: Assign Order IDs to existing entries that have "N/A" (empty field)
  useEffect(() => {
    if (orders && orders.length > 0 && isAdmin) {
      const repairMissingIds = async () => {
        for (const order of orders) {
          if (!order.orderId) {
            try {
              await updateDoc(doc(firestore, 'processing_orders', order.id), {
                orderId: generateOrderId()
              });
            } catch (err) {
              console.error("Failed to repair missing ID for order:", order.id);
            }
          }
        }
      };
      repairMissingIds();
    }
  }, [orders, isAdmin, firestore]);

  const pickCategory = () => {
    const rand = Math.random();
    if (rand < 0.5) return 'iPhone'; // 50% iPhone
    if (rand < 0.75) return 'MacBook'; // 25% MacBook
    if (rand < 0.9) return 'iPad'; // 15% iPad
    return 'Apple Watch'; // 10% Watch
  };

  const generateIdentifier = (category: string) => {
    if (category === 'MacBook' || category === 'Apple Watch') {
      return generateAppleSerial();
    }

    if (category === 'iPhone') {
      // 80% IMEI, 20% Serial
      return Math.random() < 0.8 ? generateAppleIMEI() : generateAppleSerial();
    }

    if (category === 'iPad') {
      // 70% Serial (covering Wi-Fi models and some cellular), 30% IMEI
      return Math.random() < 0.7 ? generateAppleSerial() : generateAppleIMEI();
    }

    return generateAppleSerial();
  };

  const handleGenerateSingleOrder = async () => {
    setIsSubmitting(true);
    try {
      const category = pickCategory();
      const modelList = MODELS[category as keyof typeof MODELS];
      const model = modelList[Math.floor(Math.random() * modelList.length)];
      const imei = generateIdentifier(category);
      const orderId = generateOrderId();

      await addDoc(collection(firestore, 'processing_orders'), {
        orderId,
        imei,
        category,
        model,
        createdAt: serverTimestamp()
      });
      toast({ title: "Order Generated", description: `Added a new ${model} to processing stream.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate order.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = (createdAt: any) => {
    if (!createdAt) return { progress: 0, status: 'Pending' };
    
    const start = createdAt.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime();
    const elapsed = currentTime - start;
    const oneHour = 3600000;
    const sixHours = 21600000;
    const thirtyMins = 1800000;

    if (elapsed < oneHour) {
      return { progress: 0, status: 'Pending' };
    }

    const processingElapsed = elapsed - oneHour;
    const totalProcessingTarget = sixHours + thirtyMins;

    if (processingElapsed >= totalProcessingTarget) {
      return { progress: 100, status: 'FMI OFF Success' };
    }

    // Processing Phase (0-90% over 6 hours)
    if (processingElapsed < sixHours) {
      const p = (processingElapsed / sixHours) * 90;
      return { progress: Math.floor(p), status: 'Processing' };
    }

    // Near Completion Phase (90-100% over 30 mins)
    const finalElapsed = processingElapsed - sixHours;
    const p = 90 + (finalElapsed / thirtyMins) * 10;
    return { progress: Math.floor(p), status: 'Processing' };
  };

  const formatIMEI = (val: string) => {
    if (!isIMEIHidden) return val;
    if (val.length < 8) return val;
    const maskLen = 5;
    const startLen = Math.floor((val.length - maskLen) / 2);
    const endPos = startLen + maskLen;
    return val.substring(0, startLen) + '*****' + val.substring(endPos);
  };

  const handleAddManual = async () => {
    if (!manualImei || !manualModel) return toast({ title: "Missing Fields" });
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'processing_orders'), {
        orderId: manualOrderId.trim() || generateOrderId(),
        imei: manualImei.trim(),
        category: manualCategory,
        model: manualModel,
        createdAt: serverTimestamp()
      });
      toast({ title: "Order Added Successfully" });
      setIsAddModalOpen(false);
      setManualOrderId('');
      setManualImei('');
      setManualModel('');
    } catch (e) {
      toast({ title: "Error", description: "Failed to add order.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || !user || !isAdmin) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-background text-foreground min-h-screen pb-12 transition-colors duration-300">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin Panel</Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isIMEIHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsIMEIIMEIHidden(!isIMEIHidden)}>
                    {isIMEIHidden ? "Show Identifiers" : "Hide Identifiers"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { 
                    setIsAddModalOpen(true);
                    setManualCategory('iPhone');
                    setManualModel(MODELS['iPhone'][0]);
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Manual Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateSingleOrder} disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Generate Realistic Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <MonitorPlay className="h-8 w-8 text-primary" />
              Live Processing Orders
            </h1>
            <p className="text-muted-foreground text-sm">Monitor ongoing iCloud Unlock registrations and recently completed FMI OFF processing activity.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE SERVER CONNECTED
          </div>
        </div>

        <Card className="border-border shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="p-20 text-center text-muted-foreground">
                <Loader className="animate-spin h-8 w-8 mx-auto mb-4" />
                Initializing live stream...
              </div>
            ) : orders && orders.length > 0 ? (
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="bg-muted/80 backdrop-blur-md sticky top-0 z-10">
                    <TableRow className="border-border">
                      <TableHead className="text-foreground font-bold bg-muted/80">Order ID</TableHead>
                      <TableHead className="text-foreground font-bold bg-muted/80">Submission Time</TableHead>
                      <TableHead className="text-foreground font-bold bg-muted/80">IMEI / Serial</TableHead>
                      <TableHead className="text-foreground font-bold bg-muted/80">Device Info</TableHead>
                      <TableHead className="text-foreground font-bold bg-muted/80">Status</TableHead>
                      <TableHead className="text-foreground font-bold w-[250px] bg-muted/80">Processing Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => {
                      const { progress, status } = calculateProgress(order.createdAt);
                      return (
                        <TableRow key={order.id} className="border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-blue-600">
                            {order.orderId || 'Assigning...'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-medium">
                            {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'HH:mm (MMM dd)') : 'Just now'}
                          </TableCell>
                          <TableCell>
                            <code className="text-[11px] bg-muted/50 px-2 py-1 rounded font-mono font-bold text-foreground">
                              {formatIMEI(order.imei)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{order.model}</span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{order.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status === 'FMI OFF Success' ? 'secondary' : status === 'Pending' ? 'outline' : 'default'} className={cn("text-[9px] uppercase font-black tracking-tight", status === 'Processing' && "animate-pulse")}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className={cn(status === 'FMI OFF Success' ? "text-green-600" : "text-primary")}>{progress}%</span>
                                <span className="text-muted-foreground">{progress === 100 ? 'Verified' : 'Active'}</span>
                              </div>
                              <Progress 
                                value={progress} 
                                className={cn(
                                  "h-1.5",
                                  status === 'FMI OFF Success' ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"
                                )} 
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="p-20 text-center text-muted-foreground border-t border-border">
                <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="font-medium">No processing data found. Use the menu above to generate orders.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Manual Processing Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-order-id">Order ID (Optional)</Label>
              <Input id="manual-order-id" value={manualOrderId} onChange={(e) => setManualOrderId(e.target.value)} placeholder="ORD-XXXXX" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-imei">IMEI or Serial Number</Label>
              <Input id="manual-imei" value={manualImei} onChange={(e) => setManualImei(e.target.value)} placeholder="35xxxxxxxxxxxxx or Serial" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-category">Device Category</Label>
              <Select value={manualCategory} onValueChange={(val) => { 
                setManualCategory(val); 
                setManualModel(MODELS[val as keyof typeof MODELS][0]); 
              }}>
                <SelectTrigger id="manual-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(MODELS).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-model">Model</Label>
              <Select value={manualModel} onValueChange={setManualModel}>
                <SelectTrigger id="manual-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS[manualCategory as keyof typeof MODELS].map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddManual} disabled={isSubmitting} className="btn-primary text-white">
              {isSubmitting ? <Loader className="animate-spin h-4 w-4" /> : "Start Processing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
