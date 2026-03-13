export type VisaType = 'B211A' | 'C312' | 'C313' | 'C314' | 'Other';
export type VisaStatus = '有效' | '即将过期' | '已过期' | '处理中' | 'Active' | 'Expiring Soon' | 'Expired' | 'Processing';

export interface VisaRecord {
  passport_no: string;
  expiry_date: string;
  customer_name: string;
  visa_type: string;
  is_urgent: boolean;
  entry_date?: string;
  port_of_entry?: string;
  phone?: string;
  whatsapp?: string;
  reminder_enabled?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  passport: string;
  nationality: string;
  company?: string;
}

export interface Visa {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easy display
  passport: string; // Denormalized
  nationality: string; // Denormalized
  type: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  progress?: number;
  company?: string;
}

export interface Reminder {
  id: string;
  visaId: string;
  customerName: string;
  passport: string;
  type: string;
  expiryDate: string;
  daysLeft: number;
  stage: string;
  status: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: string;
  details: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface AppSettings {
  emailConfig: {
    account: string;
    passwordPlaceholder: string;
    filter: string;
    frequency: number;
  };
  pushConfig: {
    wecomWebhook: string;
    voiceBotApiKeyPlaceholder: string;
    callTime: string;
    receiver: string;
  };
}
