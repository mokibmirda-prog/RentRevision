'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, CreditCard, MessageSquare, 
  Info, Calculator, LogOut, Plus, Search, 
  TrendingUp, Users2, Wallet, AlertCircle, Bell,
  ChevronRight, MoreVertical, CheckCircle2, Clock,
  User, ShieldCheck, Building2, Trash2, Edit2, X
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare },
  { id: 'calculator', label: 'Tools', icon: Calculator },
  { id: 'info', label: 'Building', icon: Info },
];

export default function AdminDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [note, setNote] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending').length;

  useEffect(() => {
    if (!user) return;

    const savedNote = localStorage.getItem('admin_note');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedNote) setNote(savedNote);

    // Real-time tenants
    const qTenants = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubTenants = onSnapshot(qTenants, (snapshot) => {
      const tenantList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.role === 'tenant');
      setTenants(tenantList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    // Real-time payments
    const qPayments = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const paymentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));

    // Real-time complaints
    const qComplaints = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      const complaintList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(complaintList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'complaints'));

    return () => {
      unsubTenants();
      unsubPayments();
      unsubComplaints();
    };
  }, [user]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    localStorage.setItem('admin_note', e.target.value);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <TrendingUp className="text-slate-950 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Rent Revision</h2>
        </div>

        <nav className="flex-1 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative ${
                activeTab === tab.id 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.id === 'complaints' && pendingComplaintsCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg"
                >
                  {pendingComplaintsCount}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-cyan-400 font-bold">RM</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto max-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-slate-400 mt-1">Welcome back, Rafi. Here&apos;s what&apos;s happening today.</p>
          </div>
          <div className="flex items-center gap-3 relative">
            <button className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="bg-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Action
            </button>

            <AnimatePresence>
              {showQuickActions && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowQuickActions(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-4 w-56 bg-slate-900 border border-white/10 rounded-3xl p-3 shadow-2xl z-40 backdrop-blur-xl"
                  >
                    <button 
                      onClick={() => { setActiveTab('tenants'); setShowQuickActions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <Users className="w-4 h-4 text-blue-400" />
                      Add Resident
                    </button>
                    <button 
                      onClick={() => { setActiveTab('payments'); setShowQuickActions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Record Payment
                    </button>
                    <button 
                      onClick={() => { setActiveTab('complaints'); setShowQuickActions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-orange-400" />
                      New Complaint
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <Overview key="overview" tenants={tenants} payments={payments} />}
          {activeTab === 'tenants' && <Tenants key="tenants" tenants={tenants} />}
          {activeTab === 'payments' && <Payments key="payments" payments={payments} tenants={tenants} />}
          {activeTab === 'complaints' && <Complaints key="complaints" complaints={complaints} />}
          {activeTab === 'calculator' && <Tools key="tools" note={note} onNoteChange={handleNoteChange} />}
          {activeTab === 'info' && <BuildingInfo key="info" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Overview({ tenants, payments }: { tenants: any[], payments: any[] }) {
  const totalResidents = tenants.length;
  const expectedRent = tenants.reduce((acc, t) => acc + (Number(t.rent) || 0), 0);
  
  // Calculate collected rent for the current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const collectedRent = payments
    .filter(p => p.month === currentMonth)
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    
  const outstandingRent = expectedRent - collectedRent;

  const stats = [
    { label: 'Total Residents', value: totalResidents.toString(), icon: Users2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Expected Rent', value: `AED ${expectedRent.toLocaleString()}`, icon: Wallet, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Outstanding', value: `AED ${outstandingRent.toLocaleString()}`, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Collected', value: `AED ${collectedRent.toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (AED)',
      data: [45000, 48000, 52000, 51000, 55000, collectedRent || 58000],
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34, 211, 238, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* AI Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 p-6 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <TrendingUp className="w-24 h-24 text-cyan-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">AI Financial Advisor</span>
          </div>
          <p className="text-lg font-medium text-white max-w-2xl">
            {outstandingRent > 0 
              ? `You have AED ${outstandingRent.toLocaleString()} in outstanding rent. I recommend sending automated reminders to ${tenants.length} residents.`
              : "All rent for this month has been collected. Excellent management!"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl">
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6">Monthly Revenue</h3>
          <div className="h-[300px]">
            <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }} />
          </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6">Occupancy Rate</h3>
          <div className="flex items-center justify-center h-[300px]">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" 
                  strokeDasharray={552.92}
                  strokeDashoffset={552.92 * (1 - totalResidents/20)}
                  className="text-cyan-500" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{Math.round((totalResidents/20) * 100)}%</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Occupied</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Tenants({ tenants }: { tenants: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', unit: '', rent: '', phone: '', email: '', password: '' });
  const [search, setSearch] = useState('');

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.unit?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await updateDoc(doc(db, 'users', editingTenant.id), {
          ...formData,
          rent: Number(formData.rent)
        });
      } else {
        await addDoc(collection(db, 'users'), {
          ...formData,
          rent: Number(formData.rent),
          role: 'tenant',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingTenant(null);
      setFormData({ name: '', unit: '', rent: '', phone: '', email: '', password: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this resident?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'users');
      }
    }
  };

  const openEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setFormData({ 
      name: tenant.name, 
      unit: tenant.unit || '', 
      rent: tenant.rent?.toString() || '', 
      phone: tenant.phone || '', 
      email: tenant.email || '',
      password: tenant.password || ''
    });
    setIsModalOpen(true);
  };

  const handleAutoRemind = (tenant: any) => {
    const message = `Dear ${tenant.name}, this is a reminder from Rent Revision Pro. Your rent for Al Khaleej Building (Unit ${tenant.unit}) is due. Please clear it within the first 5 days. Bank: Mashreq, A/C: 019010267864. Thank you!`;
    alert(`AI Generated Reminder for ${tenant.name}:\n\n${message}\n\n(In a real app, this would be sent via SMS/WhatsApp)`);
  };

  const handleMarkPaid = async (tenant: any) => {
    const month = new Date().toISOString().slice(0, 7);
    try {
      await addDoc(collection(db, 'payments'), {
        tenantId: tenant.id,
        tenantName: tenant.name,
        unit: tenant.unit,
        amount: tenant.rent,
        month,
        date: serverTimestamp(),
        status: 'paid'
      });
      alert(`Payment recorded for ${tenant.name} for ${month}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search residents..."
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <button 
            onClick={() => { setEditingTenant(null); setFormData({ name: '', unit: '', rent: '', phone: '', email: '', password: '' }); setIsModalOpen(true); }}
            className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-2xl hover:bg-cyan-400 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Resident
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-8 py-6 font-medium">Resident</th>
                <th className="px-8 py-6 font-medium">Unit</th>
                <th className="px-8 py-6 font-medium">Rent</th>
                <th className="px-8 py-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-cyan-400 font-bold">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-slate-500">{tenant.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-400">{tenant.unit || 'N/A'}</td>
                  <td className="px-8 py-6 font-mono">AED {tenant.rent || 0}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAutoRemind(tenant)}
                        title="AI Auto-Remind"
                        className="p-2 hover:bg-white/5 rounded-lg text-amber-400 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleMarkPaid(tenant)}
                        title="Mark Paid"
                        className="p-2 hover:bg-white/5 rounded-lg text-emerald-400 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEdit(tenant)}
                        className="p-2 hover:bg-white/5 rounded-lg text-cyan-400 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(tenant.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{editingTenant ? 'Edit Resident' : 'Add New Resident'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Unit Number</label>
                    <input 
                      required
                      type="text" 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Monthly Rent (AED)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.rent}
                      onChange={(e) => setFormData({...formData, rent: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Login Password</label>
                    <input 
                      required
                      type="text" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="e.g. resident123"
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-cyan-500 text-slate-950 font-bold py-4 rounded-2xl mt-4 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  {editingTenant ? 'Update Resident' : 'Add Resident'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Payments({ payments, tenants }: { payments: any[], tenants: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ tenantId: '', amount: '', month: new Date().toISOString().slice(0, 7) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'payments'), {
        ...formData,
        amount: Number(formData.amount),
        date: serverTimestamp(),
        status: 'paid'
      });
      setIsModalOpen(false);
      setFormData({ tenantId: '', amount: '', month: new Date().toISOString().slice(0, 7) });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payments');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Payment History</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-2xl hover:bg-cyan-400 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Payment
          </button>
        </div>
        
        {payments.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-8 py-6 font-medium">Resident</th>
                  <th className="px-8 py-6 font-medium">Month</th>
                  <th className="px-8 py-6 font-medium">Amount</th>
                  <th className="px-8 py-6 font-medium">Date</th>
                  <th className="px-8 py-6 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => {
                  const tenant = tenants.find(t => t.id === payment.tenantId);
                  return (
                    <tr key={payment.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-medium text-white">{tenant?.name || 'Unknown Resident'}</td>
                      <td className="px-8 py-6 text-slate-400">{payment.month}</td>
                      <td className="px-8 py-6 font-mono text-cyan-400">AED {payment.amount}</td>
                      <td className="px-8 py-6 text-slate-500 text-sm">
                        {payment.date?.toDate ? payment.date.toDate().toLocaleDateString() : 'Pending'}
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-emerald-400/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Record Payment</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Resident</label>
                  <select 
                    required
                    value={formData.tenantId}
                    onChange={(e) => {
                      const t = tenants.find(t => t.id === e.target.value);
                      setFormData({...formData, tenantId: e.target.value, amount: t?.rent?.toString() || ''});
                    }}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                  >
                    <option value="">Select a resident</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Unit {t.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Amount (AED)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Billing Month</label>
                    <input 
                      required
                      type="month" 
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-cyan-500 text-slate-950 font-bold py-4 rounded-2xl mt-4 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  Confirm Payment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Complaints({ complaints }: { complaints: any[] }) {
  const [filter, setFilter] = useState('all');

  const filteredComplaints = complaints.filter(c => 
    filter === 'all' ? true : c.status === filter
  );

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'complaints');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'in-progress', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === s 
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                : 'bg-slate-900/50 text-slate-400 border border-white/5 hover:border-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-[2.5rem] border border-white/5">
            <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No maintenance requests found.</p>
          </div>
        ) : (
          filteredComplaints.map((complaint) => (
            <motion.div 
              key={complaint.id}
              layout
              className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  complaint.status === 'resolved' ? 'bg-emerald-400/10 text-emerald-400' :
                  complaint.status === 'in-progress' ? 'bg-amber-400/10 text-amber-400' :
                  'bg-rose-400/10 text-rose-400'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-white">{complaint.title || 'Maintenance Request'}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      complaint.status === 'resolved' ? 'bg-emerald-400/10 text-emerald-400' :
                      complaint.status === 'in-progress' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-rose-400/10 text-rose-400'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{complaint.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users2 className="w-3 h-3" /> Unit {complaint.unit || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {complaint.createdAt?.toDate ? complaint.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {complaint.status !== 'resolved' && (
                  <button 
                    onClick={() => handleStatusUpdate(complaint.id, complaint.status === 'pending' ? 'in-progress' : 'resolved')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {complaint.status === 'pending' ? 'Start Work' : 'Mark Resolved'}
                  </button>
                )}
                <button className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function Tools({ note, onNoteChange }: { note: string, onNoteChange: (e: any) => void }) {
  const [calc, setCalc] = useState('');
  const [result, setResult] = useState('');

  const handleCalc = (val: string) => {
    if (val === '=') {
      try {
        // Safer alternative to eval for simple math
        const sanitized = calc.replace(/[^-()\d/*+.]/g, '');
        const res = new Function(`return ${sanitized}`)();
        setResult(res.toString());
      } catch {
        setResult('Error');
      }
    } else if (val === 'C') {
      setCalc('');
      setResult('');
    } else {
      setCalc(prev => prev + val);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      {/* Calculator */}
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          Quick Calculator
        </h3>
        <div className="bg-slate-950 p-6 rounded-2xl mb-6 text-right">
          <p className="text-slate-500 text-sm h-6">{calc}</p>
          <p className="text-3xl font-mono font-bold text-cyan-400 h-10">{result || '0'}</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'].map((btn) => (
            <button 
              key={btn}
              onClick={() => handleCalc(btn)}
              className={`py-4 rounded-xl font-bold text-lg transition-all active:scale-90 ${
                btn === '=' ? 'bg-cyan-500 text-slate-950 col-span-2' : 
                btn === 'C' ? 'bg-red-500/20 text-red-400' :
                ['/','*','-','+'].includes(btn) ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Notebook */}
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] flex flex-col">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-cyan-400" />
          Admin Notebook
        </h3>
        <textarea 
          value={note}
          onChange={onNoteChange}
          placeholder="Jot down quick notes, reminders, or rent updates..."
          className="flex-1 bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none min-h-[300px]"
        />
        <p className="text-xs text-slate-500 mt-4 italic">Auto-saves to your local browser storage.</p>
      </div>
    </motion.div>
  );
}

function BuildingInfo() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <div className="space-y-8">
        <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
            <Building2 className="w-5 h-5" />
            Building Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">Name</span>
              <span className="font-medium text-white">Al Khaleej Building</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-slate-400">Location</span>
              <span className="font-medium text-white text-right">Al Muraqqabat, Deira, Dubai</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-400">Total Units</span>
              <span className="font-medium text-white">48 Units</span>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400">
            <Users className="w-5 h-5" />
            Contact Directory
          </h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Owner</p>
                <p className="font-bold">MD AMRANUL HOQ</p>
                <p className="text-xs text-blue-400">+971 52 152 0338</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">In-Charge</p>
                <p className="font-bold">MD RAFI-AL MOKIB</p>
                <p className="text-xs text-cyan-400">0564436581</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-400">
            <CreditCard className="w-5 h-5" />
            Bank Account Details
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account No.</p>
                <p className="font-mono text-sm">019010267864</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IBAN</p>
                <p className="font-mono text-[10px] break-all">AE090330000019010267864</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            Building Rules
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
      </div>
    </motion.div>
  );
}
