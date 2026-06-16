'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, signInWithEmail, signUpWithEmail } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader, LogIn, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

const COUNTRIES = [
  { name: 'Kenya', code: '+254' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Nigeria', code: '+234' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'India', code: '+91' },
  { name: 'South Africa', code: '+27' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'UAE', code: '+971' },
  { name: 'Other', code: '' }
];

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regCountry, setRegCountry] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regAccountType, setRegAccountType] = useState('');

  useEffect(() => {
      if (regCountry) {
          const country = COUNTRIES.find(c => c.name === regCountry);
          if (country && country.code) {
              setRegWhatsapp(country.code);
          }
      }
  }, [regCountry]);

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
      }
      
      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
        return toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
    }
    if (!regCountry || !regAccountType || !regUsername) {
        return toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      const userCredential = await signUpWithEmail(auth, firestore, regEmail, regPassword, regUsername, {
          username: regUsername,
          country: regCountry,
          whatsappNumber: regWhatsapp,
          accountType: regAccountType
      });
      if (userCredential) {
        onOpenChange(false);
        toast({ title: "Account Created", description: "Welcome to iCloud Unlocks!" });
      }
    } catch (error: any) {
      let message = "Could not create account.";
      const errorCode = error?.code || error?.message;

      if (errorCode?.includes('auth/email-already-in-use')) {
        message = "This email is already registered.";
      }
      
      toast({ title: "Registration Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl bg-background max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Account Access</DialogTitle>
            <DialogDescription className="text-center">
              Login or create an account to manage your unlocks.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 overflow-y-auto">
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
                  <Input id="login-email" type="email" placeholder="m@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showLoginPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="pr-10" />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary text-white font-bold h-11" disabled={isLoading}>
                  {isLoading ? <Loader className="animate-spin h-5 w-5" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-user">Username</Label>
                  <Input id="reg-user" placeholder="johndoe123" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <Input id="reg-email" type="email" placeholder="m@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <div className="relative">
                        <Input id="reg-password" type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="pr-10" />
                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                          {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirm Password</Label>
                      <div className="relative">
                        <Input id="reg-confirm" type={showRegConfirmPassword ? 'text' : 'password'} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required className="pr-10" />
                        <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                          {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select onValueChange={setRegCountry} value={regCountry}>
                        <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                        <SelectContent>
                            {COUNTRIES.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-whatsapp">WhatsApp (Optional)</Label>
                      <Input id="reg-whatsapp" placeholder="+1..." value={regWhatsapp} onChange={(e) => setRegWhatsapp(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                  <Label>I am registering as:</Label>
                  <Select onValueChange={setRegAccountType} value={regAccountType}>
                    <SelectTrigger><SelectValue placeholder="Select Account Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Personal User">Personal User</SelectItem>
                        <SelectItem value="Technician">Technician</SelectItem>
                        <SelectItem value="Repair Shop / Business">Repair Shop / Business</SelectItem>
                        <SelectItem value="Reseller">Reseller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg text-[10px] text-muted-foreground space-y-2">
                    <p><strong>Privacy Notice:</strong> We have a strict privacy policy. Your personal information is kept secure and is never shared, sold, or provided to any third party.</p>
                    <p><strong>Optional:</strong> Providing a WhatsApp number is not required. It may be used to notify you when an unlock has been completed. However, all order updates and completion statuses are available directly through your account dashboard, so a phone number is not necessary.</p>
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
