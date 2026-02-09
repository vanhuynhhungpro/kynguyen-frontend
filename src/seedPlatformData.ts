import { db } from './firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';

export const seedPlatformData = async () => {
  if (!window.confirm('Hành động này sẽ tạo dữ liệu mẫu cho Tenants và Users. Bạn có chắc chắn không?')) return;

  const batch = writeBatch(db);

  // 1. Dữ liệu mẫu Tenants
  const tenants = [
    {
      id: 'tenant-alpha',
      name: 'Alpha Real Estate Corp',
      code: 'alpha',
      domain: 'alpha-re.com',
      status: 'active',
      plan: 'enterprise',
      contactEmail: 'ceo@alpha-re.com',
      contactPhone: '0901111111',
    },
    {
      id: 'tenant-beta',
      name: 'Beta Homes',
      code: 'beta',
      domain: 'betahomes.vn',
      status: 'active',
      plan: 'pro',
      contactEmail: 'info@betahomes.vn',
      contactPhone: '0902222222',
    },
    {
      id: 'tenant-gamma',
      name: 'Gamma Land',
      code: 'gamma',
      status: 'suspended', // Đã bị tạm ngưng
      plan: 'basic',
      contactEmail: 'support@gamma.com',
      contactPhone: '0903333333',
    },
    {
      id: 'tenant-delta',
      name: 'Delta Properties',
      code: 'delta',
      status: 'active',
      plan: 'basic',
      contactEmail: 'sales@delta.com',
      contactPhone: '0904444444',
    },
    {
      id: 'tenant-omega',
      name: 'Omega Holdings',
      code: 'omega',
      status: 'inactive',
      plan: 'enterprise',
      contactEmail: 'admin@omega.com',
      contactPhone: '0905555555',
    }
  ];

  tenants.forEach((t: any) => {
    const ref = doc(db, 'tenants', t.id);
    batch.set(ref, { ...t, createdAt: serverTimestamp() }, { merge: true });
  });

  // 2. Dữ liệu mẫu Users (Nhân viên của các Tenant)
  const users = [
    { uid: 'user-alpha-admin', fullName: 'Alice Alpha (Admin)', email: 'alice@alpha.com', role: 'admin', tenantId: 'tenant-alpha' },
    { uid: 'user-alpha-sale', fullName: 'Alex Sale', email: 'alex@alpha.com', role: 'marketing', tenantId: 'tenant-alpha' },
    { uid: 'user-beta-admin', fullName: 'Bob Beta (Admin)', email: 'bob@beta.com', role: 'admin', tenantId: 'tenant-beta' },
    { uid: 'user-beta-staff', fullName: 'Barbara Staff', email: 'barbara@beta.com', role: 'user', tenantId: 'tenant-beta' },
    { uid: 'user-gamma-admin', fullName: 'Charlie Gamma', email: 'charlie@gamma.com', role: 'admin', tenantId: 'tenant-gamma' },
  ];

  users.forEach((u: any) => {
    const ref = doc(db, 'users', u.uid);
    batch.set(ref, { ...u, createdAt: serverTimestamp() }, { merge: true });
  });

  try {
    await batch.commit();
    alert('Đã tạo dữ liệu mẫu thành công! Trang sẽ tải lại.');
    window.location.reload();
  } catch (error: any) {
    console.error('Error seeding data:', error);
    alert('Lỗi khi tạo dữ liệu: ' + error.message);
  }
};