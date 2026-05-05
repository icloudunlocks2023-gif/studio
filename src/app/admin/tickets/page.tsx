'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Clock, Filter, Search, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { where } from 'firebase/firestore';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string | null;
  category: string;
  subject: string;
  status: 'open' | 'in_review' | 'replied' | 'resolved' | 'closed';
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function AdminTicketsPage() {
  const { data: user, loading: userLoading } = useUser();
  const router = useRouter();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const ticketConstraints = useMemo(() => {
    if (userLoading || !user) return [where('userId', '==', 'none')];
    if (isAdmin) return [];
    return [where('userId', '==', user.uid)];
  }, [isAdmin, user, userLoading]);

  const { data: tickets, loading: ticketsLoading } = useCollection<SupportTicket>('tickets', { constraints: ticketConstraints });

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) {
      router.push('/');
    }
  }, [user, userLoading, isAdmin, router]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_review': return 'outline';
      case 'replied': return 'secondary';
      case 'resolved': return 'secondary';
      case 'closed': return 'destructive';
      default: return 'outline';
    }
  };

  if (userLoading || !user || !isAdmin) {
    return <div className="flex justify-center items-center h-screen bg-background text-foreground">Loading...</div>;
  }

  const sortedTickets = tickets?.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="bg-background text-foreground min-h-screen pb-12 transition-colors duration-300">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin Dashboard</Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Support Ticket Management</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border">
            <Clock className="h-4 w-4" />
            Last Sync: {format(new Date(), 'pp')}
          </div>
        </div>

        <Card className="border-border shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    All Tickets ({tickets?.length || 0})
                </CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search tickets..." className="pl-9 bg-background h-9" />
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground h-9">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ticketsLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" />
                Loading tickets...
              </div>
            ) : sortedTickets && sortedTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow className="border-border">
                        <TableHead className="text-foreground">Submitted</TableHead>
                        <TableHead className="text-foreground">Ticket ID</TableHead>
                        <TableHead className="text-foreground">Client</TableHead>
                        <TableHead className="text-foreground">Related Order</TableHead>
                        <TableHead className="text-foreground">Category</TableHead>
                        <TableHead className="text-foreground">Subject</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {sortedTickets.map(ticket => (
                        <TableRow key={ticket.id} className={cn("border-border hover:bg-muted/30 transition-colors", ticket.status === 'open' ? 'bg-primary/5' : '')}>
                        <TableCell className="text-xs text-muted-foreground">
                            {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'MMM dd, p') : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] uppercase font-bold text-primary">
                            {ticket.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground">{ticket.userName}</span>
                                <span className="text-[10px] text-muted-foreground">{ticket.userEmail}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {ticket.orderId ? (
                                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                                    {ticket.orderId}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground/30 text-xs">-</span>
                            )}
                        </TableCell>
                        <TableCell className="text-xs font-medium uppercase text-muted-foreground">
                            {ticket.category}
                        </TableCell>
                        <TableCell className="font-medium text-xs max-w-[200px] truncate text-foreground">
                            {ticket.subject}
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(ticket.status)} className="text-[9px] uppercase font-bold">
                            {ticket.status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Link href={`/admin/tickets/${ticket.id}`}>
                            <Button size="sm" className="btn-primary text-white text-xs h-8">Manage</Button>
                            </Link>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground border-t border-border">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="font-medium">No support tickets found in the system.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
