'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, Users, LockOpen, Menu } from 'lucide-react';
import { LoginButton } from '@/components/login-button';
import { useUser, useDoc } from '@/firebase';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages, getImage } from '@/lib/placeholder-images';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NotificationDropdown } from '@/components/notification-dropdown';


const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

const reviews = [
  {
    name: 'Emma R.',
    avatarUrl: 'https://picsum.photos/seed/emma/40/40',
    flag: '🇬🇧',
    date: 'May 22, 2024',
    images: [
      'https://i.postimg.cc/ZRBCxsg3/836BE891_A72F_4E30_8924_4FF33AF7BB0E.jpg',
      'https://i.postimg.cc/Y9GhzDVY/5B87174E_4704_40BB_9A95_809B4B19FC93.jpg'
    ],
    review: '"Absolutely thrilled with iCloud Unlocks! My iPhone was unlocked incredibly fast. The process was straightforward, and their customer service was very helpful. Highly recommend for anyone needing a reliable unlock service. Thank you!"',
    unlockedDevice: 'iPhone 14 Pro Max',
    imageHints: ['keypad', 'security']
  },
  {
    name: 'Mark.',
    avatarUrl: 'https://i.postimg.cc/MHYYZ0k4/IMG-8028.jpg',
    flag: '🇨🇦',
    date: 'january 21, 2026',
    images: [
      'https://i.postimg.cc/fyGb24Sc/IMG_8012.jpg',
      'https://i.postimg.cc/fyGb24S9/IMG_8013.jpg'
    ],
    review: '"Unlocked iPhone 15 Pro Max. The experience was good and professional. Everything worked well, and the device is fully unlocked"',
    unlockedDevice: 'iPhone 15 Pro Max',
    imageHints: ['keypad', 'security']
  },
  {
    name: 'David K.',
    avatarUrl: 'https://picsum.photos/seed/david/40/40',
    flag: '🇰🇪',
    date: 'June 01, 2024',
    images: [
      'https://i.postimg.cc/gjq9CZtC/IMG_3876.jpg',
      'https://i.postimg.cc/4ybCD9Fs/IMG_3877.jpg'
    ],
    review: '"My iPhone 14 was unlocked in no time! I was skeptical at first, but iCloud Unlocks proved to be super efficient and reliable. The instructions were clear, and I got my device working perfectly. Excellent service, highly recommended to everyone!"',
    unlockedDevice: 'iPhone 14',
    imageHints: ['keypad', 'security']
  },
    {
    name: 'Sofia G.',
    avatarUrl: 'https://picsum.photos/seed/sofia/40/40',
    flag: '🇪🇸',
    date: 'August 31, 2025',
    images: [
      'https://i.postimg.cc/jqzrwpqc/IMG_3977.jpg',
      'https://i.postimg.cc/bYQjD7YR/IMG_3978.jpg'
    ],
    review: '"Fantastic service for my 14 Pro Max! iCloud Unlocks provided a super fast and secure unlock. Their customer service was excellent, answering all my questions promptly. I am very impressed with their professionalism and highly recommend them!"',
    unlockedDevice: 'iPhone 14 Pro Max',
    imageHints: ['keypad', 'security']
  },
  {
    name: 'Liam B.',
    avatarUrl: 'https://picsum.photos/seed/liam/40/40',
    flag: '🇨🇦',
    date: 'August 7, 2025',
    images: [
      'https://i.postimg.cc/D0Kkpg6H/IMG_1843.jpg',
      'https://i.postimg.cc/NF7h3HPv/IMG_1846.jpg'
    ],
    review: '"Top-notch service! My MacBook Pro was stuck on the iCloud activation screen, and they unlocked it within a day. Communication was excellent throughout. I\'m amazed at how simple they made it. Will definitely use again if needed."',
    unlockedDevice: 'MacBook Pro"',
    imageHints: ['laptop', 'desk']
  },
  {
    name: 'Aisha N.',
    avatarUrl: 'https://picsum.photos/seed/aisha/40/40',
    flag: '🇳🇬',
    date: 'June 08, 2024',
    images: [
      'https://i.postimg.cc/pVDthwVS/IMG_4073.jpg',
      'https://i.postimg.cc/L4zMYc6F/IMG_4075.jpg'
    ],
    review: '"I was about to give up on my old iPhone 13, but iCloud Unlocks came to the rescue. The unlock was successful, and the price was very reasonable. The entire process felt secure and professional. Thank you so much for your help!"',
    unlockedDevice: 'iPhone 13',
    imageHints: ['phone', 'hand']
  },
  {
    name: 'Chloe L.',
    avatarUrl: 'https://picsum.photos/seed/chloe/40/40',
    flag: '🇦🇺',
    date: 'May 28, 2024',
    images: [
      'https://i.postimg.cc/SR70BMts/IMG_3937.jpg',
      'https://i.postimg.cc/hvbFkd34/IMG_3938.jpg'
    ],
    review: '"Unlocking my iPad was a breeze with iCloud Unlocks. The team was responsive and kept me updated. It\'s great to have my device fully functional again. I couldn\'t be happier with the outcome. Highly trustworthy and efficient service!"',
    unlockedDevice: 'iPad"',
    imageHints: ['tablet', 'creative']
  },
  {
    name: 'Kenji T.',
    avatarUrl: 'https://picsum.photos/seed/kenji/40/40',
    flag: '🇯🇵',
    date: 'June 12, 2024',
    images: [
      'https://i.postimg.cc/7PgyGFYy/IMG_4148.jpg',
      'https://i.postimg.cc/J7bWDf48/IMG_4149.jpg'
    ],
    review: '"My Apple Watch SE had been locked for months. I found iCloud Unlocks and decided to give them a try. Best decision ever! The unlock was quick and flawless. Their support is world-class. I highly recommend their services to everyone!"',
    unlockedDevice: 'Apple Watch SE',
    imageHints: ['smartwatch', 'lifestyle']
  }
];

