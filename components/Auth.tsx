import React, { useState } from 'react';
import { BrainCircuit, Mail, Lock, ArrowRight, User, Building, ArrowLeft } from 'lucide-react';

type ViewState = 'login' | 'signup' | 'onboarding';

interface AuthProps {
  initialView?: ViewState;
  onLogin: (user: any) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ initialView = 'login', onLogin, onBack }) => {
  const [view, setView] = useState<ViewState>(initialView);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    role: 'Owner'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'signup') {
      setView('onboarding');
    } else if (view === 'onboarding') {
      // Complete signup
      onLogin({
        id: '123',
        name: formData.name,
        email: formData.email,
        plan: 'free',
        businessName: formData.businessName,
        role: formData.role
      });
    } else {
      // Login
      onLogin({
        id: '123',
        name: 'Demo User',
        email: formData.email,
        plan: 'free',
        businessName: 'Acme Corp',
        role: 'Owner'
      });
    }
  };

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative">
        <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
        >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
        </button>

        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Welcome to NeuralAudit</h2>
            <p className="mt-2 text-zinc-400">Let's set up your business profile.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Your Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-600" />
                        <input 
                            required
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Business Name</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-3.5 h-5 w-5 text-zinc-600" />
                        <input 
                            required
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Acme Inc."
                            value={formData.businessName}
                            onChange={e => setFormData({...formData, businessName: e.target.value})}
                        />
                    </div>
                </div>
            </div>
            
            <button type="submit" className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-colors">
                Complete Setup <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
                <BrainCircuit className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">
            {view === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </h2>
          <p className="mt-2 text-zinc-400">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
                onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                className="font-medium text-emerald-500 hover:text-emerald-400"
            >
                {view === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Email address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-zinc-600" />
                        <input 
                            required
                            type="email" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-zinc-600" />
                        <input 
                            required
                            type="password" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-colors">
                {view === 'login' ? 'Sign In' : 'Get Started'}
            </button>
        </form>
      </div>
    </div>
  );
};