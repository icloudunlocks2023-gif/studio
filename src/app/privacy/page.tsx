
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

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Privacy Policy – iCloud Unlocks</h1>
          
          <div className="space-y-6 text-lg text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Introduction</h2>
              <p>At iCloud Unlocks, we are committed to respecting and protecting your privacy. This policy describes the type of information we collect and how we manage and safeguard it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Information We Collect</h2>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground/90">Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Name, email, phone number</li>
                <li>Device identifiers such as IMEI, serial number, and model</li>
                <li>Payment-related information (we do not store full payment details)</li>
              </ul>
              <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground/90">Non-Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Website usage data</li>
                <li>IP address, browser type, operating system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">How Your Information Is Used</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Deliver and improve our unlocking services</li>
                <li>Provide customer support</li>
                <li>Process and verify payments</li>
                <li>Communicate updates and service information</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Sharing of Information</h2>
              <p>We do not sell or trade your information. We may share limited data with:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Trusted service partners that assist in service operations</li>
                <li>Authorities if legally required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Security Measures</h2>
              <p>We use industry-standard practices to protect your data. However, no online system is 100% secure, and we cannot guarantee absolute protection.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Your Rights</h2>
              <p>You may request:</p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Copies of your personal data</li>
                <li>Corrections to inaccurate information</li>
                <li>Deletion of certain data (subject to legal limitations)</li>
                <li>To object to specific types of processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Changes to Policy</h2>
              <p>This Privacy Policy may be updated periodically. New versions will be posted with an updated date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Contact Information</h2>
              <p>For privacy-related inquiries:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><span className="font-semibold">Telegram:</span> <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@iCloudUnlocks_2023</a></li>
              </ul>
            </section>

            <p className="text-center pt-6">Thank you for trusting iCloud Unlocks.</p>
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
