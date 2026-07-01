'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useUser, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoginButton } from '@/components/login-button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Clock, ChevronRight, AlertTriangle, Wifi, ShieldCheck, Percent, Zap, MessageSquare } from 'lucide-react';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthModal } from '@/components/auth-modal';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface UserProfile {
  id: string;
  accountType?: string;
  isReseller?: boolean;
  resellerPricingActive?: boolean;
}

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

export default function ServicesPage() {
  const { data: user } = useUser();
  const { data: profile } = useDoc<UserProfile>('users', user?.uid || ' ');
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';
  const isResellerActive = profile?.resellerPricingActive === true;
  const isProfessionalUser = ['Reseller', 'Technician', 'Repair Shop / Business'].includes(profile?.accountType || '');

  const calculatePrice = (basePrice: number) => {
    if (isResellerActive) {
      return Math.floor(basePrice * 0.85); // 15% discount
    }
    return basePrice;
  };

  const handleUnlockClick = (device: { name: string, price: number }) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const priceToUse = calculatePrice(device.price);

    const params = new URLSearchParams({
        model: device.name,
        price: priceToUse.toString(),
        image: 'https://i.postimg.cc/9M6QghRY/icloud-unlocks.png',
    });

    const portalUrl = `/client-portal?${params.toString()}`;
    router.push(portalUrl);
  };

  const iphoneModels = [
    { name: 'iPhone X', price: 35, lostPrice: 25 },
    { name: 'iPhone XR', price: 45, lostPrice: 35 },
    { name: 'iPhone XS', price: 40, lostPrice: 30 },
    { name: 'iPhone XS Max', price: 45, lostPrice: 35 },
    { name: 'iPhone 11', price: 50, lostPrice: 40 },
    { name: 'iPhone 11 Pro', price: 55, lostPrice: 45 },
    { name: 'iPhone 11 Pro Max', price: 55, lostPrice: 45 },
    { name: 'iPhone SE (2020)', price: 50, lostPrice: 40 },
    { name: 'iPhone SE (2022)', price: 60, lostPrice: 50 },
    { name: 'iPhone 12 Mini', price: 55, lostPrice: 45 },
    { name: 'iPhone 12', price: 60, lostPrice: 50 },
    { name: 'iPhone 12 Pro', price: 65, lostPrice: 55 },
    { name: 'iPhone 12 Pro Max', price: 70, lostPrice: 60 },
    { name: 'iPhone 13 Mini', price: 75, lostPrice: 65 },
    { name: 'iPhone 13', price: 80, lostPrice: 70 },
    { name: 'iPhone 13 Pro', price: 85, lostPrice: 75 },
    { name: 'iPhone 13 Pro Max', price: 90, lostPrice: 80 },
    { name: 'iPhone 14', price: 90, lostPrice: 80 },
    { name: 'iPhone 14 Plus', price: 95, lostPrice: 85 },
    { name: 'iPhone 14 Pro', price: 100, lostPrice: 90 },
    { name: 'iPhone 14 Pro Max', price: 110, lostPrice: 100 },
    { name: 'iPhone 15', price: 100, lostPrice: 90 },
    { name: 'iPhone 15 Plus', price: 100, lostPrice: 90 },
    { name: 'iPhone 15 Pro', price: 110, lostPrice: 100 },
    { name: 'iPhone 15 Pro Max', price: 120, lostPrice: 110 },
    { name: 'iPhone 16', price: 120, lostPrice: 110 },
    { name: 'iPhone 16e', price: 120, lostPrice: 110 },
    { name: 'iPhone 16 Plus', price: 120, lostPrice: 110 },
    { name: 'iPhone 16 Pro', price: 125, lostPrice: 115 },
    { name: 'iPhone 16 Pro Max', price: 130, lostPrice: 120 },
    { name: 'iPhone 17', price: 130, lostPrice: 120 },
    { name: 'iPhone 17 Air', price: 130, lostPrice: 120 },
    { name: 'iPhone 17 Pro', price: 135, lostPrice: 125 },
    { name: 'iPhone 17 Pro Max', price: 135, lostPrice: 125 },
  ];

  const macbookModels = [
    { name: 'MacBook 2016', price: 60, lostPrice: 50 },
    { name: 'MacBook 2017', price: 65, lostPrice: 55 },
    { name: 'MacBook Air 2017', price: 80, lostPrice: 70 },
    { name: 'MacBook Air 2018', price: 85, lostPrice: 75 },
    { name: 'MacBook Air 2019', price: 90, lostPrice: 80 },
    { name: 'MacBook Air (Intel) 2020', price: 95, lostPrice: 85 },
    { name: 'MacBook Air M1 2020', price: 150, lostPrice: 130 },
    { name: 'MacBook Air M2 13" 2022', price: 155, lostPrice: 135 },
    { name: 'MacBook Air M2 15" 2023', price: 140, lostPrice: 120 },
    { name: 'MacBook Air M3 13" 2024', price: 145, lostPrice: 125 },
    { name: 'MacBook Air M3 15" 2024', price: 150, lostPrice: 130 },
    { name: 'MacBook Air M4 13" 2025', price: 165, lostPrice: 145 },
    { name: 'MacBook Air M4 15" 2025', price: 170, lostPrice: 150 },
    { name: 'MacBook Pro 13" 2016', price: 90, lostPrice: 80 },
    { name: 'MacBook Pro 15" 2016', price: 95, lostPrice: 85 },
    { name: 'MacBook Pro 13" 2017', price: 95, lostPrice: 85 },
    { name: 'MacBook Pro 15" 2017', price: 100, lostPrice: 90 },
    { name: 'MacBook Pro 13" 2018', price: 100, lostPrice: 90 },
    { name: 'MacBook Pro 15" 2018', price: 105, lostPrice: 95 },
    { name: 'MacBook Pro 13" 2019', price: 110, lostPrice: 100 },
    { name: 'MacBook Pro 15" 2019', price: 115, lostPrice: 105 },
    { name: 'MacBook Pro 16" (Intel) 2019', price: 125, lostPrice: 115 },
    { name: 'MacBook Pro 13" (Intel) 2020', price: 130, lostPrice: 120 },
    { name: 'MacBook Pro M1 13" 2020', price: 160, lostPrice: 140 },
    { name: 'MacBook Pro M1 Pro/Max 14" 2021', price: 180, lostPrice: 160 },
    { name: 'MacBook Pro M1 Pro/Max 16" 2021', price: 190, lostPrice: 170 },
    { name: 'MacBook Pro M2 13" 2022', price: 185, lostPrice: 165 },
    { name: 'MacBook Pro M2 Pro/Max 14" 2023', price: 200, lostPrice: 180 },
    { name: 'MacBook Pro M2 Pro/Max 16" 2023', price: 210, lostPrice: 190 },
    { name: 'MacBook Pro M3 14" 2023', price: 190, lostPrice: 170 },
    { name: 'MacBook Pro M3 Pro/Max 14" 2023', price: 215, lostPrice: 195 },
    { name: 'MacBook Pro M3 Pro/Max 16" 2023', price: 225, lostPrice: 205 },
    { name: 'MacBook Pro M4 14" 2024', price: 230, lostPrice: 210 },
    { name: 'MacBook Pro M4 Pro/Max 14" 2024', price: 245, lostPrice: 225 },
    { name: 'MacBook Pro M4 Pro/Max 16" 2024', price: 255, lostPrice: 235 },
    { name: 'MacBook Pro M5 14" 2025', price: 270, lostPrice: 250 },
  ];

  const watchModels = [
    { name: 'Apple Watch Series 2', price: 30, lostPrice: 20 },
    { name: 'Apple Watch Series 3', price: 35, lostPrice: 25 },
    { name: 'Apple Watch Series 4', price: 40, lostPrice: 30 },
    { name: 'Apple Watch Series 5', price: 45, lostPrice: 35 },
    { name: 'Apple Watch Series 6', price: 50, lostPrice: 40 },
    { name: 'Apple Watch Series 7 (2021)', price: 60, lostPrice: 50 },
    { name: 'Apple Watch Series 8 (2022)', price: 70, lostPrice: 60 },
    { name: 'Apple Watch Series 9 (2023)', price: 80, lostPrice: 70 },
    { name: 'Apple Watch Series 10 (2024)', price: 85, lostPrice: 75 },
    { name: 'Apple Watch Series 11 (2025)', price: 95, lostPrice: 85 },
    { name: 'Apple Watch SE 1st Gen (2020)', price: 55, lostPrice: 45 },
    { name: 'Apple Watch SE 2nd Gen (2022)', price: 75, lostPrice: 65 },
    { name: 'Apple Watch SE 3rd Gen (2025)', price: 80, lostPrice: 70 },
    { name: 'Apple Watch Ultra 1 (2022)', price: 90, lostPrice: 80 },
    { name: 'Apple Watch Ultra 2 (2023)', price: 95, lostPrice: 85 },
    { name: 'Apple Watch Ultra 3 (2025)', price: 115, lostPrice: 105 },
  ];

  const ipadModels = [
    { name: 'iPad 5th Gen (2017)', price: 60, lostPrice: 50 },
    { name: 'iPad 6th Gen (2018)', price: 65, lostPrice: 55 },
    { name: 'iPad 7th Gen (2019)', price: 70, lostPrice: 60 },
    { name: 'iPad 8th Gen (2020)', price: 75, lostPrice: 65 },
    { name: 'iPad 9th Gen (2021)', price: 80, lostPrice: 70 },
    { name: 'iPad 10th Gen (2022)', price: 85, lostPrice: 75 },
    { name: 'iPad 11th Gen (2025)', price: 90, lostPrice: 80 },
    { name: 'iPad Air 3rd Gen (2019)', price: 70, lostPrice: 60 },
    { name: 'iPad Air 4th Gen (2020)', price: 80, lostPrice: 70 },
    { name: 'iPad Air 5th Gen (2022)', price: 85, lostPrice: 75 },
    { name: 'iPad Air 6th Gen 11" (M2)', price: 95, lostPrice: 85 },
    { name: 'iPad Air 6th Gen 13" (M2)', price: 100, lostPrice: 90 },
    { name: 'iPad Air 7th Gen 11" (M3)', price: 105, lostPrice: 95 },
    { name: 'iPad Air 7th Gen 13" (M3)', price: 110, lostPrice: 100 },
    { name: 'iPad Pro 10.5" (2017)', price: 80, lostPrice: 70 },
    { name: 'iPad Pro 12.9" 2nd Gen (2017)', price: 85, lostPrice: 75 },
    { name: 'iPad Pro 11" 1st Gen (2018)', price: 90, lostPrice: 80 },
    { name: 'iPad Pro 12.9" 3rd Gen (2018)', price: 95, lostPrice: 85 },
    { name: 'iPad Pro 11" 2nd Gen (2020)', price: 100, lostPrice: 90 },
    { name: 'iPad Pro 12.9" 4th Gen (2020)', price: 105, lostPrice: 95 },
    { name: 'iPad Pro 11" 3rd Gen (M1, 2021)', price: 110, lostPrice: 100 },
    { name: 'iPad Pro 12.9" 5th Gen (M1, 2021)', price: 115, lostPrice: 105 },
    { name: 'iPad Pro 11" 4th Gen (M2, 2022)', price: 110, lostPrice: 100 },
    { name: 'iPad Pro 12.9" 6th Gen (M2, 2022)', price: 120, lostPrice: 110 },
    { name: 'iPad Pro 11" (M4, 2024)', price: 120, lostPrice: 110 },
    { name: 'iPad Pro 13" (M4, 2024)', price: 125, lostPrice: 115 },
    { name: 'iPad Pro 11" (M5, 2025)', price: 130, lostPrice: 120 },
    { name: 'iPad Pro 13" (M5, 2025)', price: 135, lostPrice: 125 },
    { name: 'iPad Mini 5th Gen (2019)', price: 65, lostPrice: 55 },
    { name: 'iPad Mini 6th Gen (2021)', price: 80, lostPrice: 70 },
    { name: 'iPad Mini 7th Gen (A17 Pro, 2024)', price: 95, lostPrice: 85 },
  ];

  const ipadWifiOnlyModels = ipadModels.map(model => ({
    ...model,
    price: model.price + 15,
    lostPrice: model.lostPrice + 15
  }));

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
                    <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium ring-1 ring-inset ring-primary">Services</Link>
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
                        <Link href="/services" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors ring-1 ring-inset ring-primary">Services</Link>
                        {user && (
                            <Link href="/my-account" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                        )}
                        {isAdmin && (
                            <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
                        )}
                        {user && (
                          <div className="flex items-center gap-2 py-2">
                            <span className="text-gray-700 dark:text-gray-300 text-base font-medium">Notifications</span>
                            <NotificationDropdown />
                          </div>
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

      <main className="pt-16 flex-grow">
        {/* Reseller Banner / Notice */}
        {isResellerActive && (
          <div className="bg-primary/10 border-b border-primary/20 py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-black text-primary tracking-widest uppercase">Reseller Pricing Active — 15% Discount Applied Sitewide</span>
            </div>
          </div>
        )}

        {!isResellerActive && isProfessionalUser && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 py-4 px-4 text-center">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Looking for reseller pricing? Contact <a href="https://wa.me/message/VAWM7QDYEPBZF1" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Support</a> for reseller rates and bulk service discounts.
            </p>
          </div>
        )}

        <section className="text-center py-12 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Permanent iCloud Unlock (FMI OFF)</h1>
          <p className="text-lg text-muted-foreground mb-8">Works for <strong>Clean</strong>, <strong>Lost with Info</strong>, and <strong>Lost without Info</strong> devices.</p>
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 text-center">
            <p className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
              ✅ Checking the unlock success rate is completely free.
            </p>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Simply click the <strong className="text-foreground">"Check & Unlock"</strong> button and submit your device's <strong className="text-foreground">IMEI</strong> or <strong className="text-foreground">Serial Number</strong>. The system will instantly check the unlock success rate and let you know whether the device is supported before you proceed with an order.
              </p>
              <p className="font-semibold text-foreground">
                This helps you make an informed decision and avoid paying for devices with low unlock success rates.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 space-y-20 flex flex-col items-center">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border flex flex-col">
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                        📱 iPhone Unlock Prices
                        {isResellerActive && <Badge className="bg-green-500 hover:bg-green-600">-15%</Badge>}
                    </h2>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b border-border">
                                <th className="p-2 text-foreground text-sm">Model</th>
                                <th className="p-2 text-foreground text-sm">Price (Clean)</th>
                                <th className="p-2 text-foreground text-sm">Price (Lost)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {iphoneModels.map(device => (
                                <tr key={device.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-2 text-card-foreground text-sm font-medium">{device.name}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-primary">${calculatePrice(device.price)}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-red-500">${calculatePrice(device.lostPrice)}</td>
                                <td className="p-2 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-semibold h-8 text-[11px] px-3" 
                                    onClick={() => handleUnlockClick(device)}
                                  >
                                    Check & Unlock
                                  </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border flex flex-col">
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                        💻 MacBook Unlock Prices
                        {isResellerActive && <Badge className="bg-green-500 hover:bg-green-600">-15%</Badge>}
                    </h2>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b border-border">
                                <th className="p-2 text-foreground text-sm">Model</th>
                                <th className="p-2 text-foreground text-sm">Price (Clean)</th>
                                <th className="p-2 text-foreground text-sm">Price (Lost)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {macbookModels.map(device => (
                                <tr key={device.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-2 text-card-foreground text-sm font-medium">{device.name}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-primary">${calculatePrice(device.price)}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-red-500">${calculatePrice(device.lostPrice)}</td>
                                <td className="p-2 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-semibold h-8 text-[11px] px-3" 
                                    onClick={() => handleUnlockClick(device)}
                                  >
                                    Check & Unlock
                                  </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border flex flex-col">
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                        ⌚ Apple Watch Unlock Prices
                        {isResellerActive && <Badge className="bg-green-500 hover:bg-green-600">-15%</Badge>}
                    </h2>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b border-border">
                                <th className="p-2 text-foreground text-sm">Model</th>
                                <th className="p-2 text-foreground text-sm">Price (Clean)</th>
                                <th className="p-2 text-foreground text-sm">Price (Lost)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {watchModels.map(device => (
                                <tr key={device.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-2 text-card-foreground text-sm font-medium">{device.name}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-primary">${calculatePrice(device.price)}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-red-500">${calculatePrice(device.lostPrice)}</td>
                                <td className="p-2 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-semibold h-8 text-[11px] px-3" 
                                    onClick={() => handleUnlockClick(device)}
                                  >
                                    Check & Unlock
                                  </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border flex flex-col">
                    <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                        📱 iPad Unlock Prices (Standard)
                        {isResellerActive && <Badge className="bg-green-500 hover:bg-green-600">-15%</Badge>}
                    </h2>
                     <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b border-border">
                                <th className="p-2 text-foreground text-sm">Model</th>
                                <th className="p-2 text-foreground text-sm">Price (Clean)</th>
                                <th className="p-2 text-foreground text-sm">Price (Lost)</th>
                                <th className="p-2"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {ipadModels.map(device => (
                                <tr key={device.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-2 text-card-foreground text-sm font-medium">{device.name}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-primary">${calculatePrice(device.price)}</td>
                                <td className="p-2 text-card-foreground text-sm font-bold text-red-500">${calculatePrice(device.lostPrice)}</td>
                                <td className="p-2 text-right">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-semibold h-8 text-[11px] px-3" 
                                    onClick={() => handleUnlockClick(device)}
                                  >
                                    Check & Unlock
                                  </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full">
                <div className="bg-card p-8 rounded-3xl shadow-2xl border-2 border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Wifi size={120} className="text-primary" />
                    </div>
                    
                    <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl">
                        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                            <AlertTriangle size={32} />
                            <h2 className="text-2xl font-black uppercase tracking-tight">Important Notice</h2>
                        </div>
                        <div className="space-y-4 text-sm sm:text-base text-red-900 dark:text-red-200 leading-relaxed">
                            <p>This service is strictly for <strong>Wi-Fi Only iPads</strong>. Please make sure your device is a Wi-Fi model before placing an order.</p>
                            <p>A Wi-Fi Only iPad does <strong>not</strong> have a SIM card slot. If your iPad has a SIM card slot, it is a <strong>Cellular Model</strong> and should NOT be submitted under this service.</p>
                            <p className="font-bold underline">Please note that if a Cellular iPad is submitted and an order is placed through this Wi-Fi Only service, the device may be successfully registered, but the activation process will fail due to Cellular Model restrictions. In such cases, the funds used for the order may be lost and cannot be recovered.</p>
                            <p>For Cellular iPads, customers should use the existing standard unlock services available on the website.</p>
                            <p className="italic">If the customer is unsure whether the device is Wi-Fi Only or Cellular, they should contact support before placing an order.</p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-foreground mb-6 flex items-center gap-3">
                        <Wifi className="text-primary" />
                        iPad Wi-Fi Only Instant FMI OFF Service
                        {isResellerActive && <Badge className="bg-green-500 ml-2">-15%</Badge>}
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b border-border">
                                <th className="p-4 text-foreground font-bold">Wi-Fi Only Model</th>
                                <th className="p-4 text-foreground font-bold">Price (Clean)</th>
                                <th className="p-4 text-foreground font-bold">Price (Lost)</th>
                                <th className="p-4"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {ipadWifiOnlyModels.map(device => (
                                <tr key={`wifi-${device.name}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-4 text-card-foreground font-medium">{device.name} (Wi-Fi Only)</td>
                                <td className="p-4 text-card-foreground font-bold text-primary">${calculatePrice(device.price)}</td>
                                <td className="p-4 text-card-foreground font-bold text-red-500">${calculatePrice(device.lostPrice)}</td>
                                <td className="p-4 text-right">
                                  <Button 
                                    size="sm" 
                                    className="btn-primary text-white font-bold shadow-lg" 
                                    onClick={() => handleUnlockClick(device)}
                                  >
                                    Check & Unlock
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                  </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        {/* Benefits Section for Professionals */}
        <section className="py-20 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Professional Reseller Benefits</h2>
              <p className="text-muted-foreground">Unlock higher margins with our professional program.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 space-y-4 border-primary/10 shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Percent className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Guaranteed 15% Off</h3>
                <p className="text-sm text-muted-foreground">Get a flat 15% discount on all retail prices automatically applied to your account.</p>
              </Card>
              <Card className="p-6 space-y-4 border-primary/10 shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Priority Processing</h3>
                <p className="text-sm text-muted-foreground">Reseller orders are prioritized in our server queues for even faster turnarounds.</p>
              </Card>
              <Card className="p-6 space-y-4 border-primary/10 shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Dedicated Support</h3>
                <p className="text-sm text-muted-foreground">Access our technical team directly via WhatsApp for any complex unlock queries.</p>
              </Card>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-xl text-muted-foreground">We're here to help you</p>
          </div>
          
          <div className="max-w-lg mx-auto">
              <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">Get in Touch</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                 <a href="https://wa.me/message/VAWM7QDYEPBZF1" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors border-border">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                     {whatsappIcon && <Image src={whatsappIcon.imageUrl} alt="WhatsApp" width={28} height={28} />}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">WhatsApp</p>
                    <p className="text-blue-600">Chat with us</p>
                  </div>
                </a>
                <div className="flex items-center p-4 rounded-lg border bg-card border-border">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                    <Clock className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">Hours</p>
                    <p className="text-muted-foreground">24/7 Support</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>
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
                            <a href="https://t.me/iCloudUnlocks2023" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-white">
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
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </div>
  );
}
