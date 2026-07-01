
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

export default function RefundPolicyPage() {
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
          <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Refund Policy – iCloud Unlocks</h1>
          
          <div className="space-y-6 text-lg text-muted-foreground prose lg:prose-xl max-w-none dark:prose-invert">
            <p>At iCloud Unlocks, we value transparency, fairness, and customer satisfaction. Our refund policy is designed to protect both the client and the service provider while ensuring a smooth unlocking experience.</p>
            
            <section>
              <h2 className="font-semibold text-foreground">1. Eligibility for Refund</h2>
              <p>A refund is issued only if the unlock process is not completed due to reasons from our side or server-side limitations. Refunds apply in the following cases:</p>
              <ul className="list-disc list-inside">
                <li>The device fails to unlock after successful registration.</li>
                <li>The server marks the service as Rejected, Unsupported, or Failed.</li>
                <li>We determine that the device is not eligible for unlocking after payment was made.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">2. Non-Refundable Situations</h2>
              <p>A refund will not be issued in the following cases:</p>
               <ul className="list-disc list-inside">
                <li>The client provides wrong IMEI or serial number.</li>
                <li>The device changes status (e.g., new iCloud lock, lost mode, blacklisted) after the order is placed.</li>
                <li>The client restores, erases, or attempts third-party bypasses, causing conflicts during the unlock process.</li>
                <li>The client cancels the order while the unlock is already in progress or registration is completed.</li>
                <li>The client fails to follow instructions for device activation after FMI is turned off.</li>
              </ul>
            </section>

             <section>
                <h2 className="font-semibold text-foreground">3. Refund Method</h2>
                <p>Refunds are sent using the same payment method used during the transaction.</p>
                <p>Crypto refunds (USDT, BTC, ETH) are returned exactly as received, except:</p>
                <ul className="list-disc list-inside">
                    <li>Network fees are deducted.</li>
                    <li>Refund is based on value received, not current market price.</li>
                </ul>
            </section>

             <section>
                <h2 className="font-semibold text-foreground">4. Processing Time</h2>
                <p>Refunds are processed within 1–48 hours, depending on verification and network confirmation times for crypto payments.</p>
            </section>
            
             <section>
                <h2 className="font-semibold text-foreground">5. Device Status Verification</h2>
                <p>Before approving any refund, we will:</p>
                 <ul className="list-disc list-inside">
                    <li>Check server logs.</li>
                    <li>Verify registration results.</li>
                    <li>Confirm unlock attempt records.</li>
                </ul>
                <p>This ensures fairness and prevents misuse.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">6. Technical Issues</h2>
                <p>If an unlock delay occurs due to:</p>
                 <ul className="list-disc list-inside">
                    <li>Server maintenance</li>
                    <li>System congestion</li>
                    <li>Extended registration times</li>
                </ul>
                <p>We may request additional time before initiating a refund. Most unlocks complete successfully, so patience is appreciated.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">7. Integrity & Security</h2>
                 <ul className="list-disc list-inside">
                    <li>We do not store or request personal information from previous owners.</li>
                    <li>Your device details remain confidential and are used strictly for unlocking purposes.</li>
                </ul>
            </section>
            
            <section>
                <h2 className="font-semibold text-foreground">8. Contact for Refunds</h2>
                <p>To request a refund, contact us with:</p>
                 <ul className="list-disc list-inside">
                    <li>Order ID</li>
                    <li>IMEI/Serial</li>
                    <li>Payment screenshot</li>
                    <li>A brief explanation</li>
                </ul>
                <p>Our team will review and respond promptly.</p>
            </section>

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
