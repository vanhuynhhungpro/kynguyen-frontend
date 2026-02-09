export const generateInvoiceHtml = (plan: { name: string; price: number; duration?: string }) => {
    const invoiceId = `INV-${new Date().getTime().toString().slice(-6)}`;
    const date = new Date().toLocaleDateString('vi-VN');
    const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price);

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <title>Hóa Đơn Thanh Toán - ${invoiceId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
              @media print { .no-print { display: none; } }
          </style>
      </head>
      <body class="bg-slate-50 min-h-screen p-8 md:p-12">
          
          <div class="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
              <!-- Watermark -->
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-slate-50 rotate-[-15deg] pointer-events-none uppercase tracking-widest whitespace-nowrap z-0">
                  Thanh Toán
              </div>
  
              <div class="relative z-10">
                  <!-- Header -->
                  <div class="flex justify-between items-start mb-12">
                      <div>
                          <h1 class="text-3xl font-black text-indigo-600 tracking-tight uppercase mb-2">KyNguyen<span class="text-slate-800">RealAI</span></h1>
                          <p class="text-slate-500 text-sm font-medium">Nền tảng Quản lý & Marketing BĐS Tự động</p>
                      </div>
                      <div class="text-right">
                          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Số hóa đơn</p>
                          <p class="text-lg font-black text-slate-800">#${invoiceId}</p>
                          <p class="text-sm text-slate-500 font-medium mt-1">Ngày: ${date}</p>
                      </div>
                  </div>
  
                  <!-- Bill To -->
                  <div class="mb-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Thông tin dịch vụ</p>
                      <div class="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
                          <span class="font-bold text-slate-700">Gói Dịch Vụ</span>
                          <span class="font-black text-slate-800 text-lg">${plan.name} Plan</span>
                      </div>
                      <div class="flex justify-between items-center">
                          <span class="font-bold text-slate-700">Thời hạn</span>
                          <span class="font-medium text-slate-600">${plan.duration || '01 Tháng'}</span>
                      </div>
                  </div>
  
                  <!-- Total -->
                  <div class="flex justify-end mb-12">
                      <div class="text-right">
                          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tổng thanh toán</p>
                          <p class="text-4xl font-black text-indigo-600 tracking-tight">${amount}</p>
                      </div>
                  </div>
  
                  <!-- Banking Info -->
                  <div class="bg-indigo-50/50 p-8 rounded-2xl border border-indigo-100 mb-8 border-dashed border-2">
                      <div class="flex items-center gap-4 mb-6">
                          <div class="size-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                              <span class="text-2xl">🏦</span>
                          </div>
                          <div>
                              <p class="text-xs font-bold text-indigo-400 uppercase tracking-widest">Thông tin chuyển khoản</p>
                              <p class="font-black text-indigo-900 text-lg">Ngân hàng MB Bank (Quân Đội)</p>
                          </div>
                      </div>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Số tài khoản</p>
                              <div class="flex items-center gap-2">
                                  <p class="text-2xl font-black text-slate-800 font-mono tracking-wider">0969888888</p>
                                  <button onclick="navigator.clipboard.writeText('0969888888'); alert('Đã sao chép STK!')" class="text-indigo-500 hover:text-indigo-700 text-xs font-bold bg-white px-2 py-1 rounded border border-indigo-100 no-print">COPY</button>
                              </div>
                          </div>
                          <div>
                              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Chủ tài khoản</p>
                              <p class="text-xl font-bold text-slate-800 uppercase">NGUYEN VAN A</p>
                          </div>
                      </div>
  
                      <div class="mt-6 pt-6 border-t border-indigo-200/50">
                          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nội dung chuyển khoản</p>
                          <p class="font-mono bg-white p-3 rounded-lg border border-indigo-100 text-indigo-600 font-bold inline-block border-dashed">
                              PAY ${invoiceId}
                          </p>
                      </div>
                  </div>
  
                  <!-- Footer -->
                  <div class="text-center">
                      <p class="text-slate-400 text-xs italic mb-8">Vui lòng hoàn tất thanh toán trong vòng 24h. Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền.</p>
                      
                      <button onclick="window.print()" class="no-print bg-slate-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-33 23.5-56.5T160-600h640q33 0 56.5 23.5T880-520v240H720v160Zm80-240v-160q0-50-35-85t-85-35H240q-50 0-85 35t-35 85v160h120v-80h480v80h120Z"/></svg>
                          In Hóa Đơn
                      </button>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
};
