import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, doc, getDoc, getDocs, addDoc, serverTimestamp, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { createSystemLog } from '../../../services/Logger';

// --- Types ---
type OrderStatus = 'new' | 'confirmed' | 'in_progress' | 'sample_done' | 'delivered' | 'completed' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';
type OrderType = 'real_estate' | 'research' | 'formulation' | 'consulting';

const parsePrice = (priceStr: string): number => {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  const cleanStr = priceStr.toLowerCase().replace(/,/g, '.');
  let multiplier = 1;
  if (cleanStr.includes('tỷ')) multiplier = 1000000000;
  else if (cleanStr.includes('triệu')) multiplier = 1000000;

  const num = parseFloat(cleanStr.replace(/[^0-9.]/g, ''));
  return num ? num * multiplier : 0;
};

interface OrderLog {
  date: string;
  status: OrderStatus;
  content: string;
  author: string;
  timestamp?: number;
}

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
}

interface Property {
  id: string;
  title: string;
  price: string;
  status: string;
}

interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  company: string;
  interest: string;
}

const statusLabels: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  new: { label: 'Mới Tạo', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: 'nest_mini' },
  confirmed: { label: 'Đã Chốt Cọc', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: 'check_circle' },
  in_progress: { label: 'Đang Xử Lý', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: 'biotech' },
  sample_done: { label: 'Đã Xong HS', color: 'bg-cyan-50 text-cyan-600 border-cyan-100', icon: 'science' },
  delivered: { label: 'Đã Bàn Giao', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: 'local_shipping' },
  completed: { label: 'Hoàn Tất', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: 'task_alt' },
  cancelled: { label: 'Hủy Bỏ', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: 'cancel' },
};

const CreateOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [orderId, setOrderId] = useState('HD-' + Math.floor(Math.random() * 90000 + 10000));
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<OrderType>('real_estate');
  const [client, setClient] = useState({ name: '', phone: '', email: '', company: '', address: '' });
  const [status, setStatus] = useState<OrderStatus>('new');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ id: '1', description: '', quantity: 1, unitPrice: 0 }]);
  const [vatRate, setVatRate] = useState(0);

  const [commissionRate, setCommissionRate] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [logContent, setLogContent] = useState('');

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [items]);
  const vatAmount = useMemo(() => subtotal * (vatRate / 100), [subtotal, vatRate]);
  const total = useMemo(() => subtotal + vatAmount - discountAmount, [subtotal, vatAmount, discountAmount]);

  useEffect(() => {
    if (commissionRate > 0) {
      setCommissionAmount(subtotal * (commissionRate / 100));
    }
  }, [subtotal, commissionRate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prePropertyId = params.get('propertyId');
    if (prePropertyId) {
      setType('real_estate');
      setSelectedPropertyId(prePropertyId);
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedPropertyId && availableProperties.length > 0) {
      const prop = availableProperties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setItems([{
          id: 'prop-1',
          description: `Bán BĐS: ${prop.title}`,
          quantity: 1,
          unitPrice: parsePrice(prop.price)
        }]);
      }
    }
  }, [selectedPropertyId, availableProperties]);

  const suggestions = useMemo(() => {
    if (!client.name || client.name.length < 2) return [];
    return allCustomers.filter(c =>
      c.name.toLowerCase().includes(client.name.toLowerCase()) || c.phone.includes(client.name)
    ).slice(0, 5);
  }, [client.name, allCustomers]);

  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;
      try {
        const [custSnap, inqSnap, propSnap] = await Promise.all([
          getDocs(query(collection(db, 'customers'), where('tenantId', '==', tenantId))),
          getDocs(query(collection(db, 'inquiries'), where('tenantId', '==', tenantId))),
          getDocs(query(collection(db, 'properties'), where('tenantId', '==', tenantId)))
        ]);
        setAllCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
        setAllInquiries(inqSnap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry)));
        setAvailableProperties(propSnap.docs.map(d => ({ id: d.id, ...d.data() } as Property)));
      } catch (err) { console.error("Error fetching dependencies:", err); }
    };

    fetchData();

    if (isEdit) {
      const fetchOrder = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'orders', id!));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (tenantId && data.tenantId && data.tenantId !== tenantId) {
              alert("Bạn không có quyền truy cập đơn hàng này.");
              navigate('/manage-orders');
              return;
            }
            setOrderId(data.orderId || '');
            setOrderDate(data.orderDate || (data.createdAt?.toDate?.().toISOString().split('T')[0]));
            setType(data.type || 'real_estate');
            setClient(data.client || { name: '', phone: '', email: '', company: '', address: '' });
            setStatus(data.status || 'new');
            setPaymentStatus(data.paymentStatus || 'unpaid');
            setAssignedTo(data.assignedTo || '');
            setNotes(data.notes || '');
            setItems(data.items || []);
            setVatRate(data.vat?.rate || 0);
            if (data.propertyId) setSelectedPropertyId(data.propertyId);
            setCommissionRate(data.commission?.rate || 0);
            setCommissionAmount(data.commission?.amount || 0);
            setDiscountAmount(data.discount?.amount || 0);
            setOrderLogs(data.orderLogs || []);
          }
        } catch (err) { setError('Không thể tải thông tin đơn hàng.'); }
        finally { setLoading(false); }
      };
      fetchOrder();
    } else if (userProfile?.fullName) {
      setAssignedTo(userProfile.fullName);
    }
  }, [id, isEdit, userProfile, tenantId, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddLog = async () => {
    if (!logContent.trim() || !isEdit) return;
    const newEntry: OrderLog = {
      date: new Date().toLocaleString('vi-VN'),
      status: status,
      content: logContent.trim(),
      author: userProfile?.fullName || 'Anonymous',
      timestamp: Date.now()
    };
    setSaving(true);
    try {
      await updateDoc(doc(db, 'orders', id!), {
        orderLogs: arrayUnion(newEntry),
        status: status,
        updatedAt: serverTimestamp()
      });
      setOrderLogs(prev => [...prev, newEntry]);
      setLogContent('');
      await createSystemLog('UPDATE', 'ORDER', `Thêm nhật ký xử lý cho đơn hàng ${orderId}`, userProfile, 'low');
    } catch (e) { alert("Lỗi khi cập nhật nhật ký."); }
    finally { setSaving(false); }
  };

  const handleSave = async (payFull: boolean = false) => {
    if (!client.name || !client.phone || !client.address) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const logEntry: OrderLog = {
        date: new Date().toLocaleString('vi-VN'),
        status: payFull ? 'confirmed' : status,
        content: isEdit ? `Cập nhật thông tin đơn hàng${payFull ? ' & Thanh toán' : ''}` : 'Khởi tạo đơn hàng mới',
        author: userProfile?.fullName || 'System',
        timestamp: Date.now()
      };

      const orderData: any = {
        orderId,
        orderDate,
        type,
        client,
        notes,
        items,
        subtotal,
        total,
        status: payFull ? 'confirmed' : status,
        paymentStatus: payFull ? 'paid' : paymentStatus,
        assignedTo,
        propertyId: selectedPropertyId || null,
        vat: { enabled: vatRate > 0, rate: vatRate, amount: vatAmount },
        commission: { rate: commissionRate, amount: commissionAmount },
        discount: { amount: discountAmount },
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.fullName || 'System',
        tenantId: tenantId
      };

      if (isEdit) {
        orderData.orderLogs = arrayUnion(logEntry);
        await updateDoc(doc(db, 'orders', id!), orderData);
        await createSystemLog('UPDATE', 'ORDER', `Cập nhật đơn hàng ${orderId}`, userProfile, 'low');
      } else {
        orderData.createdAt = serverTimestamp();
        orderData.createdBy = userProfile?.fullName || 'System';
        orderData.orderLogs = [logEntry];
        await addDoc(collection(db, 'orders'), orderData);
        await createSystemLog('CREATE', 'ORDER', `Tạo mới đơn hàng ${orderId}`, userProfile, 'medium');
      }
      navigate('/manage-orders');
    } catch (e: any) {
      setError('Lỗi khi lưu đơn hàng: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };
  const updateItem = (idx: number, field: keyof OrderItem, val: any) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = val;
    setItems(newItems);
  };

  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const sortedLogs = useMemo(() => {
    return [...orderLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [orderLogs]);

  if (loading) return <div className="h-full flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">
            {isEdit ? 'CHI TIẾT HỢP ĐỒNG' : 'TẠO GIAO DỊCH MỚI'}
          </h2>
          <p className="text-slate-500 font-medium">Quản lý giao dịch bất động sản và thanh toán.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manage-orders')} className="h-11 px-5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">Hủy</button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="h-11 px-8 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {saving ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
            {isEdit ? 'Cập nhật' : 'Lưu Giao Dịch'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Info Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-card overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person_search</span>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">THÔNG TIN KHÁCH HÀNG (BÊN MUA)</h3>
              </div>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="h-8 px-4 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">list</span>
                Chọn từ danh sách
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 relative" ref={suggestionRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ tên khách hàng *</label>
                  <input
                    required
                    value={client.name}
                    onChange={e => {
                      setClient({ ...client, name: e.target.value });
                      setShowSuggestions(true);
                    }}
                    className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    placeholder="Tìm hoặc nhập tên..."
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                      {suggestions.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setClient({ name: c.name, phone: c.phone, email: c.email, company: c.company, address: c.address });
                            setShowSuggestions(false);
                          }}
                          className="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-bold text-primary">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.phone}</p>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">add_circle</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại *</label>
                  <input required value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none text-sm font-bold text-primary" placeholder="09xx..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ thường trú *</label>
                <input required value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none text-sm font-bold text-primary" placeholder="Số nhà, tên đường..." />
              </div>
            </div>
          </div>

          {/* Property Items Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-card overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">real_estate_agent</span>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CHI TIẾT MUA BÁN BẤT ĐỘNG SẢN</h3>
              </div>
              {!selectedPropertyId && (
                <button onClick={addItem} className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:text-primary-dark transition-colors">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Thêm mục mới
                </button>
              )}
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Mô tả Bất Động Sản</th>
                    <th className="px-4 py-4 text-center w-24">SL</th>
                    <th className="px-4 py-4 text-right w-40">Giá Niêm Yết</th>
                    <th className="px-4 py-4 text-right w-40">Thành tiền</th>
                    <th className="px-6 py-4 text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-4">
                        <input
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className={`w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 ${selectedPropertyId ? 'text-primary' : 'text-slate-700'}`}
                          placeholder="Nhập tên căn / lô..."
                          readOnly={!!selectedPropertyId}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border-none rounded-lg h-9 text-center text-sm font-black focus:ring-2 focus:ring-primary/10"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border-none rounded-lg h-9 text-right text-sm font-black focus:ring-2 focus:ring-primary/10"
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-black text-primary">{formatVND(item.quantity * item.unitPrice)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!selectedPropertyId && items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Payment Summary Area */}
            <div className="p-8 bg-slate-50/50 flex flex-col items-end space-y-3">
              <div className="flex justify-between w-72 text-sm font-bold text-slate-500">
                <span>Tổng giá trị BĐS:</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between w-72">
                <span className="text-sm font-bold text-slate-500">Chiết khấu / Giảm giá:</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  className="w-32 h-8 px-2 text-right bg-white border border-slate-200 rounded-lg text-sm font-bold text-rose-500 focus:border-rose-500 outline-none"
                />
              </div>
              <div className="h-px bg-slate-200 w-72 my-2"></div>
              <div className="flex justify-between w-72 text-xl font-black text-primary">
                <span className="text-[10px] uppercase tracking-widest pt-2">Thực thu:</span>
                <span>{formatVND(total)}</span>
              </div>
              {/* Commission Section */}
              <div className="w-72 mt-4 pt-4 border-t border-slate-200/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">% Hoa hồng môi giới:</span>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                    className="w-16 h-7 text-right bg-emerald-50 border-none rounded-md text-xs font-bold text-emerald-700"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>Tiền hoa hồng:</span>
                  <span>{formatVND(commissionAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-card p-8 space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">THÔNG TIN GIAO DỊCH</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã hợp đồng</label>
              <input value={orderId} readOnly className="w-full h-11 px-4 rounded-xl bg-slate-100 border-none text-xs font-mono font-black text-slate-400 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn Dự Án / BĐS *</label>
              <select
                value={selectedPropertyId}
                onChange={e => setSelectedPropertyId(e.target.value)}
                className={`w-full h-11 px-4 rounded-xl border-none text-xs font-bold cursor-pointer ${selectedPropertyId ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' : 'bg-slate-50 text-primary'}`}
              >
                <option value="">-- Chọn Bất Động Sản --</option>
                {availableProperties.map(p => (
                  <option key={p.id} value={p.id}>{p.title} - {p.price}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhân viên Sales</label>
              <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold text-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái thanh toán</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold text-primary cursor-pointer">
                <option value="unpaid">Chưa thanh toán</option>
                <option value="partially_paid">Thanh toán một phần</option>
                <option value="paid">Đã thanh toán đủ</option>
              </select>
            </div>
          </div>

          {/* Activity Logs Section */}
          {isEdit && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-card overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">TIẾN ĐỘ GIAO DỊCH</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cập nhật trạng thái</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as OrderStatus)}
                    className={`w-full h-10 px-4 rounded-xl border-none text-[10px] font-black uppercase tracking-widest cursor-pointer ${statusLabels[status].color}`}
                  >
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k} className="bg-white text-slate-900">{v.label}</option>)}
                  </select>
                  <textarea
                    value={logContent}
                    onChange={e => setLogContent(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 border-none text-xs font-medium text-slate-600 h-24 resize-none"
                    placeholder="Ghi chú về tiến độ, hồ sơ..."
                  />
                  <button
                    onClick={handleAddLog}
                    disabled={!logContent.trim() || saving}
                    className="w-full h-11 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                  >
                    Lưu cập nhật
                  </button>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {sortedLogs.length > 0 ? sortedLogs.map((log, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${statusLabels[log.status]?.color || 'bg-slate-200'}`}>{statusLabels[log.status]?.label || log.status}</span>
                        <span className="text-[9px] font-bold text-slate-400">{log.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.content}</p>
                      <p className="text-[9px] font-black text-primary uppercase">BY: {log.author}</p>
                    </div>
                  )) : (
                    <p className="text-center text-slate-300 text-[10px] font-bold py-10 uppercase tracking-widest">Chưa có lịch sử xử lý</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Modal Implementation */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Chọn khách hàng có sẵn</h3>
              <button onClick={() => setShowCustomerModal(false)} className="size-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 bg-white border-b border-slate-100">
              <input
                autoFocus
                value={customerSearchTerm}
                onChange={e => setCustomerSearchTerm(e.target.value)}
                placeholder="Tìm tên hoặc SĐT..."
                className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none text-sm font-bold"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {allCustomers.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => { setClient(c); setShowCustomerModal(false); }} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-primary">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.phone}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">add_circle</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;