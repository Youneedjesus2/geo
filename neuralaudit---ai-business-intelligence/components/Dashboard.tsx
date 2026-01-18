import React, { useState, useEffect } from 'react';
import { User, AuditReport, ComparisonData } from '../types';
import { Building2, MapPin, Search, Loader2, Clock, Crown, LogOut, ChevronRight, User as UserIcon, Home, FileText, CheckCircle, Edit2, Save, X } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { InfoStatusGrid } from './InfoStatusGrid';
import { DiscrepancyDetail } from './DiscrepancyDetail';
import { MissingInfo } from './MissingInfo';
import { SchemaCode } from './SchemaCode';
import { calculateScore } from '../types';
import { regenerateSchema } from '../services/auditService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onRunAudit: (name: string, city: string) => Promise<AuditReport>;
  onUpgrade: () => void;
  report: AuditReport | null;
  loading: boolean;
  error: string | null;
}

type DashboardView = 'home' | 'new-audit' | 'history' | 'report';

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onLogout, 
  onRunAudit,
  onUpgrade,
  report: initialReport,
  loading,
  error 
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>(initialReport ? 'report' : 'home');
  const [localReport, setLocalReport] = useState<AuditReport | null>(initialReport);
  
  // Correction Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  // Inputs for new audit
  const [businessName, setBusinessName] = useState(user.businessName || '');
  const [city, setCity] = useState('');
  
  // Mock history
  const history = [
    { id: '1', date: '2023-10-24', business: 'Acme Corp', city: 'Seattle, WA', score: 78 },
    { id: '2', date: '2023-10-15', business: 'Acme Corp', city: 'Seattle, WA', score: 65 },
    { id: '3', date: '2023-09-28', business: 'Java Bean', city: 'Portland, OR', score: 92 },
  ];

  useEffect(() => {
    if (initialReport) {
        setLocalReport(initialReport);
        setCurrentView('report');
        setIsEditing(false); // Reset edit mode on new report
    }
  }, [initialReport]);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRunAudit(businessName, city);
    // View switching is handled by effect above when report prop updates
  };

  const startEdit = () => {
    if (!localReport) return;
    setEditFormData({
        address: localReport.fields.address.value,
        phone: localReport.fields.phone.value,
        hours: localReport.fields.hours.value,
        description: localReport.fields.description.value,
    });
    setIsEditing(true);
  };

  const saveCorrections = () => {
    if (!localReport) return;

    const updatedFields: ComparisonData = {
        ...localReport.fields,
        address: { ...localReport.fields.address, value: editFormData.address, status: 'MATCH' }, // Assume match if user verified
        phone: { ...localReport.fields.phone, value: editFormData.phone, status: 'MATCH' },
        hours: { ...localReport.fields.hours, value: editFormData.hours, status: 'MATCH' },
        description: { ...localReport.fields.description, value: editFormData.description, status: 'MATCH' },
    };

    const newSchema = regenerateSchema(localReport.businessName, updatedFields);

    setLocalReport({
        ...localReport,
        fields: updatedFields,
        schemaJson: newSchema,
        missingInfoSuggestions: [] // Clear suggestions as user has fixed it (simplification)
    });
    setIsEditing(false);
  };

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white">Analyzing Digital Footprint...</h2>
                <p className="text-zinc-500">Cross-referencing AI knowledge bases</p>
            </div>
        );
    }

    switch (currentView) {
        case 'home':
            return (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <button onClick={() => setCurrentView('new-audit')} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                            <Search className="w-4 h-4" /> Run New Audit
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                            <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Total Scans</h3>
                            <p className="text-4xl font-bold text-white">12</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                            <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Avg Score</h3>
                            <p className="text-4xl font-bold text-emerald-400">78</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                            <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Plan</h3>
                            <p className="text-4xl font-bold text-white capitalize">{user.plan}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                            <button onClick={() => setCurrentView('history')} className="text-sm text-emerald-500 hover:text-emerald-400 font-medium">View All</button>
                        </div>
                        <div className="space-y-3">
                            {history.slice(0, 2).map(item => (
                                <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.score >= 70 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                            {item.score}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{item.business}</p>
                                            <p className="text-xs text-zinc-500">{item.city} • {item.date}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-zinc-600">ARCHIVED</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'new-audit':
            return (
                <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                    <button onClick={() => setCurrentView('home')} className="text-sm text-zinc-500 hover:text-white flex items-center gap-1">
                        ← Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-white">New Audit</h1>
                    <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                        <form onSubmit={handleRunAudit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider ml-1">Business Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-zinc-600" />
                                    <input 
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Business Name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider ml-1">City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-zinc-600" />
                                    <input 
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500"
                                        placeholder="City, State"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                Generate Audit Report
                            </button>
                        </form>
                    </div>
                </div>
            );

        case 'history':
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentView('home')} className="text-sm text-zinc-500 hover:text-white flex items-center gap-1">
                                ← Back
                            </button>
                            <h1 className="text-3xl font-bold text-white">Audit History</h1>
                         </div>
                    </div>
                    <div className="space-y-3">
                        {history.map(item => (
                            <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.score >= 70 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                        {item.score}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{item.business}</p>
                                        <p className="text-xs text-zinc-500">{item.city} • {item.date}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white" />
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'report':
            if (!localReport) return null;
            return (
                <div className="space-y-6 animate-fade-in">
                    <button onClick={() => setCurrentView('home')} className="text-sm text-zinc-500 hover:text-white flex items-center gap-1">
                         ← Back to Dashboard
                    </button>

                     <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{localReport.businessName}</h1>
                                <p className="text-zinc-400 text-sm">{localReport.city}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-zinc-500 uppercase tracking-widest">Audit Score</div>
                                <div className="text-3xl font-bold text-emerald-400">{calculateScore(localReport.fields)}/100</div>
                            </div>
                        </div>

                        {/* Intelligence Verification Section */}
                        <div className="bg-zinc-950/50 border-b border-zinc-800 p-6">
                            {!isEditing ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/10 p-2 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Verify Intelligence</h3>
                                            <p className="text-xs text-zinc-400">Is the gathered data below correct?</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={startEdit}
                                            className="text-xs font-bold px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3 h-3" /> No, Edit Info
                                        </button>
                                        <button className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg cursor-default">
                                            Yes, It's Correct
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Edit2 className="w-4 h-4 text-emerald-500" />
                                            Correct Business Information
                                        </h3>
                                        <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Address</label>
                                            <input 
                                                type="text" 
                                                value={editFormData.address} 
                                                onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Phone</label>
                                            <input 
                                                type="text" 
                                                value={editFormData.phone} 
                                                onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Hours</label>
                                            <input 
                                                type="text" 
                                                value={editFormData.hours} 
                                                onChange={e => setEditFormData({...editFormData, hours: e.target.value})}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Description</label>
                                            <input 
                                                type="text" 
                                                value={editFormData.description} 
                                                onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            onClick={saveCorrections}
                                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2"
                                        >
                                            <Save className="w-3 h-3" /> Save & Update Schema
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="lg:col-span-1">
                                <ScoreGauge score={calculateScore(localReport.fields)} />
                             </div>
                             <div className="lg:col-span-2 space-y-6">
                                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                                    <h3 className="text-sm font-bold text-white mb-2">Executive Summary</h3>
                                    <p className="text-sm text-zinc-400">{localReport.summary}</p>
                                </div>
                                <InfoStatusGrid fields={localReport.fields} />
                             </div>
                        </div>

                        <div className="bg-zinc-950 p-6 border-t border-zinc-800 space-y-6">
                            <DiscrepancyDetail 
                                fields={localReport.fields} 
                                isLocked={user.plan === 'free'} 
                                onUpgrade={onUpgrade} 
                            />
                            
                            <MissingInfo 
                                suggestions={localReport.missingInfoSuggestions} 
                                isLocked={user.plan === 'free'} 
                                onUpgrade={onUpgrade} 
                            />

                            <SchemaCode json={localReport.schemaJson} />
                        </div>
                     </div>
                </div>
            );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setCurrentView('home')}>
             <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">N</div>
             <span className="font-bold text-white tracking-tight">NeuralAudit</span>
          </div>
          
          <div className="mb-6">
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white truncate max-w-[120px]">{user.name}</p>
                        <p className="text-xs text-zinc-400 capitalize">{user.plan} Plan</p>
                    </div>
                </div>
                {user.plan === 'free' && (
                    <button 
                        onClick={onUpgrade}
                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                        <Crown className="w-3 h-3" /> Upgrade to Pro
                    </button>
                )}
            </div>
          </div>

          <nav className="space-y-1">
             <button 
                onClick={() => setCurrentView('home')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'home' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
             >
                <Home className="w-4 h-4" /> Dashboard
             </button>
             <button 
                onClick={() => setCurrentView('new-audit')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'new-audit' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
             >
                <Search className="w-4 h-4" /> New Audit
             </button>
             <button 
                onClick={() => setCurrentView('history')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${currentView === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
             >
                <Clock className="w-4 h-4" /> History
             </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-800">
            <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-zinc-500 hover:text-rose-400 text-sm font-medium transition-colors w-full"
            >
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
            {error && (
                <div className="mb-6 bg-rose-950/20 text-rose-400 p-4 rounded-lg border border-rose-900/50 flex items-center gap-2">
                     <span className="font-bold">Error:</span> {error}
                </div>
            )}
            {renderContent()}
        </div>
      </main>
    </div>
  );
};