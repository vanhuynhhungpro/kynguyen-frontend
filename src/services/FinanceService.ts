import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

export interface AffiliateTransaction {
    id: string;
    tenantId: string;
    sourceUserId?: string; // ID of the user who registered
    amount: number;
    type: 'commission' | 'bonus' | 'withdrawal';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    createdAt: any;
}

export interface PayoutRequest {
    id: string;
    tenantId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
    rejectedReason?: string;
    createdAt: any;
    processedAt?: any;
    processedBy?: string;
}

export interface Invoice {
    id: string;
    tenantId: string;
    amount: number;
    plan: string;
    status: 'paid' | 'pending' | 'failed' | 'cancelled';
    billingCycle: 'monthly' | 'yearly';
    createdAt: any;
    paidAt?: any;
}

export const FinanceService = {
    // --- Affiliate & Wallet ---

    // Get current wallet balance and stats
    getWalletStats: async (tenantId: string) => {
        try {
            const tenantRef = doc(db, 'tenants', tenantId);
            const tenantSnap = await getDoc(tenantRef);
            if (tenantSnap.exists()) {
                const data = tenantSnap.data();
                return {
                    balance: data.walletBalance || 0,
                    totalEarnings: data.totalEarnings || 0,
                    affiliateCode: data.affiliateCode || '',
                    affiliateClicks: data.affiliateClicks || 0,
                    affiliateReferrals: data.affiliateReferrals || 0
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching wallet stats:", error);
            throw error;
        }
    },

    // Get transaction history
    getTransactions: async (tenantId: string) => {
        try {
            const q = query(
                collection(db, 'affiliate_transactions'),
                where('tenantId', '==', tenantId),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AffiliateTransaction));
        } catch (error) {
            console.error("Error fetching transactions:", error);
            throw error;
        }
    },

    // --- Payouts ---

    // Create a payout request
    requestPayout: async (tenantId: string, amount: number, bankInfo: any) => {
        try {
            // 1. Check balance (Should be done via Cloud Function transaction for safety, but client-side check first)
            const stats = await FinanceService.getWalletStats(tenantId);
            if (!stats || stats.balance < amount) {
                throw new Error("Số dư không đủ để thực hiện yêu cầu.");
            }

            // 2. Create request
            await addDoc(collection(db, 'payout_requests'), {
                tenantId,
                amount,
                status: 'pending',
                bankInfo,
                createdAt: serverTimestamp()
            });

            // Note: Actual balance deduction should happen here or via Trigger when status changes.
            // For MVP, we deduct 'display balance' or handle via Admin approval flow.
        } catch (error) {
            console.error("Error requesting payout:", error);
            throw error;
        }
    },

    // Get payout requests (Admin)
    getPayouts: async (status?: string) => {
        try {
            let q = query(collection(db, 'payout_requests'), orderBy('createdAt', 'desc'), limit(50));
            if (status) {
                q = query(collection(db, 'payout_requests'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(50));
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutRequest));
        } catch (error) {
            console.error("Error fetching payouts:", error);
            throw error;
        }
    },

    // Get my payout requests (Tenant)
    getMyPayouts: async (tenantId: string) => {
        try {
            const q = query(
                collection(db, 'payout_requests'),
                where('tenantId', '==', tenantId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayoutRequest));
        } catch (error) {
            console.error("Error fetching my payouts:", error);
            throw error;
        }
    },

    // Approve Payout (Admin)
    approvePayout: async (payoutId: string, adminId: string) => {
        try {
            await updateDoc(doc(db, 'payout_requests', payoutId), {
                status: 'approved',
                processedAt: serverTimestamp(),
                processedBy: adminId
            });

            // Trigger: Cloud Function should listen to this update to deduct balance finally and record transaction 'withdrawal'.
        } catch (error) {
            console.error("Error approving payout:", error);
            throw error;
        }
    },

    rejectPayout: async (payoutId: string, reason: string, adminId: string) => {
        try {
            await updateDoc(doc(db, 'payout_requests', payoutId), {
                status: 'rejected',
                rejectedReason: reason,
                processedAt: serverTimestamp(),
                processedBy: adminId
            });
        } catch (error) {
            console.error("Error rejecting payout:", error);
            throw error;
        }
    },

    // --- Invoices ---

    getMyInvoices: async (tenantId: string) => {
        try {
            const q = query(
                collection(db, 'invoices'),
                where('tenantId', '==', tenantId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        } catch (error) {
            console.error("Error fetching invoices:", error);
            throw error;
        }
    },

    // --- Stats ---

    getPlatformStats: async () => {
        try {
            // 1. Total Revenue (Paid Invoices)
            const invoicesQ = query(collection(db, 'invoices'), where('status', '==', 'paid'));
            const invoicesSnap = await getDocs(invoicesQ);
            const totalRevenue = invoicesSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

            // 2. Commissions Paid (Approved Payouts)
            const approvedPayoutsQ = query(collection(db, 'payout_requests'), where('status', '==', 'approved'));
            const approvedPayoutsSnap = await getDocs(approvedPayoutsQ);
            const totalCommissionsPaid = approvedPayoutsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

            // 3. Pending Payouts
            const pendingPayoutsQ = query(collection(db, 'payout_requests'), where('status', '==', 'pending'));
            const pendingPayoutsSnap = await getDocs(pendingPayoutsQ);
            const pendingPayouts = pendingPayoutsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

            // 4. Profit Margin
            const profitMargin = totalRevenue > 0
                ? Math.round(((totalRevenue - totalCommissionsPaid) / totalRevenue) * 100)
                : 0;

            return {
                totalRevenue,
                totalCommissionsPaid,
                pendingPayouts,
                profitMargin
            };
        } catch (error) {
            console.error("Error fetching platform stats:", error);
            return {
                totalRevenue: 0,
                totalCommissionsPaid: 0,
                pendingPayouts: 0,
                profitMargin: 0
            };
        }
    }
};
