
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseProvider } from '@/firebase/provider';
import { TicketNotificationListener } from '@/components/ticket-notification-listener';
import { ActivityTracker } from '@/components/activity-tracker';
import { NotificationListener } from '@/components/notification-listener';

export const metadata: Metadata = {
  title: 'iCloud Unlocks - Professional Apple Device Unlocking Service',
  description: 'Unlock your Apple devices safely and professionally. We support iPhones, iPads, MacBooks, and Apple Watches.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider>
          <ActivityTracker />
          <NotificationListener />
          <TicketNotificationListener />
          {children}
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
