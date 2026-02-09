import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Toast from '../../../components/Toast';
import { db, storage } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { createSystemLog } from '../../../services/Logger';

// Định nghĩa Interface
interface Property {
  id: string;
  title: string;
  price: string;
  area: string;
  location: string;
  imageUrl: string;
  type: string;
  status: string;
  description?: string;
  features?: string[];
  documents?: { name: string; url: string }[];
  gallery?: string[];
  floorPlans?: string[];
  slug?: string;
  landingConfig?: {
    enabled: boolean;
    heroTitle?: string;
    heroSubtitle?: string;
    policy?: string;
    videoUrl?: string;
    locationMapUrl?: string;
    themeColor?: string;
    sections?: any[];
  };
  marketingBudget?: number;
  adSpend?: number;
  costPrice?: number;
  soldPrice?: number;
  // Dynamic Fields
  legal?: string;
  direction?: string;
  frontage?: string;
  roadWidth?: string;
  floors?: string;
  bedroom?: string;
  bathroom?: string;
  project?: string;
  block?: string;
  balconyDirection?: string;
  videos?: {
    type: 'youtube' | 'upload';
    url: string;
    thumbnail?: string;
  }[];
}

const ManageProperties: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId: brandingTenantId } = useBranding();
  const tenantId = brandingTenantId || userProfile?.tenantId;

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [floorPlanFiles, setFloorPlanFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  // Tab state cho Modal Form
  const [formTab, setFormTab] = useState<'info' | 'landing'>('info');

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    area: '',
    location: '',
    imageUrl: '',
    type: 'Căn hộ',
    status: 'Đang bán',
    description: '',
    features: [] as string[],
    gallery: [] as string[],
    floorPlans: [] as string[],
    documents: [] as { name: string; url: string }[],
    slug: '',
    landingConfig: {
      enabled: false,
      heroTitle: '',
      heroSubtitle: '',
      policy: '',
      videoUrl: '',
      locationMapUrl: '',
      themeColor: '#0B3C49',
      sections: [] as any[]
    },
    videos: [] as { type: 'youtube' | 'upload'; url: string }[],
    // Temporary state fields (not saved to DB directly in this object, but used for form handling)
    marketingBudget: 0,
    adSpend: 0,
    costPrice: 0,
    soldPrice: 0,
    // Dynamic Fields
    legal: '',
    direction: '',
    frontage: '',
    roadWidth: '',
    floors: '',
    bedroom: '',
    bathroom: '',
    project: '',
    block: '',
    balconyDirection: ''
  });

  // AI Modal State
  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    property: Property | null;
    activeTab: 'valuation' | 'post';
    activeFormTab: 'info' | 'landing';
    loading: boolean;
    valuationResult: any | null;
    postResult: string | null;
  }>({
    isOpen: false,
    property: null,
    activeTab: 'valuation',
    activeFormTab: 'info',
    loading: false,
    valuationResult: null,

    postResult: null
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [youtubeInput, setYoutubeInput] = useState('');
  const [videoUploadFiles, setVideoUploadFiles] = useState<File[]>([]);


  const fetchProperties = async () => {
    setLoading(true);
    try {
      if (!tenantId) return;
      const q = query(collection(db, 'properties'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(props);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) fetchProperties();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `properties/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      const newDocs: { name: string; url: string }[] = [];
      if (docFiles.length > 0) {
        for (const file of docFiles) {
          const docRef = ref(storage, `property_docs/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(docRef, file);
          const url = await getDownloadURL(snapshot.ref);
          newDocs.push({ name: file.name, url });
        }
      }

      const newGalleryUrls: string[] = [];
      if (galleryFiles.length > 0) {
        console.log(`Uploading ${galleryFiles.length} gallery images...`);
        try {
          for (const file of galleryFiles) {
            const storageRef = ref(storage, `properties/gallery/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            console.log("Uploaded gallery image:", url);
            newGalleryUrls.push(url);
          }
        } catch (err) {
          console.error("Gallery Upload Error:", err);
          setToast({ message: "Lỗi khi tải ảnh Gallery: " + err, type: 'error' });
        }
      }

      const newFloorPlanUrls: string[] = [];
      if (floorPlanFiles.length > 0) {
        try {
          for (const file of floorPlanFiles) {
            const storageRef = ref(storage, `properties/floorplans/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            newFloorPlanUrls.push(url);
          }
        } catch (err) {
          console.error("FloorPlan Upload Error:", err);
          setToast({ message: "Lỗi khi tải ảnh mặt bằng: " + err, type: 'error' });
        }
      }

      const finalDocuments = [...(formData.documents || []), ...newDocs];
      const finalGallery = [...(formData.gallery || []), ...newGalleryUrls];
      const finalFloorPlans = [...(formData.floorPlans || []), ...newFloorPlanUrls];

      // Video Upload Logic
      const newVideoUrls: { type: 'upload'; url: string }[] = [];
      if (videoUploadFiles.length > 0) {
        try {
          for (const file of videoUploadFiles) {
            const storageRef = ref(storage, `properties/videos/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            newVideoUrls.push({ type: 'upload', url });
          }
        } catch (err) {
          console.error("Video Upload Error:", err);
          setToast({ message: "Lỗi khi tải video: " + err, type: 'error' });
        }
      }

      const finalVideos = [
        ...(formData.videos || []),
        ...newVideoUrls
      ];


      let currentPropertyId = editingId;

      if (editingId) {
        await updateDoc(doc(db, 'properties', editingId), {
          ...formData,
          imageUrl: finalImageUrl,
          documents: finalDocuments,
          gallery: finalGallery,
          floorPlans: finalFloorPlans,
          videos: finalVideos,
          updatedAt: serverTimestamp()
        });
        await createSystemLog('UPDATE', 'PROPERTY', `Cập nhật BĐS: ${formData.title}`, userProfile);
        setToast({ message: 'Đã cập nhật thông tin thành công!', type: 'success' });
        setIsModalOpen(false);
      } else {
        const docRef = await addDoc(collection(db, 'properties'), {

          ...formData,
          imageUrl: finalImageUrl,
          documents: finalDocuments,
          gallery: finalGallery,
          floorPlans: finalFloorPlans,
          videos: finalVideos,
          tenantId: tenantId,
          createdAt: serverTimestamp()
        });
        currentPropertyId = docRef.id;
        await createSystemLog('CREATE', 'PROPERTY', `Đăng tin BĐS mới: ${formData.title}`, userProfile);
        setToast({ message: 'Đã thêm bất động sản mới thành công!', type: 'success' });
        setIsModalOpen(false);
      }

      // Dual-write landing pages
      if (currentPropertyId && formData.slug) {
        try {
          const lpQuery = query(collection(db, 'landing_pages'), where('propertyId', '==', currentPropertyId));
          const lpSnap = await getDocs(lpQuery);

          const landingData = {
            propertyId: currentPropertyId,
            tenantId: tenantId,
            slug: formData.slug,
            isActive: formData.landingConfig.enabled,
            heroTitle: formData.landingConfig.heroTitle || '',
            heroSubtitle: formData.landingConfig.heroSubtitle || '',
            themeColor: formData.landingConfig.themeColor || '#0B3C49',
            videoUrl: formData.landingConfig.videoUrl || '',
            locationMapUrl: formData.landingConfig.locationMapUrl || '',
            policy: formData.landingConfig.policy || '',
            sections: formData.landingConfig.sections || [],
            updatedAt: serverTimestamp()
          };

          if (!lpSnap.empty) {
            await updateDoc(doc(db, 'landing_pages', lpSnap.docs[0].id), landingData);
          } else {
            await addDoc(collection(db, 'landing_pages'), { ...landingData, createdAt: serverTimestamp() });
          }
        } catch (err) {
          console.error("Dual-write failed (Non-fatal):", err);
        }
      }
      setIsModalOpen(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      console.error("Error adding property:", error);
      alert('Có lỗi xảy ra!');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa tin này?')) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        await createSystemLog('DELETE', 'PROPERTY', `Xóa BĐS ID: ${id}`, userProfile, 'medium');
        fetchProperties();
      } catch (error) {
        console.error("Error deleting property:", error);
      }
    }
  };

  const handleEdit = (item: Property) => {
    setFormData({
      title: item.title,
      price: item.price,
      area: item.area,
      location: item.location,
      imageUrl: item.imageUrl,
      type: item.type,
      status: item.status,
      description: item.description || '',
      features: item.features || [],
      gallery: item.gallery || [],
      floorPlans: item.floorPlans || [],
      documents: item.documents || [],
      videos: item.videos || [],
      slug: item.slug || '',
      landingConfig: item.landingConfig || {
        enabled: false,
        heroTitle: '',
        heroSubtitle: '',
        policy: '',
        videoUrl: '',
        locationMapUrl: '',
        themeColor: '#0B3C49',
        sections: []
      },
      marketingBudget: item.marketingBudget || 0,
      adSpend: item.adSpend || 0,
      costPrice: item.costPrice || 0,
      soldPrice: item.soldPrice || 0,
      legal: item.legal || '',
      direction: item.direction || '',
      frontage: item.frontage || '',
      roadWidth: item.roadWidth || '',
      floors: item.floors || '',
      bedroom: item.bedroom || '',
      bathroom: item.bathroom || '',
      project: item.project || '',
      block: item.block || '',
      balconyDirection: item.balconyDirection || ''
    });
    setEditingId(item.id);
    setImageFile(null);
    setDocFiles([]);
    setGalleryFiles([]);
    setFloorPlanFiles([]);
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '', price: '', area: '', location: '', imageUrl: '', type: 'Căn hộ', status: 'Đang bán', description: '', features: [], gallery: [], floorPlans: [], documents: [],
      slug: '',
      landingConfig: { enabled: false, heroTitle: '', heroSubtitle: '', policy: '', videoUrl: '', locationMapUrl: '', themeColor: '#0B3C49', sections: [] },
      marketingBudget: 0,
      adSpend: 0,
      costPrice: 0,
      soldPrice: 0,
      legal: '', direction: '', frontage: '', roadWidth: '', floors: '', bedroom: '', bathroom: '', project: '', block: '', balconyDirection: ''
    });
    setEditingId(null);
    setImageFile(null);
    setDocFiles([]);
    setGalleryFiles([]);
    setFloorPlanFiles([]);
    setFeatureInput('');
  };

  const handleAddFeature = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();

    if (featureInput.trim()) {
      setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const removeFloorPlan = (index: number) => {
    setFormData(prev => ({ ...prev, floorPlans: prev.floorPlans.filter((_, i) => i !== index) }));
  };

  const addYoutubeVideo = () => {
    if (!youtubeInput) return;
    // Basic validation/extraction could go here
    const newVideo = { type: 'youtube' as const, url: youtubeInput };
    setFormData(prev => ({ ...prev, videos: [...(prev.videos || []), newVideo] }));
    setYoutubeInput('');
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
  };

  const addSection = () => {
    const newSection = {
      id: Date.now().toString(),
      layout: 'left',
      title: 'Tiêu đề khối nội dung',
      content: 'Mô tả chi tiết...',
      imageUrl: ''
    };
    setFormData(prev => ({
      ...prev,
      landingConfig: {
        ...prev.landingConfig,
        sections: [...(prev.landingConfig.sections || []), newSection]
      }
    }));
  };

  const updateSection = (index: number, field: string, value: any) => {
    const newSections = [...(formData.landingConfig.sections || [])];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      landingConfig: { ...prev.landingConfig, sections: newSections }
    }));
  };

  const removeSection = (index: number) => {
    const newSections = [...(formData.landingConfig.sections || [])];
    newSections.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      landingConfig: { ...prev.landingConfig, sections: newSections }
    }));
  };

  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const storageRef = ref(storage, `properties/sections/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        updateSection(index, 'imageUrl', url);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Lỗi tải ảnh");
      } finally {
        setUploading(false);
      }
    }
  };

  const openAiModal = (property: Property) => {
    setAiModal({
      isOpen: true,
      property,
      activeTab: 'valuation',
      activeFormTab: 'info',
      loading: false,
      valuationResult: null,
      postResult: null
    });
  };

  const handleAiAction = async () => {
    if (!aiModal.property) return;
    setAiModal(prev => ({ ...prev, loading: true }));

    try {
      const functions = getFunctions();

      if (aiModal.activeTab === 'valuation') {
        const estimateFn = httpsCallable(functions, 'estimatePropertyPrice');
        const result = await estimateFn({
          title: aiModal.property.title,
          location: aiModal.property.location,
          area: aiModal.property.area,
          type: aiModal.property.type
        });
        setAiModal(prev => ({ ...prev, loading: false, valuationResult: result.data }));
      } else {
        const postFn = httpsCallable(functions, 'generateSocialPost');
        const result = await postFn({
          title: aiModal.property.title,
          location: aiModal.property.location,
          area: aiModal.property.area,
          type: aiModal.property.type,
          price: aiModal.property.price
        });
        setAiModal(prev => ({ ...prev, loading: false, postResult: (result.data as any).content }));
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Lỗi khi gọi AI: " + error);
      setAiModal(prev => ({ ...prev, loading: false }));
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd').replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Quản Lý Bất Động Sản</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách các dự án và tin đăng bán.</p>
        </div>
        <button
          onClick={() => { resetForm(); setFormTab('info'); setIsModalOpen(true); }}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Đăng tin mới
        </button>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary/50">progress_activity</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">real_estate_agent</span>
          <p>Chưa có tin bất động sản nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((item) => (
            <div key={item.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl || 'https://via.placeholder.com/400x300'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border ${item.status === 'Đang bán'
                    ? 'bg-emerald-500/90 text-white border-emerald-400'
                    : item.status === 'Cho thuê'
                      ? 'bg-blue-500/90 text-white border-blue-400'
                      : item.status === 'Đã bán'
                        ? 'bg-slate-800/90 text-white border-slate-700'
                        : 'bg-amber-500/90 text-white border-amber-400'
                    }`}>
                    {item.status}
                  </span>
                </div>

                {item.landingConfig?.enabled && (
                  <div className="absolute top-3 right-3">
                    <span className="size-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm" title="Đã có Landing Page">
                      <span className="material-symbols-outlined text-base">web</span>
                    </span>
                  </div>
                )}

                {/* Quick Actions Overlay */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                  <button
                    onClick={() => handleEdit(item)}
                    className="size-9 rounded-full bg-white hover:bg-primary hover:text-white text-slate-700 shadow-lg flex items-center justify-center transition-colors"
                    title="Ch chỉnh sửa"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => window.open(`#/landing-builder/${item.id}`, '_blank')}
                    className="size-9 rounded-full bg-white hover:bg-purple-600 hover:text-white text-purple-600 shadow-lg flex items-center justify-center transition-colors"
                    title="Landing Page Builder"
                  >
                    <span className="material-symbols-outlined text-lg">active_overview</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.type}</span>
                    <span className="text-sm font-bold text-emerald-600">{item.price}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 hover:text-primary transition-colors cursor-pointer" onClick={() => handleEdit(item)}>
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="line-clamp-1">{item.location}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-slate-400">straighten</span>
                      {item.area}
                    </div>
                    <div className="w-px h-3 bg-slate-200"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-slate-400">bed</span>
                      {item.bedroom || '-'}
                    </div>
                    <div className="w-px h-3 bg-slate-200"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-slate-400">shower</span>
                      {item.bathroom || '-'}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openAiModal(item)}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">smart_toy</span>
                    AI Viết bài
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => window.location.hash = `#/orders/new?propertyId=${item.id}`}
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                      title="Tạo đơn hàng"
                    >
                      <span className="material-symbols-outlined text-lg">shopping_cart</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                      title="Xóa tin"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-primary">{editingId ? 'Cập nhật tin' : 'Đăng tin mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Form Content */}

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <form id="propertyForm" onSubmit={handleSubmit} className="space-y-6">
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiêu đề</label>
                    <input required type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                      value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value, slug: !formData.slug ? generateSlug(e.target.value) : formData.slug })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá bán</label>
                      <input required type="text" placeholder="VD: 5 Tỷ" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                        value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diện tích</label>
                      <input required type="text" placeholder="VD: 100m2" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                        value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vị trí</label>
                    <input required type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                      value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hình ảnh</label>
                    <div className="flex items-center gap-4">
                      {formData.imageUrl && !imageFile && (
                        <img src={formData.imageUrl} alt="Preview" className="size-16 rounded-lg object-cover border border-slate-200" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                    {!imageFile && !formData.imageUrl && (
                      <p className="text-[10px] text-rose-500 mt-1">* Vui lòng chọn ảnh</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Loại hình</label>
                      <select className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm bg-white"
                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                        <option>Căn hộ</option>
                        <option>Nhà phố</option>
                        <option>Biệt thự</option>
                        <option>Đất nền</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trạng thái</label>
                      <select className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm bg-white"
                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option>Đang bán</option>
                        <option>Cho thuê</option>
                        <option>Đã bán</option>
                        <option>Đặt cọc</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá nhập / Giá vốn (VNĐ)</label>
                      <input
                        type="number"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm font-bold text-slate-700"
                        value={formData.costPrice}
                        onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    {formData.status === 'Đã bán' && (
                      <div>
                        <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Giá Bán Thực Tế (Chốt cọc)</label>
                        <input
                          type="number"
                          className="w-full h-10 px-3 rounded-lg border border-emerald-200 focus:border-emerald-500 outline-none text-sm font-bold text-emerald-700 bg-emerald-50"
                          value={formData.soldPrice}
                          onChange={e => setFormData({ ...formData, soldPrice: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div>
                      <label className="block text-xs font-bold text-orange-700 uppercase mb-1">Ngân sách Marketing (Dự kiến)</label>
                      <input
                        type="number"
                        className="w-full h-10 px-3 rounded-lg border border-orange-200 focus:border-orange-500 outline-none text-sm font-bold text-orange-900 bg-white"
                        value={formData.marketingBudget}
                        onChange={e => setFormData({ ...formData, marketingBudget: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-orange-700 uppercase mb-1">Chi phí Ads (Thực tế)</label>
                      <input
                        type="number"
                        className="w-full h-10 px-3 rounded-lg border border-orange-200 focus:border-orange-500 outline-none text-sm font-bold text-orange-900 bg-white"
                        value={formData.adSpend}
                        onChange={e => setFormData({ ...formData, adSpend: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả chi tiết dự án</label>
                    <textarea
                      className="w-full p-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm min-h-[100px] resize-none"
                      placeholder="Mô tả về tiện ích, pháp lý, tiềm năng..."
                      value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đặc điểm nổi bật (Pháp lý, Ngân hàng...)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={e => setFeatureInput(e.target.value)}
                        onKeyDown={handleAddFeature}
                        className="flex-1 h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                        placeholder="VD: Sổ hồng riêng, VCB hỗ trợ 70%..."
                      />
                      <button type="button" onClick={handleAddFeature} className="px-4 h-10 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200">Thêm</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((f, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2">
                          {f}
                          <button type="button" onClick={() => removeFeature(i)} className="text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-sm">close</span></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tài liệu pháp lý (Sổ đỏ, GPXD...)</label>
                    <div className="space-y-2">
                      {formData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline truncate max-w-[200px] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-accent">description</span>
                            {doc.name}
                          </a>
                          <button type="button" onClick={() => removeDocument(i)} className="text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                      ))}
                      <input
                        type="file"
                        multiple
                        onChange={e => {
                          if (e.target.files) setDocFiles(Array.from(e.target.files));
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thư viện ảnh dự án (Gallery)</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {formData.gallery.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* DYNAMIC FIELDS BASED ON TYPE */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-primary uppercase tracking-widest border-b border-slate-100 pb-2">Thông tin chi tiết ({formData.type})</h4>

                    {/* Dat nen: Legal, Direction, Frontage, RoadWidth */}
                    {formData.type === 'Đất nền' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pháp lý</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.legal} onChange={e => setFormData({ ...formData, legal: e.target.value })} placeholder="VD: Sổ hồng riêng" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hướng đất</label>
                          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm bg-white"
                            value={formData.direction} onChange={e => setFormData({ ...formData, direction: e.target.value })}>
                            <option value="">-- Chọn hướng --</option>
                            <option>Đông</option><option>Tây</option><option>Nam</option><option>Bắc</option>
                            <option>Đông Nam</option><option>Đông Bắc</option><option>Tây Nam</option><option>Tây Bắc</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mặt tiền (m)</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.frontage} onChange={e => setFormData({ ...formData, frontage: e.target.value })} placeholder="VD: 5m" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đường trước đất (m)</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.roadWidth} onChange={e => setFormData({ ...formData, roadWidth: e.target.value })} placeholder="VD: 12m" />
                        </div>
                      </div>
                    )}

                    {/* Can ho: Project, Block, Floor, Bedroom, WC, BalconyDirection, View */}
                    {formData.type === 'Căn hộ' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên dự án</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })} placeholder="VD: Vinhomes Grand Park" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Block / Tòa</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })} placeholder="VD: S1.01" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tầng</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.floors} onChange={e => setFormData({ ...formData, floors: e.target.value })} placeholder="VD: 12" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số phòng ngủ</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.bedroom} onChange={e => setFormData({ ...formData, bedroom: e.target.value })} placeholder="VD: 2PN" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số WC</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.bathroom} onChange={e => setFormData({ ...formData, bathroom: e.target.value })} placeholder="VD: 2WC" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hướng Ban công</label>
                          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm bg-white"
                            value={formData.balconyDirection} onChange={e => setFormData({ ...formData, balconyDirection: e.target.value })}>
                            <option value="">-- Chọn hướng --</option>
                            <option>Đông</option><option>Tây</option><option>Nam</option><option>Bắc</option>
                            <option>Đông Nam</option><option>Đông Bắc</option><option>Tây Nam</option><option>Tây Bắc</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Nha pho/Biet thu: Floors, Bedroom, WC, Frontage, RoadWidth */}
                    {(formData.type === 'Nhà phố' || formData.type === 'Biệt thự' || formData.type === 'Shophouse') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kết cấu (Số tầng)</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.floors} onChange={e => setFormData({ ...formData, floors: e.target.value })} placeholder="VD: 1 trệt 2 lầu" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số phòng ngủ</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.bedroom} onChange={e => setFormData({ ...formData, bedroom: e.target.value })} placeholder="VD: 4PN" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mặt tiền (m)</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.frontage} onChange={e => setFormData({ ...formData, frontage: e.target.value })} placeholder="VD: 5m" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đường trước nhà (m)</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.roadWidth} onChange={e => setFormData({ ...formData, roadWidth: e.target.value })} placeholder="VD: 12m" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pháp lý</label>
                          <input type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                            value={formData.legal} onChange={e => setFormData({ ...formData, legal: e.target.value })} placeholder="VD: Sổ hồng hoàn công" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thư viện ảnh (Gallery)</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {/* Existing Images */}
                      {formData.gallery.map((img, i) => (
                        <div key={`existing-${i}`} className="relative aspect-video rounded-lg overflow-hidden group border border-slate-200">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Đã lưu</span>
                          </div>
                          <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600">
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}

                      {/* Queued Images (Preview) */}
                      {galleryFiles.map((file, i) => (
                        <div key={`queued-${i}`} className="relative aspect-video rounded-lg overflow-hidden group border-2 border-dashed border-accent/50 bg-accent/5">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Chờ tải lên</span>
                          </div>
                          <button type="button" onClick={() => {
                            setGalleryFiles(prev => prev.filter((_, idx) => idx !== i));
                          }} className="absolute top-1 right-1 bg-slate-500 text-white rounded-full p-1 shadow-md hover:bg-slate-600">
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <label htmlFor="gallery-upload-input" className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                        Chọn thêm ảnh
                      </label>
                      <input
                        id="gallery-upload-input"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          console.log("Gallery Input Change:", files);
                          if (files.length > 0) {
                            setGalleryFiles(prev => [...prev, ...files]);
                          }
                          // Reset AFTER processing (though capturing 'files' var protects us anyway)
                          e.target.value = '';
                        }}
                      />
                      <span className="text-xs text-slate-400 font-medium">
                        {galleryFiles.length > 0 ? `+${galleryFiles.length} file chờ tải lên` : 'Chưa chọn file mới'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mặt bằng tầng (Floor Plans)</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {formData.floorPlans.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden group border border-slate-200">
                          <img src={img} alt="" className="w-full h-full object-contain bg-slate-50" />
                          <button type="button" onClick={() => removeFloorPlan(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files) setFloorPlanFiles(Array.from(e.target.files));
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* VIDEO REVIEW SECTION */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Video Review (YouTube / Upload)</label>
                    <div className="space-y-3">
                      {/* YouTube Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Dán link YouTube (VD: https://youtu.be/...)"
                          className="flex-1 h-10 px-3 rounded-lg border border-slate-200 focus:border-accent outline-none text-sm"
                          value={youtubeInput}
                          onChange={e => setYoutubeInput(e.target.value)}
                        />
                        <button type="button" onClick={addYoutubeVideo} className="px-4 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">add</span> YouTube
                        </button>
                      </div>

                      {/* File Upload Input */}
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                          <span className="material-symbols-outlined">video_file</span>
                          Tải Video lên
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            multiple
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files.length > 0) {
                                setVideoUploadFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <span className="text-xs text-slate-400 font-medium">
                          {videoUploadFiles.length > 0 ? `+${videoUploadFiles.length} video chờ tải lên` : 'Chưa chọn video'}
                        </span>
                      </div>

                      {/* Video List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Existing Videos */}
                        {formData.videos?.map((video, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="size-10 rounded bg-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                              <span className="material-symbols-outlined">{video.type === 'youtube' ? 'play_circle' : 'movie'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{video.url}</p>
                              <p className="text-[10px] text-slate-500 uppercase">{video.type}</p>
                            </div>
                            <button type="button" onClick={() => removeVideo(i)} className="text-slate-400 hover:text-rose-500">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}

                        {/* Queued Videos */}
                        {videoUploadFiles.map((file, i) => (
                          <div key={`q-vid-${i}`} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="size-10 rounded bg-blue-200 flex items-center justify-center shrink-0 text-blue-600">
                              <span className="material-symbols-outlined">upload</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                              <p className="text-[10px] text-blue-500 uppercase font-black">Chờ tải lên</p>
                            </div>
                            <button type="button" onClick={() => setVideoUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>

              </form>
            </div>

            {/* Sticky Footer for Actions */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 h-11 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="propertyForm" // Link to the form ID
                disabled={uploading}
                className="px-8 h-11 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">save</span>}
                {editingId ? 'Lưu thay đổi' : 'Đăng tin ngay'}
              </button>
            </div>
          </div>
        </div >
      )
      }

      {/* AI Assistant Modal */}
      {
        aiModal.isOpen && aiModal.property && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">smart_toy</span>
                  <h3 className="font-bold text-lg text-primary">Trợ lý AI Bất Động Sản</h3>
                </div>
                <button onClick={() => setAiModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-rose-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setAiModal(prev => ({ ...prev, activeTab: 'valuation' }))}
                  className={`flex-1 py-3 text-sm font-bold ${aiModal.activeTab === 'valuation' ? 'text-primary border-b-2 border-primary bg-slate-50' : 'text-slate-400 hover:text-primary'}`}
                >
                  Định giá sơ bộ
                </button>
                <button
                  onClick={() => setAiModal(prev => ({ ...prev, activeTab: 'post' }))}
                  className={`flex-1 py-3 text-sm font-bold ${aiModal.activeTab === 'post' ? 'text-primary border-b-2 border-primary bg-slate-50' : 'text-slate-400 hover:text-primary'}`}
                >
                  Viết bài đăng Facebook
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Đang xử lý cho:</p>
                  <p className="font-bold text-primary">{aiModal.property.title}</p>
                  <p className="text-sm text-slate-600">{aiModal.property.area} • {aiModal.property.location}</p>
                </div>

                {aiModal.loading ? (
                  <div className="py-10 text-center">
                    <span className="animate-spin material-symbols-outlined text-4xl text-accent mb-2">neurology</span>
                    <p className="text-sm font-bold text-slate-500">AI đang phân tích dữ liệu...</p>
                  </div>
                ) : (
                  <>
                    {aiModal.activeTab === 'valuation' && aiModal.valuationResult && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-600 uppercase">Giá ước tính</p>
                            <p className="text-xl font-black text-emerald-700">{aiModal.valuationResult.estimated_price}</p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase">Đơn giá / m2</p>
                            <p className="text-xl font-black text-blue-700">{aiModal.valuationResult.price_per_m2}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white border border-slate-200 rounded-xl">
                          <p className="text-sm font-bold text-primary mb-2">Phân tích:</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{aiModal.valuationResult.analysis}</p>
                        </div>
                      </div>
                    )}

                    {aiModal.activeTab === 'post' && aiModal.postResult && (
                      <div className="animate-in fade-in">
                        <textarea
                          readOnly
                          className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none resize-none"
                          value={aiModal.postResult}
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(aiModal.postResult || '')}
                          className="mt-2 text-xs font-bold text-accent hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span> Sao chép nội dung
                        </button>
                      </div>
                    )}

                    {!aiModal.valuationResult && !aiModal.postResult && (
                      <div className="text-center py-8 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">auto_awesome</span>
                        <p className="text-sm">Nhấn nút bên dưới để AI bắt đầu làm việc</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={handleAiAction}
                  disabled={aiModal.loading}
                  className="px-6 h-11 bg-accent text-white rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent-dark transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {aiModal.loading ? 'Đang xử lý...' : (aiModal.activeTab === 'valuation' ? 'Định giá ngay' : 'Viết bài ngay')}
                  {!aiModal.loading && <span className="material-symbols-outlined text-lg">bolt</span>}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ManageProperties;