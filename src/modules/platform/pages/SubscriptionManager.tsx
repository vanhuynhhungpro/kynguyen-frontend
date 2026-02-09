import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { SubscriptionPlan, CANONICAL_FEATURES, FeatureKey, DEFAULT_PLANS } from '../../../types/subscription';

// ----------------------------------------------------------------------
// TYPES & CONFIG
// ----------------------------------------------------------------------

const SubscriptionManager: React.FC = () => {
    const { userProfile } = useAuth();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'subscription_plans'));
            if (querySnapshot.empty) {
                // Initialize default plans v2
                setPlans(DEFAULT_PLANS);
            } else {
                setPlans(querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Migrate data if missing new structure
                    return {
                        id: doc.id,
                        ...data,
                        // Ensure structure exists for migration
                        featureFlags: data.featureFlags || {},
                        limits: data.limits || {
                            maxProperties: data.maxProperties || 50,
                            maxUsers: data.maxUsers || 3,
                            maxStorageGB: 1
                        }
                    } as SubscriptionPlan;
                }));
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;

        try {
            await setDoc(doc(db, 'subscription_plans', editingPlan.id), {
                ...editingPlan,
                updatedAt: serverTimestamp()
            });

            await createSystemLog('UPDATE', 'SETTING', `Cập nhật gói dịch vụ: ${editingPlan.name}`, userProfile, 'high');

            setPlans(prev => prev.map(p => p.id === editingPlan.id ? editingPlan : p));
            setEditingPlan(null);
            alert("Đã cập nhật cấu hình gói!");
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Lỗi khi lưu!");
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const toggleFeature = (key: FeatureKey) => {
        if (!editingPlan) return;
        setEditingPlan(prev => {
            if (!prev) return null;
            return {
                ...prev,
                featureFlags: {
                    ...prev.featureFlags,
                    [key]: !prev.featureFlags?.[key]
                }
            };
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">CẤU HÌNH GÓI DỊCH VỤ (FEATURE MATRIX)</h2>
                <p className="text-slate-500 font-medium">Bật/tắt tính năng chi tiết cho từng gói thuê bao.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-700 shadow-xl relative overflow-hidden flex flex-col">
                        <div className="mb-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${plan.id === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
                                plan.id === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-slate-700 text-slate-300'
                                }`}>
                                {plan.id}
                            </span>
                            <h3 className="text-xl font-bold font-display">{plan.name}</h3>
                            <div className="mt-2 text-3xl font-black text-white">{formatCurrency(plan.price)}</div>
                        </div>

                        {/* Feature Summary */}
                        <div className="flex-1 space-y-4 mb-8 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giới hạn</p>
                                <p className="text-sm">BĐS: <b>{plan.limits.maxProperties === -1 ? '∞' : plan.limits.maxProperties}</b></p>
                                <p className="text-sm">Users: <b>{plan.limits.maxUsers === -1 ? '∞' : plan.limits.maxUsers}</b></p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tính năng nổi bật</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(plan.featureFlags).filter(([_, v]) => v).slice(0, 4).map(([k]) => (
                                        <span key={k} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            {CANONICAL_FEATURES.find(f => f.key === k)?.label || k}
                                        </span>
                                    ))}
                                    {Object.values(plan.featureFlags).filter(v => v).length > 4 &&
                                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-400">+...</span>
                                    }
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setEditingPlan(plan)}
                            className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">settings_suggest</span>
                            Cấu hình tính năng
                        </button>
                    </div>
                ))}
            </div>

            {/* Edit Modal (Matrix Config) */}
            {editingPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang chỉnh sửa</span>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingPlan.name}</h3>
                            </div>
                            <button onClick={() => setEditingPlan(null)} className="size-10 rounded-full hover:bg-slate-200 text-slate-400 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                            <form id="plan-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                {/* 1. Basic Info & Limits */}
                                <div className="space-y-6">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">tune</span>
                                        Thông tin & Giới hạn
                                    </h4>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Tên gói</label>
                                            <input required value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} className="w-full mt-1 h-10 px-3 rounded-lg border border-slate-200 font-bold" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Giá (VND)</label>
                                                <input type="number" required value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} className="w-full mt-1 h-10 px-3 rounded-lg border border-slate-200 font-bold" />
                                            </div>
                                        </div>
                                        <hr className="border-slate-100" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Max BĐS (-1 = Vô hạn)</label>
                                                <input type="number" required value={editingPlan.limits.maxProperties} onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, maxProperties: Number(e.target.value) } })} className="w-full mt-1 h-10 px-3 rounded-lg border border-slate-200 font-bold text-primary" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Max Users (-1 = Vô hạn)</label>
                                                <input type="number" required value={editingPlan.limits.maxUsers} onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, maxUsers: Number(e.target.value) } })} className="w-full mt-1 h-10 px-3 rounded-lg border border-slate-200 font-bold text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Feature Matrix */}
                                <div className="space-y-6">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-accent">toggle_on</span>
                                        Phân quyền Tính năng
                                    </h4>
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        {CANONICAL_FEATURES.map((feature) => {
                                            const isEnabled = editingPlan.featureFlags?.[feature.key] || false;
                                            return (
                                                <div key={feature.key}
                                                    onClick={() => toggleFeature(feature.key)}
                                                    className={`p-4 flex items-center justify-between cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${isEnabled ? 'bg-indigo-50/50' : ''}`}
                                                >
                                                    <div>
                                                        <p className={`text-sm font-bold ${isEnabled ? 'text-indigo-700' : 'text-slate-700'}`}>{feature.label}</p>
                                                        <p className="text-xs text-slate-500">{feature.description}</p>
                                                    </div>
                                                    <div className={`w-12 h-7 rounded-full transition-colors relative ${isEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                                        <div className={`absolute top-1 size-5 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex gap-3">
                            <button onClick={() => setEditingPlan(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">Hủy bỏ</button>
                            <button form="plan-form" type="submit" className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Lưu Cấu Hình</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManager;