const services = [
    {
      title: 'iPhone iCloud Unlock',
      description: 'We provide reliable solutions to remove iCloud locks from all iPhone models.',
      imageUrl: 'https://i.postimg.cc/8Cx2qKXT/iphone.jpg',
      deviceName: 'iPhone',
    },
    {
      title: 'iPad Unlock',
      description: 'Unlock your iPad easily and regain full access to your Apple ecosystem.',
      imageUrl: 'https://i.postimg.cc/XvZM1SLq/ipades.jpg',
      deviceName: 'iPad',
    },
    {
      title: 'MacBook Unlock',
      description: 'Get professional iCloud lock removal for MacBooks and access your data again.',
      imageUrl: 'https://i.postimg.cc/XqwP5n8B/mac1.png',
      deviceName: 'MacBook',
    },
    {
      title: 'Apple Watch Unlock',
      description: 'We also handle iCloud unlocks for all Apple Watch series quickly and securely.',
      imageUrl: 'https://i.postimg.cc/wBnCSf4v/watch.png',
      deviceName: 'Apple Watch',
    },
];

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

interface Counters {
    registeredUsers: number;
    unlockedDevices: number;
}

const AnimatedCounter = ({ endValue, duration = 2000, label, icon: Icon }: { endValue: number, duration?: number, label: string, icon: React.ElementType }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let start = 0;
                    const end = endValue;
                    if (start === end) return;

                    const totalMiliseconds = duration;
                    const incrementTime = (totalMiliseconds / end) * 0.1;
                    
                    const timer = setInterval(() => {
                        start += Math.ceil(end / (totalMiliseconds / incrementTime) * 0.1);
                        if (start >= end) {
                            setCount(end);
                            clearInterval(timer);
                        } else {
                            setCount(start);
                        }
                    }, incrementTime);

                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [endValue, duration]);
    
    return (
        <div ref={ref} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center border border-white/20">
            <Icon className="h-8 w-8 mx-auto mb-2 text-white" />
            <p className="text-3xl font-bold">{Math.round(count).toLocaleString()}+</p>
            <p className="text-sm uppercase tracking-wider">{label}</p>
        </div>
    );
};


