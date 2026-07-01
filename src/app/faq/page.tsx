
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationDropdown } from '@/components/notification-dropdown';

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

export default function FaqPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === 'iunlockapple01@gmail.com';
  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');


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
                <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">My Account</Link>
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
                    <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                    {user && (
                      <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
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

      <main className="max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex-grow">
        <div className="bg-card p-8 md:p-12 rounded-2xl shadow-lg border border-border">
          <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Frequently Asked Questions</h1>
          
          <Accordion type="single" collapsible className="w-full">
            <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground border-b border-border pb-2">General Questions</h2>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg text-left text-foreground">What is iCloud Unlocks?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground space-y-2">
                <p>iCloud Unlocks is a trusted provider specializing in unlocking a wide range of Apple devices. We offer:</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>FMI OFF</li>
                  <li>iCloud account removal</li>
                  <li>Activation unlocks</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg text-left text-foreground">How does your unlock work?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                All unlocks are carried out through secure server systems — no jailbreak, no personal data access required. Provide the IMEI or Serial Number and we handle the rest.
              </AccordionContent>
            </AccordionItem>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b border-border pb-2">Supported Devices</h2>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg text-left text-foreground">Which devices do you support?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>iPhones: X – 15 Pro Max</li>
                    <li>iPads: 2016 – 2025 models</li>
                    <li>MacBooks: All models</li>
                    <li>Apple Watches: Series 5 – 8</li>
                 </ul>
              </AccordionContent>
            </AccordionItem>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b border-border pb-2">Payments & Refunds</h2>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg text-left text-foreground">What are the accepted payment methods?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>Binance Pay</li>
                  <li>Bitcoin</li>
                  <li>PayPal</li>
                  <li>USDT (TRC20)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg text-left text-foreground">What is your refund policy?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground space-y-2">
                <p>Refunds only for orders not completed or rejected. No refunds for devices already unlocked before order. Processing time: 1–3 business days.</p>
              </AccordionContent>
            </AccordionItem>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b border-border pb-2">Security & Privacy</h2>
             <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg text-left text-foreground">Is the unlock safe?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Yes. All unlocks are server-based. We do not perform hacking, phishing, or unauthorized bypasses.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg text-left text-foreground">How do you secure my information?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                We use multiple layers of protection. Refer to our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> for full details.
              </AccordionContent>
            </AccordionItem>

             <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b border-border pb-2">Customer Support</h2>
             <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg text-left text-foreground">How can I contact support?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground space-y-2">
                <p>Support available 24/7.</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><span className="font-semibold">Telegram:</span> <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@iCloudUnlocks_2023</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b border-border pb-2">Additional Questions</h2>
             <AccordionItem value="item-9">
              <AccordionTrigger className="text-lg text-left text-foreground">Do you offer technician or bulk discounts?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Yes, we have special pricing for recurring customers and professionals.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-10">
              <AccordionTrigger className="text-lg text-left text-foreground">How long does unlocking take?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Most services complete in 1–3 business days, depending on device and service type.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-11">
              <AccordionTrigger className="text-lg text-left text-foreground">I forgot my device password. Can you help?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Yes, we can help unlock and reactivate your device even if the password is forgotten.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-12">
              <AccordionTrigger className="text-lg text-left text-foreground">How can I join your community?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Join our Telegram group: <a href="https://t.me/iCloudUnlocks2023" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">iCloudUnlocks2023</a>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </main>

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
                           <a href="https://wa.me/message/VAWM7QDYEPBZF1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
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
    </div>
  );
}
