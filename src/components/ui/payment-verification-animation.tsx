
'use client';

import { Loader2, ShieldCheck, Globe, Database, Cpu } from 'lucide-react';

export function PaymentVerificationAnimation() {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-card rounded-2xl shadow-xl border border-border overflow-hidden relative min-h-[400px]">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Animation Core */}
      <div className="relative w-48 h-48 mb-8">
        {/* Rotating Outer Ring */}
        <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
        
        {/* Pulsing Scan Radar */}
        <div className="absolute inset-4 border-2 border-primary/10 rounded-full animate-pulse"></div>
        
        {/* Floating Connection Nodes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Central Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 animate-[pulse_2s_ease-in-out_infinite]">
              <ShieldCheck className="text-primary-foreground w-12 h-12" />
            </div>
            {/* Orbiting Particles */}
            <div className="absolute -inset-4 border border-primary/10 rounded-full animate-[spin_3s_linear_infinite]">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary/60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="space-y-6 w-full max-w-sm">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-2">Verifying Payment</h3>
          <p className="text-primary font-medium text-sm tracking-wide animate-pulse uppercase">Scanning network for transaction...</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
            <Globe className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Blockchain</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
            <Database className="w-5 h-5 text-primary animate-bounce" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Ledger</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
            <Cpu className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Nodes</span>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "Your transaction is currently undergoing automated network confirmation. This process continues until an administrator verifies the receipt."
          </p>
        </div>
      </div>

      {/* Floating Code Snippets (Visual only) */}
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-primary/30 opacity-40 hidden md:block">
        HEX: 0x71C765...<br />
        SYNC: 98.4%
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-primary/30 opacity-40 hidden md:block text-right">
        CONF: 0/3<br />
        NET: Mainnet
      </div>
    </div>
  );
}
