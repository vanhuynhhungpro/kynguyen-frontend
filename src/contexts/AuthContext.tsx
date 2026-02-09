
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'marketing' | 'user';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  company?: string;
  accountType?: string;
  role: UserRole;
  tenantId?: string; // Tenant ID for isolation
  referredBy?: string | null; // Affiliate Referrer ID
  createdAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, company: string, phone: string, accountType: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign Up - Mặc định là 'user', Admin sẽ cấp quyền doctor/marketing sau trong hệ thống quản trị
  const register = async (email: string, password: string, fullName: string, company: string, phone: string, accountType: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const profileData: UserProfile = {
      uid: result.user.uid,
      email: email,
      fullName: fullName,
      phone: phone,
      company: company,
      accountType: accountType,
      role: 'user',
      createdAt: new Date(),
      referredBy: localStorage.getItem('REF_CODE') || null // Capture Affiliate Ref
    };

    await setDoc(doc(db, "users", result.user.uid), profileData);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
