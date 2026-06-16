
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  imei: string;
  category: string;
  model: string;
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

const MODELS = {
  iPhone: ['iPhone 11', 'iPhone 11 Pro Max', 'iPhone 12', 'iPhone 12 Pro Max', 'iPhone 13', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Pro Max', 'iPhone 16 Pro Max'],
  MacBook: ['MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Pro 13-inch', 'MacBook Pro 14-inch', 'MacBook Pro 16-inch'],
  iPad: ['iPad 9th Generation', 'iPad 10th Generation', 'iPad Air 4', 'iPad Air 5', 'iPad Pro 11-inch', 'iPad Pro 12.9-inch'],
  'Apple Watch': ['Apple Watch Series 6', 'Apple Watch Series 7', 'Apple Watch Series 8', 'Apple Watch Series 9', 'Apple Watch Ultra'],
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
  const [manualImei, setManualImei] = useState('');
  const [manualCategory, setManualCategory] = useState('iPhone');
  const [manualModel, setManualModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: orders, loading: ordersLoading } = useCollection<ProcessingOrder>('processing_orders', {
    constraints: [orderBy('createdAt', 'desc'), limit(50)]
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) router.push('/');
  }, [user, userLoading, isAdmin, router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Auto-generation logic
  useEffect(() => {
    if (!ordersLoading && orders && orders.length === 0 && isAdmin) {
      generateInitialBatch();
    }
  }, [orders, ordersLoading, isAdmin]);

  const generateInitialBatch = async () => {
    const batchSize = Math.floor(Math.random() * 8) + 4; // 4-12 orders
    const now = new Date();
    
    for (let i = 0; i < batchSize; i++) {
      const hourOffset = Math.floor(Math.random() * 24);
      const minOffset = Math.floor(Math.random() * 60);
      const createdAt = new Date(now.getTime() - (hourOffset * 3600000 + minOffset * 60000));
      
      const category = pickCategory();
      const modelList = MODELS[category as keyof typeof MODELS];
      const model = modelList[Math.floor(Math.random() * modelList.length)];
      const imei = generateIMEI();

      await addDoc(collection(firestore, 'processing_orders'), {
        imei,
        category,
        model,
        createdAt: Timestamp.fromDate(createdAt)
      });
    }
  };

  const pickCategory = () => {
    const rand = Math.random();
    if (rand < 0.5) return 'iPhone';
    if (rand < 0.75) return 'MacBook';
    if (rand < 0.9) return 'iPad';
    return 'Apple Watch';
  };

  const generateIMEI = () => {
    const isSerial = Math.random() > 0.5;
    if (isSerial) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const len = Math.floor(Math.random() * 3) + 9; // 9-11 chars
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } else {
      return '35' + Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
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
    if (val.length < 7) return val;
    const start = Math.floor((val.length - 5) / 2);
    return val.substring(0, start) + '*****' + val.substring(start + 5);
  };

  const handleAddManual = async () => {
    if (!manualImei || !manualModel) return toast({ title: "Missing Fields" });
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'processing_orders'), {
        imei: manualImei.trim(),
        category: manualCategory,
        model: manualModel,
        createdAt: serverTimestamp()
      });
      toast({ title: "Order Added Successfully" });
      setIsAddModalOpen(false);
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
                  <DropdownMenuItem onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Manual Order
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
            <p className="text-muted-foreground text-sm">Monitor ongoing registrations and recently completed FMI OFF processing activity.</p>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border">
                      <TableHead className="text-foreground font-bold">Submission Time</TableHead>
                      <TableHead className="text-foreground font-bold">IMEI / Serial</TableHead>
                      <TableHead className="text-foreground font-bold">Device Info</TableHead>
                      <TableHead className="text-foreground font-bold">Status</TableHead>
                      <TableHead className="text-foreground font-bold w-[250px]">Processing Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => {
                      const { progress, status } = calculateProgress(order.createdAt);
                      return (
                        <TableRow key={order.id} className="border-border hover:bg-muted/20 transition-colors">
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
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground border-t border-border">
                <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="font-medium">No processing data found. Simulation initializing...</p>
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
              <Label htmlFor="manual-imei">IMEI or Serial Number</Label>
              <Input id="manual-imei" value={manualImei} onChange={(e) => setManualImei(e.target.value)} placeholder="35xxxxxxxxxxxxx" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-category">Device Category</Label>
              <Select value={manualCategory} onValueChange={(val) => { setManualCategory(val); setManualModel(MODELS[val as keyof typeof MODELS][0]); }}>
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
