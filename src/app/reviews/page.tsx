'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser } from '@/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, History, Menu, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoginButton } from '@/components/login-button';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { format } from 'date-fns';
import { orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PastWork {
  id: string;
  title: string;
  description: string;
  completionDate: string;
  imageUrls: string[];
  createdAt: any;
}

export default function ReviewsPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  const constraints = useMemo(() => [orderBy('completionDate', 'desc')], []);
  const { data: reviews, loading } = useCollection<PastWork>('past_work', { constraints });

  const [selectedGallery, setSelectedGallery] = useState<{ urls: string[], title: string } | null>(null);

  return (
    <div className="bg-background text-foreground flex flex-col min-h-screen transition-colors duration-300">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Services</Link>
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
                    <SheetHeader><SheetTitle className="sr-only">Mobile Menu</SheetTitle></SheetHeader>
                    <div className="flex flex-col gap-4 p-4">
                        <Link href="/" className="py-2 text-base font-medium">Home</Link>
                        <Link href="/services" className="py-2 text-base font-medium">Services</Link>
                        {user && <Link href="/my-account" className="py-2 text-base font-medium">My Account</Link>}
                        <div className="pt-4"><LoginButton /></div>
                    </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8 w-full flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
                <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <h1 className="text-4xl font-black tracking-tight">Reviews & Past Work</h1>
                <p className="text-muted-foreground mt-1">Real proof of our professional Apple device unlocking services.</p>
            </div>
          </div>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium">Loading our work history...</p>
            </div>
        ) : reviews && reviews.length > 0 ? (
            <div className="grid gap-12">
                {reviews.map((work) => (
                    <Card key={work.id} className="overflow-hidden border border-border shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in">
                        <div className="grid lg:grid-cols-12 gap-0">
                            <div className="lg:col-span-8 p-6 sm:p-8 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                                        <Calendar className="h-4 w-4" />
                                        Completed: {format(new Date(work.completionDate), 'PPP')}
                                    </div>
                                    <CardTitle className="text-3xl font-black">{work.title}</CardTitle>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed">{work.description}</p>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {work.imageUrls.map((url, idx) => (
                                        <div 
                                          key={idx} 
                                          className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted/30 group cursor-pointer"
                                          onClick={() => setSelectedGallery({ urls: work.imageUrls, title: work.title })}
                                        >
                                            <Image 
                                                src={url} 
                                                alt={`Past work image ${idx + 1}`} 
                                                fill 
                                                style={{ objectFit: 'cover' }}
                                                className="transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                                                    <ChevronRight className="text-white h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-4 bg-muted/10 border-l border-border p-8 flex flex-col justify-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-primary/10 text-primary mx-auto">
                                    <MessageSquare className="h-8 w-8" />
                                </div>
                                <h4 className="text-xl font-bold uppercase tracking-tighter">Verified Unlock</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    "This device was successfully processed through our official iCloud unlock servers. All security locks were permanently removed."
                                </p>
                                <div className="pt-4">
                                    <Link href="/services">
                                        <Button className="w-full btn-primary text-white font-bold">Start Your Unlock</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 space-y-4 border-2 border-dashed border-border rounded-3xl">
                <History className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-medium">No reviews or past work entries published yet.</p>
            </div>
        )}
      </main>

      <Dialog open={!!selectedGallery} onOpenChange={(open) => !open && setSelectedGallery(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-none">
            <div className="relative w-full h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div>
                        <DialogTitle className="text-xl font-black">{selectedGallery?.title}</DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Image Gallery</DialogDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedGallery(null)} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="flex-1 relative flex items-center justify-center p-4 sm:p-12">
                    {selectedGallery && (
                        <Carousel className="w-full h-full max-w-5xl">
                            <CarouselContent className="h-full">
                                {selectedGallery.urls.map((url, index) => (
                                    <CarouselItem key={index} className="h-full flex items-center justify-center">
                                        <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl bg-muted/20">
                                            <Image 
                                                src={url} 
                                                alt={`Gallery image ${index + 1}`} 
                                                fill 
                                                style={{ objectFit: 'contain' }}
                                                className="rounded-2xl"
                                                priority
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden sm:flex -left-12 hover:bg-primary hover:text-white transition-colors" />
                            <CarouselNext className="hidden sm:flex -right-12 hover:bg-primary hover:text-white transition-colors" />
                        </Carousel>
                    )}
                </div>
                
                <div className="p-4 bg-muted/10 border-t border-border/50 text-center">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                        {selectedGallery?.urls.length} images available in this showcase
                    </p>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
