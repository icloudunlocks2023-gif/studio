'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, signInWithEmail, signUpWithEmail } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader, LogIn, UserPlus } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmail(auth, loginEmail, loginPassword);
      if (userCredential) {
        onOpenChange(false);
        if (userCredential.user.email === ADMIN_EMAIL) {
          router.push('/admin');
        }
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
      }
    } catch (error: any) {
      let message = "Incorrect details. Please try again.";
      const errorCode = error?.code || error?.message;

      if (errorCode?.includes('auth/user-not-found') || errorCode?.includes('auth/wrong-password') || errorCode?.includes('auth/invalid-credential')) {
        message = "Invalid email or password.";
      } else if (errorCode?.includes('auth/too-many-requests')) {
        message = "Too many failed attempts. Please try again later.";
      } else if (errorCode?.includes('auth/user-disabled')) {
        message = "This account has been disabled.";
      }
      
      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signUpWithEmail(auth, firestore, regEmail, regPassword, regDisplayName);
      if (userCredential) {
        onOpenChange(false);
        toast({ title: "Account Created", description: "Welcome to iCloud Unlocks!" });
      }
    } catch (error: any) {
      let message = "Could not create account.";
      const errorCode = error?.code || error?.message;

      if (errorCode?.includes('auth/email-already-in-use')) {
        message = "This email is already registered. Please try logging in instead.";
      } else if (errorCode?.includes('auth/invalid-email')) {
        message = "Please enter a valid email address.";
      } else if (errorCode?.includes('auth/weak-password')) {
        message = "Password should be at least 6 characters long.";
      } else if (errorCode?.includes('auth/operation-not-allowed')) {
        message = "Sign up is currently disabled.";
      }
      
      toast({ title: "Registration Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-background">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Account Access</DialogTitle>
            <DialogDescription className="text-center">
              Login or create an account to manage your unlocks.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary text-white font-bold h-11" disabled={isLoading}>
                  {isLoading ? <Loader className="animate-spin h-5 w-5" /> : "Sign In"}
                </Button>
                <div className="text-center text-[10px] text-muted-foreground px-4">
                  Forgot Password? Please contact the site <a href="https://t.me/iCloudUnlocks_2023" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-primary">administrator</a> to request a reset.
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Display Name</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="John Doe" 
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password (Min 6 chars)</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full btn-primary text-white font-bold h-11" disabled={isLoading}>
                  {isLoading ? <Loader className="animate-spin h-5 w-5" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}