export default function IcloudUnlocksPage() {
  const { data: user } = useUser();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { toast } = useToast();
  const telegramIcon = getImage('telegram-icon');
  const whatsappIcon = getImage('whatsapp-icon');


  const { data: counters, loading: countersLoading } = useDoc<Counters>('counters', 'metrics');

  const handleAddReviewClick = () => {
    toast({
        title: "Unable to Add Review",
        description: "You must have a completed unlock order with us to leave a review.",
    });
  };
  
  return (
    <div className="bg-gray-50 flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Services</Link>
               {user && (
                  <Link href="/my-account" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">My Account</Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">Admin</Link>
              )}
              {user && <NotificationDropdown />}
              <LoginButton />
            </div>
            <div className="md:hidden">
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
                    <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Home</Link>
                    <Link href="/services" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Services</Link>
                    {user && (
                        <Link href="/my-account" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">My Account</Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="text-gray-700 hover:text-gray-900 py-2 rounded-md text-base font-medium transition-colors">Admin</Link>
                    )}
                    {user && (
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-gray-700 text-base font-medium">Notifications</span>
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

      {/* Hero Section */}
      <main className='flex-grow'>
      <section id="home" className="flex items-center justify-center apple-gradient relative overflow-hidden pt-20 pb-8">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left text-white">
              <p className="text-xs font-bold tracking-[0.2em] mb-2 opacity-60 animate-fade-in">
                iCloud Unlocks Version 1.4
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 animate-fade-in">
                Professional iCloud Unlocking Service
              </h1>
              <p className="text-base md:text-lg mb-4 opacity-90 animate-fade-in">
                Unlock your Apple devices safely and professionally. We support iPhones, iPads, MacBooks, and Apple Watches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in mb-6">
                <Link href="/services">
                    <Button className="btn-primary text-white px-8 py-3 rounded-lg font-semibold text-base h-auto">
                        View Services
                    </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto md:mx-0 animate-fade-in">
                 {!countersLoading && counters ? (
                    <>
                        <AnimatedCounter endValue={counters.registeredUsers} label="Registered Users" icon={Users} />
                        <AnimatedCounter endValue={counters.unlockedDevices} label="Unlocked Devices" icon={LockOpen} />
                    </>
                 ) : (
                    <>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center border border-white/20">
                            <Users className="h-8 w-8 mx-auto mb-2 text-white" />
                            <p className="text-3xl font-bold">...+</p>
                            <p className="text-sm uppercase tracking-wider">Registered Users</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center border border-white/20">
                            <LockOpen className="h-8 w-8 mx-auto mb-2 text-white" />
                            <p className="text-3xl font-bold">...+</p>
                            <p className="text-sm uppercase tracking-wider">Unlocked Devices</p>
                        </div>
                    </>
                 )}
              </div>
            </div>
            <div className="relative hidden md:flex justify-center items-center">
              <div className="hero-image-glow"></div>
              <Image 
                src="https://i.postimg.cc/3J2BCVhN/iphone-2-(1).png" 
                alt="iPhone Unlock"
                width={400}
                height={400}
                className="floating-animation"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
        <section id="services" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
                    <p className="text-xl text-gray-600">Professional unlocking for all Apple devices</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => (
                      <Link href="/services" key={index} className="block">
                        <div className="bg-gray-100 rounded-2xl p-6 text-center hover-lift h-full flex flex-col">
                            <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden">
                                <Image
                                    src={service.imageUrl}
                                    alt={service.title}
                                    layout="fill"
                                    objectFit="contain"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                            <p className="text-gray-600 mb-4 flex-grow">{service.description}</p>
                            <Button className="w-full btn-primary text-white py-2 rounded-lg mt-auto">
                                Unlock Now
                            </Button>
                        </div>
                      </Link>
                    ))}
                </div>
            </div>
        </section>

      {/* About Us Section */}
      <section id="about-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="relative h-96">
                    <Image 
                      src="https://i.postimg.cc/90t0hcvy/no-back.png" 
                      alt="About iCloud Unlocks" 
                      layout="fill" 
                      objectFit="contain"
                      className="rounded-lg" 
                    />
                </div>
                <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">About Us</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>iCloud Unlocks was founded in 2023 with a mission to deliver fast, secure, and reliable iCloud and device unlock services for iPhones, iPads, Apple Watches, and MacBooks. We specialize in permanent, server-based unlocks—no bypass tricks, no jailbreaks, and no access to your personal data.</p>
                        <p>Our process is straightforward: clients submit their device IMEI or serial number, which the server checks to provide full device details and determine unlock eligibility. Once confirmed, the device can then be registered for unlock on the server, and after processing, activation is completed which turns OFF the “Find My”.</p>
                        <p>Since our launch, we’ve helped thousands of users regain full access to their devices with transparency, professionalism, and dedicated customer support.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <p className="text-xl text-gray-600">Trusted by thousands of customers worldwide</p>
          </div>
          <div className="text-center mb-16">
            <Button onClick={handleAddReviewClick} className="btn-primary text-white">Add review</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 md:w-1/3">
                    <div className="flex items-center mb-3">
                      <Image src={review.avatarUrl} alt={review.name} width={40} height={40} className="rounded-full mr-3" />
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center">{review.name} <span className="ml-2">{review.flag}</span></p>
                        <p className="text-xs text-gray-500">Reviewed on: {review.date}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                        <Image src={review.images[0]} alt="Review image 1" layout="fill" objectFit="cover" data-ai-hint={review.imageHints.join(' ')} />
                      </div>
                       <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                        <Image src={review.images[1]} alt="Review image 2" layout="fill" objectFit="cover" data-ai-hint={review.imageHints.join(' ')} />
                      </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="text-gray-700 text-sm mb-4 flex-grow">{review.review}</p>
                    <p className="text-sm font-semibold text-gray-500 mt-auto">Unlocked: {review.unlockedDevice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600">We're here to help you</p>
          </div>
          
          <div className="max-w-lg mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Get in Touch</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                 <a href="https://wa.me/message/P2IXLAG23I23P1" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                     {whatsappIcon && <Image src={whatsappIcon.imageUrl} alt="WhatsApp" width={28} height={28} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">WhatsApp</p>
                    <p className="text-blue-600">Chat with us</p>
                  </div>
                </a>
                <div className="flex items-center p-4 rounded-lg border">
                  <div className="w-12 h-12 apple-gradient rounded-lg flex items-center justify-center mr-4">
                    <Clock className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Hours</p>
                    <p className="text-gray-600">24/7 Support</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
