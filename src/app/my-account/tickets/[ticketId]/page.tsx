'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader, MessageSquare, User, ShieldCheck, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { LoginButton } from '@/components/login-button';

interface Reply {
  message: string;
  sender: 'client' | 'admin';
  createdAt: any;
}

interface SupportTicket {
  id: string;
  userId: string;
  category: string;
  orderId: string | null;
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  replies: Reply[];
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ticket, loading: ticketLoading } = useDoc<SupportTicket>('tickets', ticketId as string);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.replies]);

  const handleSendReply = () => {
    if (!user || !ticket || !replyMessage.trim()) return;

    setIsSubmitting(true);
    const ticketRef = doc(firestore, 'tickets', ticket.id);
    const newReply = {
      message: replyMessage.trim(),
      sender: 'client' as const,
      createdAt: new Date().toISOString(),
    };

    updateDoc(ticketRef, {
      replies: arrayUnion(newReply),
      status: 'open',
      updatedAt: serverTimestamp()
    })
      .then(() => {
        setReplyMessage('');
        toast({ title: "Reply Sent", description: "Added to ticket." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ticketRef.path,
          operation: 'update',
          requestResourceData: { replies: '...', status: 'open' },
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'secondary';
      case 'closed': return 'destructive';
      case 'replied': return 'default';
      default: return 'outline';
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  if (userLoading || ticketLoading) return <div className="flex justify-center items-center h-screen bg-background">Loading...</div>;
  if (!ticket) return <div className="p-8 text-center bg-background text-foreground">Not found.</div>;

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

      <main className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <Link href="/my-account">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                <Badge variant={getStatusVariant(ticket.status)} className="uppercase font-bold text-[10px]">
                    {ticket.status.replace('_', ' ')}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
                Category: <span className="font-semibold text-foreground">{ticket.category}</span> 
                {ticket.orderId && <> | Related Order: <span className="font-mono text-primary">{ticket.orderId}</span></>}
            </p>
          </div>
        </div>

        <Card className="flex flex-col h-[70vh] border border-border shadow-xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-sm flex items-center gap-2 font-bold uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="h-4 w-4 text-primary" />
                Communication History
            </CardTitle>
          </CardHeader>
          
          <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-muted/10">
            {/* Initial Client Message - Align Right */}
            <div className="flex gap-3 max-w-[90%] ml-auto flex-row-reverse animate-fade-in">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1 text-right">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-black text-primary mb-1 uppercase tracking-tighter">Initial Inquiry</p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                </div>
                <p className="text-[10px] text-muted-foreground px-2">
                    {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'PPp') : 'Just now'}
                </p>
              </div>
            </div>

            {/* Replies */}
            {ticket.replies.map((reply, index) => (
              <div 
                key={index} 
                className={cn(
                    "flex gap-3 max-w-[90%] animate-fade-in", 
                    reply.sender === 'admin' ? "" : "ml-auto flex-row-reverse"
                )}
              >
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm", 
                    reply.sender === 'admin' ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-primary/10 text-primary"
                )}>
                  {reply.sender === 'admin' ? (<ShieldCheck className="h-4 w-4" />) : (<User className="h-4 w-4" />)}
                </div>
                <div className={cn("space-y-1", reply.sender === 'admin' ? "" : "text-right")}>
                  <div className={cn(
                    "rounded-2xl p-4 shadow-md text-sm whitespace-pre-wrap leading-relaxed", 
                    reply.sender === 'admin' 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "bg-card border border-border"
                  )}>
                    {reply.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-2">
                    {reply.sender === 'admin' ? 'Support Team' : 'You'} • {format(new Date(reply.createdAt), 'PPp')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          
          <CardFooter className="border-t p-4 bg-card">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Textarea 
                placeholder="Type your follow-up message..." 
                className="min-h-[80px] flex-1 resize-none bg-muted/20 focus:bg-card transition-colors" 
                value={replyMessage} 
                onChange={(e) => setReplyMessage(e.target.value)} 
                disabled={ticket.status === 'closed' || ticket.status === 'resolved'} 
              />
              <Button 
                onClick={handleSendReply} 
                className="btn-primary text-white h-auto py-4 sm:py-0 px-8 shadow-lg" 
                disabled={isSubmitting || !replyMessage.trim() || ticket.status === 'closed' || ticket.status === 'resolved'}
              >
                {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {(ticket.status === 'closed' || ticket.status === 'resolved') && (
            <div className="mt-8 p-4 bg-muted/30 border border-dashed border-border rounded-xl text-center">
                <p className="text-sm text-muted-foreground italic">
                    This ticket is marked as <span className="font-bold text-foreground">{ticket.status}</span> and is no longer active. If you need further assistance, please open a new ticket.
                </p>
            </div>
        )}
      </main>
    </div>
  );
}
