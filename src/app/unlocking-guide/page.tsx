
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

export default function UnlockingGuidePage() {
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
          <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Detailed Explanation of Our Unlocking Process</h1>
          
          <div className="space-y-6 text-lg text-muted-foreground prose lg:prose-xl max-w-none dark:prose-invert">
            <p>Dear Valued Clients,</p>
            <p>Here’s a clear and comprehensive guide to our unlocking process:</p>

            <section>
                <h2 className="font-semibold text-foreground">1. IMEI or Serial Number Submission</h2>
                <p>On the services page, you will find a list of supported device models. Select the model you wish to unlock, enter the IMEI or Serial Number, and click the Check button. Our server will verify the details and provide full information about your device, including whether it is eligible for unlock.</p>
            </section>
            
            <section>
                <h2 className="font-semibold text-foreground">2. Payment</h2>
                <p>Once device support is confirmed, you can proceed with the unlock and make the required payment. We support several secure payment methods, including:</p>
                <ul className="list-disc list-inside">
                    <li><strong>USDT (BEP20)</strong> – Highly recommended. Payment is made directly to the server’s address with no additional fees.</li>
                    <li>Binance Bitcoin</li>
                    <li>Other crypto payments</li>
                    <li>Skrill</li>
                </ul>
                <p>Please note: For payment methods other than USDT BEP20, additional fees may apply.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">3. Registration</h2>
                <p>After your payment is confirmed, we register your device’s IMEI or Serial Number with our official unlock service provider. This is a crucial step that initiates the unlocking process. Registration may take some time—up to 24 hours—as it depends on server queues and processing times.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">4. Unlock and Activation</h2>
                <p>Once registration is complete, we activate your device. During this stage:</p>
                <ul className="list-disc list-inside">
                    <li>Find My iPhone (FMI) is turned off</li>
                    <li>Activation Lock is permanently removed</li>
                </ul>
                <p>This ensures the device is ready for setup.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">5. Firmware Restoration (If Required)</h2>
                <p>If your device is passcode-locked, disabled, unavailable, or in lost mode, it may require a full firmware restoration. This process uses fresh IPSW firmware and a Windows or macOS PC with tools such as 3uTools or iTunes.</p>
                <p>If you're unfamiliar with this procedure, we will guide you step-by-step through downloading and installing the correct firmware from official sources to ensure a smooth restoration.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">6. Devices on Activation Lock / Hello Screen</h2>
                <p>If your device is already on the Activation Lock or Hello screen, a full restore may not be necessary. Simply:</p>
                <ul className="list-disc list-inside">
                    <li>Go to Connect to Wi-Fi,</li>
                    <li>Connect to your network,</li>
                    <li>Allow the device to refresh its iCloud status.</li>
                </ul>
                <p>Once FMI has been turned off on our side, you will be able to skip the Activation Lock, as the previous owner’s account will be completely removed.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">7. Final Setup</h2>
                <p>After the unlock is completed, you can set up your device normally and sign in with a new iCloud account. The device will no longer be linked to the previous owner, giving you full access and control.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">8. Technical Support</h2>
                <p>Our dedicated support team is available throughout the process to assist you with any questions or technical issues. We ensure that your unlocking experience is smooth, transparent, and stress-free.</p>
            </section>

            <section>
                <h2 className="font-semibold text-foreground">A Safe, Permanent Unlock</h2>
                <p>Our unlock solution is:</p>
                <ul className="list-disc list-inside">
                    <li>Permanent</li>
                    <li>Safe</li>
                    <li>Reliable</li>
                    <li>Free from phishing, jailbreaking, or bypass methods</li>
                </ul>
                <p>We pride ourselves on offering professional and legitimate services.</p>
            </section>

            <p>If you have any questions or need further assistance, please feel free to contact us.</p>
            <p>Your satisfaction and peace of mind are our priorities. Thank you for choosing icloud unlocks!</p>

            <p>Best regards,<br/>The icloud unlocks Team</p>

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
