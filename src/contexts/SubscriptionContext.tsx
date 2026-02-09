
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useBranding } from './BrandingContext';
import { SubscriptionPlan, FeatureKey, DEFAULT_PLANS } from '../types/subscription';
import { Link } from 'react-router-dom';
import UpgradeModal from '../components/common/UpgradeModal';

interface SubscriptionContextType {
    currentPlan: SubscriptionPlan | null;
    isLoading: boolean;
    hasFeature: (key: FeatureKey) => boolean;
    checkLimit: (limitKey: keyof SubscriptionPlan['limits'], currentValue: number) => boolean;
    showUpgradeModal: boolean;
    setShowUpgradeModal: (show: boolean) => void;
    featureLabel: (key: FeatureKey) => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tenantId } = useBranding();
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!tenantId) {
                setIsLoading(false);
                return;
            }

            try {
                // 1. Get Tenant's Plan ID from 'subscriptions' collection (or tenants collection if embedded)
                // Assuming 'subscriptions/{tenantId}' matches the structure in TenantRegister.tsx
                const subSnap = await getDoc(doc(db, 'subscriptions', tenantId));
                let planId = 'basic'; // Default fallback

                if (subSnap.exists()) {
                    planId = subSnap.data().plan || 'basic';
                } else {
                    // Fallback to tenant doc if subscription doc missing
                    const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
                    if (tenantSnap.exists()) {
                        planId = tenantSnap.data().plan || 'basic';
                    }
                }

                // 2. Get Plan Details (Feature Matrix)
                const planSnap = await getDoc(doc(db, 'subscription_plans', planId));

                if (planSnap.exists()) {
                    setCurrentPlan({ id: planSnap.id, ...planSnap.data() } as SubscriptionPlan);
                } else {
                    // Fallback to hardcoded defaults if plan doc not found in DB
                    const defaultPlan = DEFAULT_PLANS.find(p => p.id === planId) || DEFAULT_PLANS[0];
                    setCurrentPlan(defaultPlan);
                }

            } catch (error) {
                console.error("Error fetching subscription:", error);
                // Fallback to basic on error
                setCurrentPlan(DEFAULT_PLANS[0]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();
    }, [tenantId]);

    const hasFeature = (key: FeatureKey): boolean => {
        if (!currentPlan) return false;
        // Super Admin or special cases could be handled here if needed, 
        // but typically Super Admin has their own separate checks.
        return currentPlan.featureFlags?.[key] === true;
    };

    const checkLimit = (limitKey: keyof SubscriptionPlan['limits'], currentValue: number): boolean => {
        if (!currentPlan) return false;
        const limit = currentPlan.limits[limitKey];
        if (limit === -1) return true; // Unlimited
        return currentValue < limit;
    };

    const featureLabel = (key: FeatureKey): string => {
        // Can import CANONICAL_FEATURES here if needed for labels
        return key;
    };

    return (
        <SubscriptionContext.Provider value={{
            currentPlan,
            isLoading,
            hasFeature,
            checkLimit,
            showUpgradeModal,
            setShowUpgradeModal,
            featureLabel
        }}>
            {children}

            {/* Global Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </SubscriptionContext.Provider>
    );
};
