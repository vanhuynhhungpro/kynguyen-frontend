
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export interface TenantConfig {
    id: string;
    name: string;
    domains: string[];
    branding: {
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        companyName?: string;
    };
    settings?: any; // Allow flexible settings
    isActive: boolean;
    ownerId?: string;
}

export const TenantService = {
    /**
     * Resolve tenant based on current hostname
     */
    async resolveTenant(hostname: string): Promise<TenantConfig | null> {
        // 1. Check for localhost or preview domains
        // 1. Check for strict localhost (no subdomain)
        // 1. Check for strict localhost or 'app' subdomain (Platform Root)
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('app.')) {
            console.log("Platform Root detected:", hostname);
            return null; // Return null to indicate "Platform Root" (No specific tenant)
        }

        try {
            // 2. Query 'tenants' collection where 'domains' array contains hostname
            const tenantsRef = collection(db, 'tenants');
            const q = query(tenantsRef, where('domains', 'array-contains', hostname));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                return { id: docSnap.id, ...docSnap.data() } as TenantConfig;
            }

            return null;
        } catch (error) {
            console.error("Error resolving tenant:", error);
            return null;
        }
    },

    async getTenantById(tenantId: string): Promise<TenantConfig | null> {
        try {
            const docRef = doc(db, 'tenants', tenantId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as TenantConfig;
            }
            return null;
        } catch (error) {
            console.error("Error getting tenant by ID:", error);
            return null;
        }
    }
};
