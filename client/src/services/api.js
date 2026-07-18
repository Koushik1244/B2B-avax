  import axios from 'axios';

  const api = axios.create({
    baseURL: `${
      import.meta.env.VITE_API_URL || 'https://smart-invoicing-assistant.onrender.com'
    }/api`,
  });

  // Attach JWT token to every request
  api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  });

  // Auth
  export const trackActivity = () => api.patch('/auth/activity');
  export const setBusyMode   = (busyMode) => api.patch('/auth/busy-mode', { busyMode });

  // Insights
  export const getInsights = () => api.get('/insights');

  // Customer health
  export const getCustomerHealth = (id) => api.get(`/customers/${id}/health`);

  // Customers
  export const getCustomers   = () => api.get('/customers');
  export const createCustomer = (data) => api.post('/customers', data);
  export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

  // Invoices
  export const getInvoices        = () => api.get('/invoices');
  export const createInvoice      = (data) => api.post('/invoices', data);
  export const updateInvoiceStatus = (id, status) => api.patch(`/invoices/${id}/status`, { status });
  export const deleteInvoice      = (id) => api.delete(`/invoices/${id}`);

  /** Single-invoice reminder evaluation (AI message when SEND/ESCALATE) */
  export const evaluateReminderForInvoice = (invoiceId, body = {}) =>
    api.post(`/reminders/evaluate/${invoiceId}`, body);

  // Payments
  export const simulatePayment = (invoiceId) => api.post('/payments/webhook', { invoiceId });

  // Raw Materials
  export const getRawMaterials        = ()     => api.get('/raw-materials');
  export const createRawMaterial      = (data) => api.post('/raw-materials', data);
  export const getSupplierStats       = ()     => api.get('/raw-materials/analytics/suppliers');
  export const getMaterialAnalytics   = ()     => api.get('/raw-materials/analytics/materials');
  export const getGSTSummary          = ()     => api.get('/raw-materials/analytics/gst');
  export const getMonthlySpend        = ()     => api.get('/raw-materials/analytics/monthly');

  // Inventory
  export const getInventory     = ()          => api.get('/inventory');
  export const createInventory  = (data)      => api.post('/inventory', data);
  export const updateInventory  = (id, data)  => api.patch(`/inventory/${id}`, data);
  export const deleteInventory  = (id)        => api.delete(`/inventory/${id}`);

  // Suppliers
  export const getSuppliers     = ()     => api.get('/suppliers');
  export const createSupplier   = (data) => api.post('/suppliers', data);
  export const deleteSupplier   = (id)   => api.delete(`/suppliers/${id}`);

  // OCR
  export const scanBill = (formData) =>
    api.post('/ocr/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

  // Notifications
  export const getNotifications     = () => api.get('/notifications');
  export const getUnreadCount       = () => api.get('/notifications/unread-count');
  export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
  export const markAllRead          = () => api.patch('/notifications/read-all');
  export const walletNonce  = (address) => api.post('/auth/wallet/nonce', { address });
export const walletVerify = (address, signature) => api.post('/auth/wallet/verify', { address, signature });

  export default api;
