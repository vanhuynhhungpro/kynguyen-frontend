import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerDocs, setCustomerDocs] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // 1. Lấy thông tin khách hàng
        const custDoc = await getDoc(doc(db, 'customers', id));
        if (!custDoc.exists()) {
          alert("Khách hàng không tồn tại");
          navigate('/manage-customers');
          return;
        }
        const custData = { id: custDoc.id, ...custDoc.data() } as any;

        // Check Tenant Access
        if (tenantId && custData.tenantId && custData.tenantId !== tenantId) {
          alert("Bạn không có quyền truy cập hồ sơ khách hàng này.");
          navigate('/manage-customers');
          return;
        }

        setCustomer(custData);

        // 2. Tìm các đơn hàng liên quan (theo SĐT hoặc Email)
        const ordersRef = collection(db, 'orders');
        // Firestore không hỗ trợ OR query trực tiếp phức tạp, ta lấy 2 query rồi gộp
        // Filter by TenantId as well if available
        let qOrdersPhone;
        if (tenantId) {
          qOrdersPhone = query(ordersRef, where('client.phone', '==', custData.phone), where('tenantId', '==', tenantId));
        } else {
          qOrdersPhone = query(ordersRef, where('client.phone', '==', custData.phone));
        }
        const ordersSnap = await getDocs(qOrdersPhone);
        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));

        // 3. Tìm các yêu cầu tư vấn liên quan
        const inquiriesRef = collection(db, 'inquiries');
        let qInquiriesPhone;
        if (tenantId) {
          qInquiriesPhone = query(inquiriesRef, where('phone', '==', custData.phone), where('tenantId', '==', tenantId));
        } else {
          qInquiriesPhone = query(inquiriesRef, where('phone', '==', custData.phone));
        }
        const inquiriesSnap = await getDocs(qInquiriesPhone);
        setInquiries(inquiriesSnap.docs.map(d => ({ id: d.id, ...d.data() as any })));

        // 4. Lấy nhật ký chăm sóc (Activities)
        const activitiesRef = collection(db, 'customers', id, 'activities');
        const qActivities = query(activitiesRef, orderBy('createdAt', 'desc'));
        const activitiesSnap = await getDocs(qActivities);
        setActivities(activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 5. Lấy tài liệu khách hàng
        const docsRef = collection(db, 'customers', id, 'documents');
        const qDocs = query(docsRef, orderBy('createdAt', 'desc'));
        const docsSnap = await getDocs(qDocs);
        setCustomerDocs(docsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Error fetching customer details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, tenantId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    try {
      const noteData = {
        type: 'note',
        content: newNote,
        createdBy: userProfile?.fullName || 'Admin',
        tenantId, // Store tenantId for future collection group queries
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'customers', id, 'activities'), noteData);
      setActivities([{ id: docRef.id, ...noteData, createdAt: { toDate: () => new Date() } }, ...activities]);
      setNewNote('');
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !id) return;
    const file = e.target.files[0];
    setUploadingDoc(true);
    try {
      const storageRef = ref(storage, `customer_docs/${id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const docData = {
        name: file.name,
        url: url,
        type: file.type,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'customers', id, 'documents'), docData);
      setCustomerDocs([{ id: docRef.id, ...docData }, ...customerDocs]);
    } catch (error) { console.error("Upload error:", error); alert("Lỗi upload file"); }
    finally { setUploadingDoc(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;
  if (!customer) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/manage-customers')} className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-primary font-display uppercase tracking-tight">{customer.name}</h1>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <span className={`size-2 rounded-full ${customer.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              {customer.type === 'enterprise' ? 'Doanh nghiệp' : 'Khách cá nhân'} • {customer.code || 'Mã KH: Chưa có'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <a href={`tel:${customer.phone}`} className="h-11 px-5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center gap-2 hover:bg-emerald-100 transition-all">
            <span className="material-symbols-outlined text-lg">call</span> Gọi điện
          </a>
          <a href={`mailto:${customer.email}`} className="h-11 px-5 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-all">
            <span className="material-symbols-outlined text-lg">mail</span> Gửi mail
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Thông tin liên hệ</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><span className="material-symbols-outlined text-lg">phone</span></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Điện thoại</p>
                  <p className="text-sm font-bold text-primary">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><span className="material-symbols-outlined text-lg">email</span></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="text-sm font-bold text-primary break-all">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><span className="material-symbols-outlined text-lg">business</span></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Công ty</p>
                  <p className="text-sm font-bold text-primary">{customer.company || '---'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><span className="material-symbols-outlined text-lg">location_on</span></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ</p>
                  <p className="text-sm font-medium text-slate-600">{customer.address || '---'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ghi chú nhanh</h3>
            <p className="text-sm text-slate-600 italic bg-amber-50 p-4 rounded-xl border border-amber-100">
              {customer.notes || "Chưa có ghi chú đặc biệt về khách hàng này."}
            </p>
          </div>

          {/* Documents Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tài liệu & Hợp đồng</h3>
              <label className="cursor-pointer text-primary hover:text-accent transition-colors">
                {uploadingDoc ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-lg">upload_file</span>}
                <input type="file" className="hidden" onChange={handleUploadDoc} disabled={uploadingDoc} />
              </label>
            </div>
            <div className="space-y-3">
              {customerDocs.length > 0 ? customerDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-slate-400 text-lg">description</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</span>
                  </a>
                  <button onClick={async () => {
                    if (!window.confirm("Xóa file này?")) return;
                    await deleteDoc(doc(db, 'customers', id!, 'documents', doc.id));
                    setCustomerDocs(prev => prev.filter(d => d.id !== doc.id));
                  }} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><span className="material-symbols-outlined text-sm">close</span></button>
                </div>
              )) : <p className="text-xs text-slate-400 italic">Chưa có tài liệu nào.</p>}
            </div>
          </div>
        </div>

        {/* Center Column: Activity & History */}
        <div className="lg:col-span-2 space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng đơn hàng</p>
              <p className="text-2xl font-black text-primary mt-1">{orders.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yêu cầu tư vấn</p>
              <p className="text-2xl font-black text-primary mt-1">{inquiries.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh số</p>
              <p className="text-2xl font-black text-accent mt-1">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(orders.reduce((sum, o) => sum + (o.total || 0), 0))}
              </p>
            </div>
          </div>

          {/* Tabs / Sections */}
          <div className="space-y-6">
            {/* Activity Log Input */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Nhật ký chăm sóc (CRM)</h3>
              <div className="flex gap-3">
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Ghi chú lại cuộc gọi, lịch hẹn, hoặc nhu cầu mới..."
                  className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border-none text-sm font-medium focus:ring-2 focus:ring-primary/10"
                />
                <button onClick={handleAddNote} className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-all">
                  Lưu
                </button>
              </div>

              {/* Timeline */}
              <div className="mt-6 space-y-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className="size-3 rounded-full bg-slate-200 border-2 border-white shadow-sm z-10"></div>
                      <div className="w-0.5 bg-slate-100 h-full -mt-1"></div>
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-bold text-primary">{act.createdBy} <span className="text-slate-400 font-normal">• {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}</span></p>
                      <p className="text-sm text-slate-600 mt-1">{act.content}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-center text-xs text-slate-400 italic py-4">Chưa có hoạt động nào được ghi lại.</p>}
              </div>
            </div>

            {/* Related Orders */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Lịch sử giao dịch</h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map(order => (
                    <Link to={`/orders/${order.id}`} key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group">
                      <div>
                        <p className="font-bold text-primary text-sm">#{order.orderId || order.id.substring(0, 6).toUpperCase()}</p>
                        <p className="text-xs text-slate-500">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : '---'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total || 0)}</p>
                        <span className="text-[10px] font-bold uppercase text-slate-400">{order.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Khách hàng chưa có đơn hàng nào.</p>
              )}
            </div>

            {/* Related Inquiries */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Lịch sử tư vấn</h3>
              {inquiries.length > 0 ? (
                <div className="space-y-3">
                  {inquiries.map(inq => (
                    <div key={inq.id} className="p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">{inq.interest}</span>
                        <span className="text-[10px] font-bold text-slate-400">{inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{inq.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có yêu cầu tư vấn nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;