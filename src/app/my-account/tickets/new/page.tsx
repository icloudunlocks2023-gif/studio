'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader, MessageSquare, Send, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { LoginButton } from '@/components/login-button';

const CATEGORIES = ["Withdrawal Request", "Refund Request", "Order Issue", "Activation Delay", "Payment Inquiry", "Other"];

export default function NewTicketPage() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [category, setCategory] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('none');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderConstraints = useMemo(() => {
    if (!user) return [where('userId', '==', 'none')];
    return [where('userId', '==', user.uid)];
  }, [user]);

  const { data: orders, loading: ordersLoading } = useCollection<any>('orders', { constraints: orderConstraints });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!category || !subject.trim() || !message.trim()) {
      return toast({ title: "Missing Fields", variant: "destructive" });
    }

    setIsSubmitting(true);

    const ticketData = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'Client',
      category,
      orderId: orderId === 'none' ? null : orderId,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open' as const,
      replies: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDoc(collection(firestore, 'tickets'), ticketData)
      .then(() => {
        const tgMessage = `🎫 <b>New Support Ticket!</b>\n\n<b>User:</b> ${user.email}\n<b>Category:</b> ${category}\n<b>Subject:</b> ${subject.trim()}`;
        
        fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: tgMessage }),
        }).catch(err => console.error("Telegram notification failed:", err));

        toast({ title: "Ticket Submitted Successfully" });
        router.push('/my-account');
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'tickets',
          operation: 'create',
          requestResourceData: ticketData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  if (userLoading) return <div className="flex justify-center items-center h-screen bg-background text-foreground">Loading...</div>;

  return (
    <div className="bg-background text-foreground min-h-screen pb-12 transition-colors duration-300">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">My Account</Link>
              {isAdmin && <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Admin</Link>}
              {user && <NotificationDropdown />}
              <ThemeToggle />
              <LoginButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/my-account">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-3xl font-bold">New Support Ticket</h1>
        </div>

        <Card className="border-border shadow-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
                <MessageSquare className="text-primary h-5 w-5" /> 
                How can we assist you today?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="category">Inquiry Category</Label>
                    <Select onValueChange={setCategory} value={category}>
                        <SelectTrigger id="category" className="bg-muted/20">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="order">Related Order (Optional)</Label>
                    <Select onValueChange={setOrderId} value={orderId}>
                        <SelectTrigger id="order" className="bg-muted/20">
                            <SelectValue placeholder="Select an order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Not related to a specific order</SelectItem>
                            {!ordersLoading && orders?.map(order => (
                                <SelectItem key={order.id} value={order.orderId}>
                                    {order.orderId} - {order.model}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                    id="subject" 
                    placeholder="Briefly summarize your issue..." 
                    className="bg-muted/20 focus:bg-card transition-all"
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="message">Message Details</Label>
                <Textarea 
                    id="message" 
                    placeholder="Provide as much detail as possible so our technicians can assist you quickly..." 
                    className="min-h-[180px] bg-muted/20 focus:bg-card transition-all resize-none" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    required 
                />
              </div>
              
              <Button type="submit" className="w-full btn-primary text-white h-12 font-bold text-lg shadow-xl" disabled={isSubmitting}>
                {isSubmitting ? (
                    <><Loader className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                ) : (
                    <><Send className="mr-2 h-5 w-5" /> Submit Support Ticket</>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t p-4">
            <div className="flex items-center gap-2 justify-center w-full text-muted-foreground text-xs">
                <ShieldQuestion className="h-3 w-3" />
                <span>Our technician typically responds within 1-24 hours depending on queue volume.</span>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
