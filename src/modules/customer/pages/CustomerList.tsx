import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { useBranding } from '../../../contexts/BrandingContext';

interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  type: 'individual' | 'enterprise';
  status: 'active' | 'potential' | 'inactive';
  pipelineStage?: 'new' | 'contacting' | 'meeting' | 'negotiation' | 'won' | 'lost';
  notes?: string;
  createdAt: any;
}

const STAGES = {
  new: { id: 'new', label: 'Khách mới', color: 'bg-blue-100 text-blue-800' },
  contacting: { id: 'contacting', label: 'Đang tư vấn', color: 'bg-yellow-100 text-yellow-800' },
  meeting: { id: 'meeting', label: 'Hẹn gặp', color: 'bg-purple-100 text-purple-800' },
  negotiation: { id: 'negotiation', label: 'Thương lượng', color: 'bg-orange-100 text-orange-800' },
  won: { id: 'won', label: 'Chốt thành công', color: 'bg-green-100 text-green-800' },
  lost: { id: 'lost', label: 'Theo dõi sau', color: 'bg-slate-100 text-slate-800' }
};

const ManageCustomers: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId: brandingTenantId } = useBranding();

  // Logic fallback tenantId tương tự Dashboard để đảm bảo data load đúng
  const tenantId = brandingTenantId || userProfile?.tenantId;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to Kanban

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Drag & Drop state
  const [draggedItem, setDraggedItem] = useState<Customer | null>(null);

  // Appointment Modal State
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptData, setApptData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    title: '',
    notes: ''
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual',
    status: 'potential',
    pipelineStage: 'new',
    notes: ''
  });

  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'customers'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        pipelineStage: doc.data().pipelineStage || 'new' // Backfill default
      })) as Customer[];
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);
      return matchesSearch;
    });
  }, [customers, search]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, customer: Customer) => {
    setDraggedItem(customer);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: Set drag image or data
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.pipelineStage === stageId) return;

    // Optimistic Update
    const updatedCustomers = customers.map(c =>
      c.id === draggedItem.id ? { ...c, pipelineStage: stageId } : c
    );
    setCustomers(updatedCustomers as Customer[]);

    try {
      await updateDoc(doc(db, 'customers', draggedItem.id), {
        pipelineStage: stageId,
        updatedAt: serverTimestamp()
      });
      await createSystemLog('UPDATE', 'CUSTOMER', `Cập nhật trạng thái khách hàng: ${draggedItem.name} -> ${STAGES[stageId as keyof typeof STAGES].label}`, userProfile, 'low');
    } catch (err) {
      console.error("Failed to update stage:", err);
      // We could revert state here if needed, but Firestore realtime listener usually fixes it
    }
    setDraggedItem(null);
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setIsEdit(true);
      setSelectedId(customer.id);
      setFormData({
        name: customer.name,
        company: customer.company || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        type: customer.type || 'individual' as any,
        status: customer.status || 'potential' as any,
        pipelineStage: customer.pipelineStage || 'new',
        notes: customer.notes || ''
      });
    } else {
      setIsEdit(false);
      setSelectedId(null);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        type: 'individual',
        status: 'potential',
        pipelineStage: 'new',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && selectedId) {
        await updateDoc(doc(db, 'customers', selectedId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        await createSystemLog('UPDATE', 'CUSTOMER', `Cập nhật thông tin khách hàng: ${formData.name}`, userProfile, 'low');
      } else {
        await addDoc(collection(db, 'customers'), {
          ...formData,
          tenantId,
          createdAt: serverTimestamp()
        });
        await createSystemLog('CREATE', 'CUSTOMER', `Tạo hồ sơ khách mới: ${formData.name}`, userProfile, 'low');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Lỗi khi lưu khách hàng:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'customers', deleteTarget.id));
      await createSystemLog('DELETE', 'CUSTOMER', `Xóa khách hàng: ${deleteTarget.name}`, userProfile, 'medium');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
    }
  };

  const handleOpenApptModal = (customer: Customer) => {
    setSelectedId(customer.id); // reuse to track which customer
    setApptData({
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      title: `Hẹn gặp: ${customer.name}`,
      notes: ''
    });
    setShowApptModal(true);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    try {
      await addDoc(collection(db, 'appointments'), {
        ...apptData,
        relatedCustomerId: selectedId,
        tenantId,
        type: 'meeting',
        status: 'scheduled',
        createdAt: serverTimestamp()
      });

      // Update customer stage to 'meeting' if not already past that
      const customer = customers.find(c => c.id === selectedId);
      if (customer && customer.pipelineStage === 'new' || customer && customer.pipelineStage === 'contacting') {
        await updateDoc(doc(db, 'customers', selectedId), {
          pipelineStage: 'meeting',
          updatedAt: serverTimestamp()
        });
      }

      await createSystemLog('CREATE', 'APPOINTMENT', `Đặt lịch hẹn: ${apptData.title}`, userProfile, 'low');
      setShowApptModal(false);
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
  };

  // Drawer & Detail State
  const [showDrawer, setShowDrawer] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    orders: any[];
    inquiries: any[];
    activities: any[];
    docs: any[];
  }>({ orders: [], inquiries: [], activities: [], docs: [] });
  const [newNote, setNewNote] = useState('');

  // Fetch Detail Data when Drawer Opens
  useEffect(() => {
    if (!selectedId || !showDrawer) return;

    const fetchDetails = async () => {
      setDetailLoading(true);
      try {
        const customer = customers.find(c => c.id === selectedId);
        if (!customer) return;

        // 1. Orders
        const ordersRef = collection(db, 'orders');
        const qOrders = query(ordersRef, where('client.phone', '==', customer.phone));
        const ordersSnap = await getDocs(qOrders);
        const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Inquiries
        const inquiriesRef = collection(db, 'inquiries');
        const qInquiries = query(inquiriesRef, where('phone', '==', customer.phone));
        const inqSnap = await getDocs(qInquiries);
        const inqData = inqSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 3. Activities
        const actsRef = collection(db, 'customers', selectedId, 'activities');
        const qActs = query(actsRef, orderBy('createdAt', 'desc'));
        const actsSnap = await onSnapshot(qActs, (snap) => {
          setDetailData(prev => ({ ...prev, activities: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
        });

        // 4. Docs
        const docsRef = collection(db, 'customers', selectedId, 'documents');
        const qDocs = query(docsRef, orderBy('createdAt', 'desc'));
        const docsSnap = await getDocs(qDocs);
        const docsData = docsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setDetailData(prev => ({
          ...prev,
          orders: ordersData,
          inquiries: inqData,
          docs: docsData
        }));

        // Return unsubscribe for realtime listeners if we kept them, but here we mixed one-shot and realtime. 
        // For simplicity in this function scope we just used onSnapshot for activities but didn't assign cleanup. 
        // Let's stick to simple fetching for now to avoid leaks in this effect structure.

      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetails();
  }, [selectedId, showDrawer, customers]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedId) return;
    try {
      await addDoc(collection(db, 'customers', selectedId, 'activities'), {
        type: 'note',
        content: newNote,
        createdBy: userProfile?.fullName || 'Admin',
        tenantId,
        createdAt: serverTimestamp()
      });
      setNewNote('');
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const openDrawer = (customer: Customer) => {
    setSelectedId(customer.id);
    setShowDrawer(true);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1700px] mx-auto space-y-6 text-left h-[calc(100vh-80px)] flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-primary font-display tracking-tight uppercase">QUẢN LÝ LEAD</h2>
          <p className="text-slate-500 text-sm font-medium">Theo dõi hành trình khách hàng và cơ hội bán hàng.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">list</span> Danh sách
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">view_kanban</span> Board
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="h-10 px-6 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> Thêm mới
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative shrink-0 max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng..."
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white font-medium shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content Area */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex h-full gap-5 pb-2 min-w-max">
            {Object.entries(STAGES).map(([key, stage]) => (
              <div
                key={key}
                className="w-80 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200/60 max-h-full backdrop-blur-sm"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, key)}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl ${stage.color.split(' ')[0]} bg-opacity-20`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${stage.color.split(' ')[1]}`}>{stage.label}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-slate-600 shadow-sm border border-slate-100">
                      {filteredCustomers.filter(c => (c.pipelineStage || 'new') === key).length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-sm">more_horiz</span></button>
                </div>

                {/* Draggable Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar scroll-smooth">
                  {filteredCustomers.filter(c => (c.pipelineStage || 'new') === key).map(customer => (
                    <div
                      key={customer.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, customer)}
                      onClick={() => openDrawer(customer)}
                      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{customer.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">{customer.company || 'Cá nhân'}</p>
                        </div>
                        {customer.type === 'enterprise' && <span className="material-symbols-outlined text-amber-500 text-sm" title="Doanh nghiệp">business</span>}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                          <span>{customer.phone || '---'}</span>
                        </div>
                        {customer.notes && (
                          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg leading-relaxed">
                            <span className="material-symbols-outlined text-[12px] mt-0.5">sticky_note_2</span>
                            <span className="line-clamp-2">{customer.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions (Hover) */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${customer.phone}`; }}
                          className="flex-1 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wide border border-emerald-100"
                          title="Gọi điện"
                        >
                          <span className="material-symbols-outlined text-sm">call</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenApptModal(customer); }}
                          className="flex-1 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center gap-1 hover:bg-purple-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wide border border-purple-100"
                          title="Đặt lịch hẹn"
                        >
                          <span className="material-symbols-outlined text-sm">event</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(customer); }} className="size-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Add Button */}
                <button
                  onClick={() => { setFormData({ ...formData, pipelineStage: key }); setShowModal(true); }}
                  className="m-2 p-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-white hover:text-primary hover:shadow-sm border border-transparent hover:border-slate-100 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Thêm thẻ
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 mx-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Giai đoạn</th>
                  <th className="px-6 py-4 hidden md:table-cell">Ghi chú</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} onClick={() => openDrawer(customer)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{customer.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">{customer.company || '---'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span className="material-symbols-outlined text-sm text-slate-400">mail</span> {customer.email || '---'}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span className="material-symbols-outlined text-sm text-slate-400">call</span> {customer.phone || '---'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STAGES[customer.pipelineStage as keyof typeof STAGES]?.color || 'bg-slate-100 text-slate-600 border-slate-200'} bg-opacity-50`}>
                        {STAGES[customer.pipelineStage as keyof typeof STAGES]?.label || 'Mới'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs hidden md:table-cell">
                      <p className="truncate text-slate-500 text-xs">{customer.notes || '---'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(customer); }} className="size-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-primary hover:text-primary flex items-center justify-center transition-all shadow-sm">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(customer); setShowDeleteModal(true); }} className="size-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-rose-500 hover:text-rose-500 flex items-center justify-center transition-all shadow-sm">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360 Profile Drawer */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ${showDrawer ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${showDrawer ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setShowDrawer(false)}
        ></div>

        {/* Drawer Content */}
        <div className={`absolute top-2 bottom-2 right-2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ${showDrawer ? 'translate-x-0' : 'translate-x-[110%]'}`}>
          {selectedId && customers.find(c => c.id === selectedId) && (
            <>
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-primary font-display">{customers.find(c => c.id === selectedId)?.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${STAGES[customers.find(c => c.id === selectedId)?.pipelineStage as keyof typeof STAGES]?.color}`}>
                      {STAGES[customers.find(c => c.id === selectedId)?.pipelineStage as keyof typeof STAGES]?.label}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">{customers.find(c => c.id === selectedId)?.company || 'Khách hàng cá nhân'} • {customers.find(c => c.id === selectedId)?.phone}</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="size-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              {/* Drawer Actions */}
              <div className="grid grid-cols-4 gap-2 px-6 py-4 border-b border-slate-100">
                <a href={`tel:${customers.find(c => c.id === selectedId)?.phone}`} className="flex flex-col items-center gap-1 group">
                  <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all border border-emerald-100">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gọi</span>
                </a>
                <a href={`mailto:${customers.find(c => c.id === selectedId)?.email}`} className="flex flex-col items-center gap-1 group">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all border border-blue-100">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email</span>
                </a>
                <button onClick={() => customers.find(c => c.id === selectedId) && handleOpenApptModal(customers.find(c => c.id === selectedId)!)} className="flex flex-col items-center gap-1 group">
                  <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all border border-purple-100">
                    <span className="material-symbols-outlined">event</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Lịch Hẹn</span>
                </button>
                <button onClick={() => customers.find(c => c.id === selectedId) && handleOpenModal(customers.find(c => c.id === selectedId)!)} className="flex flex-col items-center gap-1 group">
                  <div className="size-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all border border-slate-200">
                    <span className="material-symbols-outlined">edit</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sửa</span>
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Notes Area */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ghi chú nhanh</h4>
                  <div className="flex gap-2">
                    <input
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Nhập ghi chú..."
                      className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none"
                    />
                    <button onClick={handleAddNote} className="size-10 rounded-lg bg-white border border-slate-200 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Hoạt động gần đây</h4>
                  <div className="space-y-4 relative pl-2">
                    {/* Line */}
                    <div className="absolute left-[5px] top-2 bottom-0 w-0.5 bg-slate-100"></div>

                    {detailLoading ? (
                      <p className="text-xs text-slate-400 pl-6">Đang tải lịch sử...</p>
                    ) : detailData.activities.length > 0 ? (
                      detailData.activities.map((act) => (
                        <div key={act.id} className="relative pl-6 animate-in fade-in slide-in-from-bottom-2">
                          <div className="absolute left-0 top-1.5 size-2.5 rounded-full bg-white border-2 border-primary z-10"></div>
                          <p className="text-xs font-bold text-slate-700">{act.content}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{act.createdAt?.toDate ? act.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'} • {act.createdBy}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 pl-6 italic">Chưa có hoạt động nào.</p>
                    )}
                  </div>
                </div>

                {/* Orders Stub */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Đơn hàng ({detailData.orders.length})</h4>
                  {detailData.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 mb-2 border border-slate-100">
                      <div>
                        <p className="font-bold text-xs text-primary">#{o.orderId || o.id.substr(0, 6)}</p>
                        <p className="text-[10px] text-slate-500">{o.type}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total || 0)}</span>
                    </div>
                  ))}
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit/Create Modal (Keep Existing) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-primary mb-6">{isEdit ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ tên *</label>
                  <input required type="text" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                  <input required type="tel" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giai đoạn</label>
                  <select className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-bold bg-white" value={formData.pipelineStage} onChange={e => setFormData({ ...formData, pipelineStage: e.target.value })}>
                    {Object.entries(STAGES).map(([key, stage]) => (
                      <option key={key} value={key}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input type="email" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-bold" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú</label>
                <textarea rows={3} className="w-full p-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-medium resize-none" placeholder="Nhu cầu, ngân sách..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50">Hủy bỏ</button>
                <button type="submit" className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowApptModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">event</span>
              </div>
              <h3 className="text-xl font-bold text-primary">Đặt lịch hẹn</h3>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiêu đề</label>
                <input required type="text" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold" value={apptData.title} onChange={e => setApptData({ ...apptData, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày</label>
                  <input required type="date" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold" value={apptData.date} onChange={e => setApptData({ ...apptData, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giờ</label>
                  <input required type="time" className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold" value={apptData.time} onChange={e => setApptData({ ...apptData, time: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú</label>
                <textarea rows={2} className="w-full p-4 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-medium resize-none" placeholder="Địa điểm, nội dung..." value={apptData.notes} onChange={e => setApptData({ ...apptData, notes: e.target.value })}></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowApptModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50">Hủy</button>
                <button type="submit" className="flex-1 h-11 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/20 hover:bg-purple-700">Lên lịch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
            <div className="size-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 text-sm mb-6">Bạn có chắc muốn xóa khách hàng <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 h-10 rounded-lg border border-slate-200 font-bold text-slate-500">Hủy</button>
              <button onClick={handleDelete} className="flex-1 h-10 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600">Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;
