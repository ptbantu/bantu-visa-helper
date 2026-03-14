export type VisaTypeCode = 'B211A' | 'C312' | 'C313' | 'C314' | 'ITAS' | 'KITAS' | 'Unknown';
export type VisaStatus = '有效' | '即将过期' | '已过期' | '处理中' | 'Active' | 'Expiring Soon' | 'Expired' | 'Processing';

export interface VisaType {
  id: string;
  code: string;
  nameZh: string;
  nameId: string;
  requiresEntry?: boolean;
  isActive?: boolean;
}

export interface Customer {
  id: string;
  passport_no: string;
  name: string;
  phone?: string;
  whatsapp?: string;
}

export interface VisaRecord {
  id: string;
  customerId: string;
  customer?: Customer;
  visaTypeCode: string;
  visaType?: VisaType;
  passport_no: string;
  expiry_date: string;
  is_urgent: boolean;
  reminder_enabled?: boolean;
  entry_date?: string;
  port_of_entry?: string;
  file_url?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility
  customer_name?: string;
  visa_type?: string;
  phone?: string;
  whatsapp?: string;
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
