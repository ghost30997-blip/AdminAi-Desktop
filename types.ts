
export interface DataRow {
  [key: string]: string | number;
}

export interface MergeField {
  id: string;
  name: string;
  column: string;
}

export type FieldMapping = Record<string, string>;

export enum AppStep {
  UPLOAD_DATA = 0,
  CONFIRM_DATA = 1,
  UPLOAD_TEMPLATE = 2,
  EDITOR = 3,
  GENERATE = 4
}

export enum AppModule {
  CERTIFICATES = 'certificates',
  CONTRACTS = 'contracts',
  ATTENDANCE = 'attendance',
  TEMPLATES = 'templates',
  ADMIN = 'admin',
  WHATSAPP = 'whatsapp'
}

export interface GeneratedFile {
  id: string;
  fileName: string;
  status: 'pending' | 'success' | 'error';
  content?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image';
  text?: string;
  src?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface PresentationData {
  zip: any;
  slidesCount: number;
  width: number;
  height: number;
  type: 'pptx' | 'docx';
}

export interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'image' | 'pdf' | 'doc';
  size?: string;
  updatedAt: string;
  parentId?: string | null;
  driveLink?: string;
  webViewLink?: string; 
  content?: File | Blob;
  synced?: boolean;
  metadata?: {
    mimetype: string;
    size: number;
  };
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  cpf?: string;
  rg?: string;
  pendingFiles?: File[];
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  status: string;
  trainingName: string;
  cnpj?: string;
  rg?: string;
  birthDate?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  type: 'individual' | 'enterprise' | 'student';
  avatarColor: string;
  lastContact: string;
  tags: string[];
  employees?: Employee[];
  folderId?: string;
  updated_at?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  paymentDate?: string;
  paymentStatus?: 'paid' | 'pending';
  hasPaidRegistration?: boolean;
  planType?: 'monthly' | 'single';
}

export interface Training {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  days?: string;
  shifts?: string[];
  hasRegistrationFee?: boolean;
  registrationFeeValue?: number;
}

export interface CrmColumn {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  createdAt: string;
  updated_at?: string;
}

export interface SystemSettings {
  companyName: string;
  cnpj: string;
  email: string;
  themeColor: string;
  customColor?: string;
  logo?: string;
  crmColumns: CrmColumn[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleClientId?: string;
  googleRootFolderId?: string;
  googleFolders?: Record<string, string>;
}

export interface PresentationTemplate {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  contentBase64: string;
  type?: 'pptx' | 'docx';
}
