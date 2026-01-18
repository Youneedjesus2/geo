"use client";

import React, { useState } from 'react';
import { User, AuditReport } from '@/types/audit';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { BrainCircuit, Loader2 } from 'lucide-react';

type View = 'landing' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  
  // Audit State
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Landing Page Input State
  const [lpBusiness, setLpBusiness] = useState('');
  const [lpCity, setLpCity] = useState('');

  const handleLogout = () => {
    setUser(null);
    setReport(null);
    setView('landing');
  };

  const handleUpgrade = () => {
    // Mock upgrade
    if (user) {
        setUser({ ...user, plan: 'pro' });
    }
  };

  const runAudit = async (name: string, city: string) => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name: name, city })
        });
        
        const result = await response.json();
        
        console.log('API response:', result); // Debug log
        
        if (result.status === 'success' && result.data) {
          // Validate that we have the minimum required data
          // Check if fields exists and has the required properties (not just empty {})
          const hasFields = result.data.fields && 
                           typeof result.data.fields === 'object' &&
                           Object.keys(result.data.fields).length > 0 &&
                           result.data.fields.address;
          
          if (!hasFields) {
            console.error('Missing or incomplete fields in response:', result.data);
            // Show a user-friendly error with backend errors/warnings if available
            const errorMsg = result.errors?.length > 0 
              ? `Backend errors: ${result.errors.map((e: any) => e.message).join(', ')}`
              : 'Invalid response from server: missing fields data. Please check that your API keys are configured correctly.';
            throw new Error(errorMsg);
          }
          setReport(result.data);
          return result.data;
        } else {
          throw new Error(result.message || 'Audit failed');
        }
    } catch (err: any) {
        console.error('Audit error:', err);
        setError(err.message);
        throw err;
    } finally {
        setLoading(false);
    }
  };

  const handleLandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lpBusiness || !lpCity) return;
    
    // Run the audit immediately for a "Guest" user
    setLoading(true);
    setError(null);

    try {
      const data = await runAudit(lpBusiness, lpCity);
      
      // Create a temporary guest user with Free plan to show the dashboard with paywalls
      setUser({
        id: 'guest-' + Date.now(),
        name: 'Guest User',
        email: 'guest@example.com',
        plan: 'free',
        businessName: lpBusiness,
        role: 'Visitor'
      });
      setView('dashboard');
    } catch (err: any) {
      setError(err.message);
      // If error, stay on landing page but show error
    } finally {
      setLoading(false);
    }
  };

  if (view === 'dashboard' && user) {
    return (
        <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            onRunAudit={runAudit}
            onUpgrade={handleUpgrade}
            report={report}
            loading={loading}
            error={error}
        />
    );
  }

  // Landing View
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 flex flex-col">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Neural<span className="text-emerald-500">Audit</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
                Log In
            </button>
            <button 
                className="text-sm font-semibold bg-white text-zinc-950 px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
                Sign Up
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
                How does AI <br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-400">describe your business?</span>
            </h1>
            <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
                NeuralAudit cross-references major LLMs to simulate how AI assistants perceive your business, identifying critical data discrepancies.
            </p>

            {/* Quick Audit Form */}
            <div className="max-w-2xl mx-auto mt-12">
                <form onSubmit={handleLandingSubmit} className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input 
                            type="text" 
                            placeholder="Business Name"
                            value={lpBusiness}
                            onChange={(e) => setLpBusiness(e.target.value)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-500"
                            required
                            disabled={loading}
                        />
                        <input 
                            type="text" 
                            placeholder="City"
                            value={lpCity}
                            onChange={(e) => setLpCity(e.target.value)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-500"
                            required
                            disabled={loading}
                        />
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-8 py-3 rounded-xl transition-colors md:min-w-[120px] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Scan'}
                        </button>
                    </div>
                </form>
                <p className="text-zinc-500 text-sm mt-4">Free initial scan. No credit card required.</p>
                {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
