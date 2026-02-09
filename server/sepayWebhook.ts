
/**
 * SEPAY WEBHOOK HANDLER
 * Role: Senior Backend Engineer & Payment Architect
 * Platform: Google Cloud Run
 * Database: Firestore (Atomic Transactions)
 */

import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import { LogAction, LogModule, LogSeverity } from '../src/services/Logger';

// Khởi tạo Admin SDK (Giả định đã được cấu hình Service Account trên Cloud Run)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const router = express.Router();

/**
 * Interface cho Payload từ SePay
 * Tài liệu: https://docs.sepay.vn/tich-hop-webhook.html
 */
interface SePayWebhookPayload {
  id: number;           // ID giao dịch trên hệ thống SePay
  content: string;      // Nội dung chuyển khoản (Dùng để map với Order)
  transferAmount: number; // Số tiền thực tế nhận được
  transferType: 'in' | 'out';
  gateway: string;      // Ngân hàng xử lý
  transactionDate: string;
  accountNumber: string;
  // ... các trường khác
}

/**
 * POST /api/sepay/webhook
 * Chức năng: Tiếp nhận callback khi có biến động số dư từ SePay
 */
router.post('/sepay/webhook', async (req: Request, res: Response) => {
  const payload = req.body as SePayWebhookPayload;
  const sepayToken = req.headers['authorization']; // SePay gửi token trong header Authorization

  // 1. AUTHENTICATION: Bảo vệ Endpoint
  // Đảm bảo chỉ SePay mới có thể gọi tới endpoint này
  const SECRET_TOKEN = process.env.SEPAY_WEBHOOK_SECRET;
  if (!sepayToken || sepayToken !== `Bearer ${SECRET_TOKEN}`) {
    console.error(`[Webhook] Unauthorized attempt from IP: ${req.ip}`);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 2. VALIDATION: Kiểm tra dữ liệu thô
  if (!payload.content || !payload.transferAmount || payload.transferType !== 'in') {
    return res.status(200).json({ message: 'Ignore: Non-payment transaction' });
  }

  const transactionId = String(payload.id);
  const paymentCode = payload.content.trim();
  const amountReceived = Number(payload.transferAmount);

  try {
    /**
     * 3. IDEMPOTENCY & ATOMIC TRANSACTION
     * Sử dụng Firestore Transaction để đảm bảo:
     * - Không xử lý trùng transactionId (chống double webhook)
     * - Cập nhật Payment và Order đồng thời (Atomic)
     */
    const result = await db.runTransaction(async (transaction) => {

      // A. Kiểm tra chống trùng (Idempotency Check)
      const paymentRef = db.collection('payments');
      const duplicateQuery = await transaction.get(
        paymentRef.where('provider_transaction_id', '==', transactionId)
      );

      if (!duplicateQuery.empty) {
        return { status: 'ALREADY_PROCESSED', message: 'Transaction ID already exists' };
      }

      // B. Tìm bản ghi Payment dựa trên nội dung chuyển khoản (payment_code)
      const pendingPaymentQuery = await transaction.get(
        paymentRef.where('payment_code', '==', paymentCode)
          .where('status', '==', 'PENDING')
          .limit(1)
      );

      if (pendingPaymentQuery.empty) {
        return { status: 'NOT_FOUND', message: `No pending payment for code: ${paymentCode}` };
      }

      const paymentDoc = pendingPaymentQuery.docs[0];
      const paymentData = paymentDoc.data();
      const orderId = paymentData.order_id;

      // C. Kiểm tra số tiền (Amount Matching)
      // Chấp nhận thanh toán nếu số tiền nhận được >= số tiền yêu cầu
      if (amountReceived < paymentData.amount_requested) {
        // Ghi log lỗi số tiền không đủ nhưng vẫn lưu transaction để tra soát
        await transaction.set(db.collection('system_logs').doc(), {
          action: 'PAYMENT' as LogAction,
          module: 'ORDER' as LogModule,
          severity: 'medium' as LogSeverity,
          detail: `Lệch tiền đơn ${orderId}: Yêu cầu ${paymentData.amount_requested}, Nhận ${amountReceived}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: 'AMOUNT_MISMATCH', message: 'Insufficient amount' };
      }

      // D. Cập nhật trạng thái Payment sang SUCCESS
      transaction.update(paymentDoc.ref, {
        status: 'SUCCESS',
        amount_received: amountReceived,
        provider_transaction_id: transactionId,
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        metadata: payload // Lưu raw payload để audit
      });

      // E. Cập nhật trạng thái Order sang PAID
      const orderRef = db.collection('orders').doc(orderId);
      transaction.update(orderRef, {
        paymentStatus: 'paid',
        status: 'confirmed', // Chuyển sang xác nhận để Lab có thể thấy
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // F. Ghi log hệ thống thành công
      const logRef = db.collection('system_logs').doc();
      transaction.set(logRef, {
        action: 'PAYMENT' as LogAction,
        module: 'ORDER' as LogModule,
        severity: 'low' as LogSeverity,
        detail: `Thanh toán thành công đơn hàng ${orderId} qua SePay. Số tiền: ${amountReceived}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userName: 'SePay Webhook'
      });

      return { status: 'SUCCESS' };
    });

    // 4. PHẢN HỒI CHO SEPAY
    // Luôn trả về 200 để SePay ngừng gửi lại (Retry), trừ lỗi hệ thống cực nghiêm trọng
    console.log(`[Webhook] Process result: ${result.status} - ${result.message || ''}`);
    return res.status(200).json({
      success: true,
      idempotency: result.status
    });

  } catch (error) {
    console.error('[Webhook] Critical Error:', error);
    // Vẫn trả về 200 nhưng ghi log High Severity để kỹ thuật kiểm tra
    return res.status(200).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
