'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, MessageSquare, CreditCard, Info, 
  LogOut, Send, User, Building, Wallet, 
  CheckCircle2, Clock, AlertTriangle, Download, X
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import AiAssistant from './AiAssistant';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'ai', label: 'JARVIS', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
  { id: 'info', label: 'Building', icon: Info },
];

export default function TenantPortal({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payments, setPayments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    if (!user.uid) return;

    // Real-time payments for this tenant
    const qPayments = query(
      collection(db, 'payments'), 
      where('tenantId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));

    // Real-time complaints for this tenant
    const qComplaints = query(
      collection(db, 'complaints'), 
      where('tenantId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'complaints'));

    return () => {
      unsubPayments();
      unsubComplaints();
    };
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
              <Home className="text-cyan-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome home, {user.name.split(' ')[0]}</h1>
              <p className="text-slate-400 text-sm">Al Khaleej Building • Unit {user.unit || 'Pending'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <TenantDashboard key="dashboard" user={user} payments={payments} setActiveTab={setActiveTab} />}
          {activeTab === 'ai' && <AiAssistant key="ai" user={user} />}
          {activeTab === 'payments' && <TenantPayments key="payments" payments={payments} />}
          {activeTab === 'complaints' && <TenantComplaints key="complaints" user={user} complaints={complaints} />}
          {activeTab === 'info' && <TenantBuildingInfo key="info" />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Mobile Friendly) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] flex items-center gap-1 shadow-2xl z-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all ${
              activeTab === tab.id 
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="hidden md:inline text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function TenantDashboard({ user, payments, setActiveTab }: { user: any, payments: any[], setActiveTab: (t: string) => void }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isPaid = payments.some(p => p.month === currentMonth);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Rent Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="w-32 h-32 text-cyan-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              isPaid 
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                : 'bg-rose-400/10 text-rose-400 border-rose-400/20'
            }`}>
              {isPaid ? `Paid • ${new Date().toLocaleString('default', { month: 'long' })}` : 'Unpaid • Action Required'}
            </span>
            <p className="text-slate-400 text-sm">Due Date: 05 {new Date().toLocaleString('default', { month: 'short' })}</p>
          </div>
          <p className="text-slate-400 font-medium">Monthly Rent</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-5xl font-bold tracking-tight">AED {user.rent || '0'}</h2>
            <span className="text-slate-500">/ month</span>
          </div>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => setActiveTab('payments')}
              className="flex-1 bg-white text-slate-950 font-bold py-4 rounded-2xl transition-all active:scale-95"
            >
              View Receipts
            </button>
            {!isPaid && (
              <button 
                onClick={() => setActiveTab('info')}
                className="flex-1 bg-cyan-500 text-slate-950 font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
              >
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => setActiveTab('complaints')}
          className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/[0.03] transition-all cursor-pointer"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <p className="font-bold">Report Issue</p>
            <p className="text-xs text-slate-500">Maintenance or repairs</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/[0.03] transition-all cursor-pointer">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <p className="font-bold">Lease Contract</p>
            <p className="text-xs text-slate-500">Download PDF copy</p>
          </div>
        </div>
      </div>

      {/* JARVIS Promo */}
      <div 
        onClick={() => setActiveTab('ai')}
        className="bg-cyan-500/5 border border-cyan-500/20 p-6 rounded-3xl flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <MessageSquare className="text-slate-950 w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-cyan-400">Need help?</p>
            <p className="text-xs text-slate-400">Ask JARVIS, your building concierge.</p>
          </div>
        </div>
        <button className="text-cyan-400 text-sm font-bold hover:underline">Chat Now</button>
      </div>
    </motion.div>
  );
}

function TenantPayments({ payments }: { payments: any[] }) {
  const handleDownloadReceipt = (payment: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Rent Receipt - ${payment.month}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .receipt { border: 2px solid #eee; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; }
            .details { margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { color: #666; }
            .value { font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">Rent Revision Pro</div>
              <div style="text-align: right">
                <div style="font-weight: bold">OFFICIAL RECEIPT</div>
                <div style="font-size: 12px; color: #666">#${payment.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
            <div class="details">
              <div class="row"><span class="label">Resident Name:</span><span class="value">${payment.tenantName}</span></div>
              <div class="row"><span class="label">Unit Number:</span><span class="value">${payment.unit}</span></div>
              <div class="row"><span class="label">Building:</span><span class="value">Al Khaleej Building</span></div>
              <div class="row"><span class="label">Rent Month:</span><span class="value">${payment.month}</span></div>
              <div class="row"><span class="label">Payment Date:</span><span class="value">${payment.date?.toDate ? payment.date.toDate().toLocaleDateString() : 'N/A'}</span></div>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <div class="row" style="font-size: 20px;">
                <span class="label">Amount Paid:</span>
                <span class="value" style="color: #059669">AED ${payment.amount}</span>
              </div>
            </div>
            <div class="footer">
              <p>This is a computer-generated receipt. No signature required.</p>
              <p>Al Muraqqabat, Deira, Dubai | +971 564436581</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; background: #06b6d4; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">Print Receipt</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5">
          <h3 className="text-xl font-bold">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-20 text-center">
            <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {payments.map((item, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">{item.month}</p>
                    <p className="text-xs text-slate-500">Paid on {item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'Pending'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono font-bold">AED {item.amount}</p>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Success</span>
                  </div>
                  <button 
                    onClick={() => handleDownloadReceipt(item)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                    title="Download Receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TenantComplaints({ user, complaints }: { user: any, complaints: any[] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        tenantId: user.uid,
        tenantName: user.name,
        unit: user.unit || 'N/A',
        title,
        description,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setTitle('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'complaints');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-bold mb-6">Submit a Complaint</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Subject</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AC not working"
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-[150px]"
            />
          </div>
          <button 
            disabled={isSubmitting}
            className="w-full bg-cyan-500 text-slate-950 font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {complaints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold px-4">My Requests</h3>
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{c.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                    c.status === 'resolved' ? 'bg-emerald-400/10 text-emerald-400' :
                    c.status === 'in-progress' ? 'bg-amber-400/10 text-amber-400' :
                    'bg-rose-400/10 text-rose-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{c.description}</p>
                <p className="text-[10px] text-slate-500">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TenantBuildingInfo() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
          <Info className="w-5 h-5" />
          Building & Contact
        </h3>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-cyan-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Building In-Charge</p>
              <p className="font-bold">MD RAFI-AL MOKIB</p>
              <p className="text-xs text-cyan-400">0564436581</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Security</p>
              <p className="font-bold">MD IBRAHIM</p>
              <p className="text-xs text-blue-400">0557463043</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-400">
          <CreditCard className="w-5 h-5" />
          Rent Payment Details
        </h3>
        <div className="bg-slate-950/50 p-6 rounded-2xl space-y-4 border border-emerald-400/20">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account Holder</p>
            <p className="font-bold text-white">Mohammed Amranul Hoq</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bank Name</p>
            <p className="font-bold text-white">Mashreq Bank</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IBAN</p>
            <p className="font-mono text-xs break-all">AE090330000019010267864</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
          <AlertTriangle className="text-red-400 w-5 h-5" />
          Resident Rules
        </h3>
        <ul className="space-y-4">
          {[
            "Rent must be cleared within the first 5 days of every month.",
            "Do not leave trash bags in the corridors.",
            "Avoid loud music and noise after 10:00 PM.",
            "Keep the main entrance doors closed.",
            "Report any issues to the In-Charge immediately."
          ].map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="text-red-400 font-bold">•</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </motion.div>
  );
}
