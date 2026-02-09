import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to track Views and Conversions for a specific page/product.
 * @param collectionName 'properties' | 'services' | 'projects'
 * @param docId The ID of the document to track
 */
export const useAnalytics = (collectionName: string, docId?: string) => {
    const viewTracked = useRef(false);

    useEffect(() => {
        if (!docId || viewTracked.current) return;

        const trackView = async () => {
            try {
                const docRef = doc(db, collectionName, docId);
                // Use updateDoc with increment for atomic updates
                // We assume the document exists. If not, we might need setDoc with merge (but for products it should exist)

                // Check if doc exists first to avoid crashing on 404s
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    await updateDoc(docRef, {
                        views: increment(1),
                        lastViewedAt: serverTimestamp()
                    });
                }
            } catch (error) {
                console.error(`Analytics Error (View) for ${collectionName}/${docId}:`, error);
            }
        };

        trackView();
        viewTracked.current = true;
    }, [collectionName, docId]);

    /**
     * Call this when a user submits a form or performs a conversion action
     */
    const trackConversion = async () => {
        if (!docId) return;
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                leads: increment(1),
                lastLeadAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Analytics Error (Conversion) for ${collectionName}/${docId}:`, error);
        }
    };

    return { trackConversion };
};
