
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE' | 'PAYMENT' | 'PRINT' | 'REVIEW';
export type LogModule = 'ORDER' | 'PROPERTY' | 'NEWS' | 'USER' | 'CUSTOMER' | 'SETTING' | 'CONSULTATION' | 'FINANCE' | 'APPOINTMENT' | 'PROJECT' | 'SYSTEM';
export type LogSeverity = 'low' | 'medium' | 'high';

export const createSystemLog = async (
  action: LogAction,
  module: LogModule,
  detail: string,
  userProfile: any,
  severity: LogSeverity = 'low'
) => {
  try {
    await addDoc(collection(db, 'system_logs'), {
      action,
      module,
      detail,
      userId: userProfile?.uid || 'anonymous',
      userName: userProfile?.fullName || 'System',
      timestamp: serverTimestamp(),
      severity
    });
  } catch (e) {
    console.error("Failed to write system log:", e);
  }
};
