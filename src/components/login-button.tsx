'use client';
import {
  useFirebase,
  useUser,
  signOut,
} from '@/firebase';
import { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogIn, LogOut, User, Shield, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthModal } from './auth-modal';

export function LoginButton() {
  const { auth } = useFirebase();
  const { data: user } = useUser();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const isAdmin = user?.email === 'iunlockapple01@gmail.com';

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL!} alt={user.displayName!} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user.displayName?.[0] || user.email?.[0]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none">
                {user.displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/my-account')}>
            <User className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setIsAuthModalOpen(true)} 
        className="btn-primary text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Get Started
      </Button>
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </>
  );
}
