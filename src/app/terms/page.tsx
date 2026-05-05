
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { LoginButton } from '@/components/login-button';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
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

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Terms & Conditions – iCloud Unlocks</h1>
          
          <div className="space-y-6 text-lg text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Introduction</h2>
              <p>Welcome to iCloud Unlocks. These Terms and Conditions outline the rules and guidelines for using our services. By accessing or using any part of our platform, you agree to follow these terms. If you do not accept any section of these Terms, please discontinue use of our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Services Provided</h2>
              <p>iCloud Unlocks offers professional unlocking solutions for Apple devices, including iPhones, iPads, MacBooks, and Apple Watches. Our services include:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Disabling Find My iPhone (FMI OFF)</li>
                <li>Removing previous iCloud accounts</li>
                <li>Restoring device access when activation is blocked</li>
              </ul>
              <p className="mt-2">All processes are performed securely through server-side methods.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Eligibility</h2>
              <p>To use our services, you must:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Be at least 18 years old (or have guardian approval)</li>
                <li>Own the device or have verifiable permission from the owner</li>
                <li>Provide accurate and complete device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Payments</h2>
              <p>We accept secure payments through:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Binance Pay</li>
                <li>Bitcoin</li>
                <li>PayPal</li>
                <li>USDT (TRC20)</li>
              </ul>
              <p className="mt-2">Full payment is required before work on your order begins.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Refund Policy</h2>
              <p>Refunds are available ONLY for orders that are rejected or cannot be completed. Refunds are issued via the same payment method used.</p>
              <p className="mt-2">Please allow up to 7 business days for processing.</p>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground/90">No Refund Provided For:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Devices already unlocked before purchase</li>
                <li>Wrong device details submitted by the customer</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Disclaimer</h2>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>You agree not to use iCloud Unlocks for any illegal or unauthorized activity.</li>
                <li>Our service does not involve phishing, hacking, or unlawful security bypass.</li>
                <li>All unlocking is done via verified server systems without jailbreak or extraction of personal data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Limitation of Liability</h2>
              <p>iCloud Unlocks is not responsible for indirect, incidental, or consequential damages. Our total liability will never exceed the amount paid for a service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Privacy</h2>
              <p>Your privacy is important to us. Personal information is used solely for completing your unlock request. We do not share your information unless required by law.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Updates to Terms</h2>
              <p>iCloud Unlocks may revise these Terms at any time. Changes take effect immediately once posted on our website. Continued use of our services means you accept the updated Terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Governing Law</h2>
              <p>These Terms are governed by the laws of the region in which iCloud Unlocks operates. Any disputes will be handled exclusively through the courts of that jurisdiction.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Contact Us</h2>
              <p>If you have questions regarding these Terms, reach out to us:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><span className="font-semibold">Telegram:</span> <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@iCloudUnlocks_2023</a></li>
              </ul>
            </section>
            
             <p className="text-center pt-6">By using our platform, you confirm that you have read, understood, and agree to these Terms.</p>
          </div>
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
    </div>
  );
}
