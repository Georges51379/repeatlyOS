import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { businesses } from '../data/businesses';
import type { BusinessKey, BusinessTemplate } from '../data/businesses';

// ── Extended types for new features ──────────────────────────────────────────

export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  staffName?: string; // links to business.staff[]
  avatar: string;
  lastLogin: string;
  twoFA: boolean;
  active: boolean;
}

export interface CustomerTag { id: number; label: string; color: string; }

export interface CustomField {
  id: number;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  options?: string[]; // for select type
  required: boolean;
}

export interface RecurringRule {
  id: number;
  customerId: number;
  customerName: string;
  service: string;
  staff: string;
  time: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number; // 0=Sun
  startDate: string;
  endDate: string;
  active: boolean;
  bookingsCreated: number;
}

export interface NoShowRecord {
  customerId: number;
  customerName: string;
  date: string;
  service: string;
  type: 'no_show' | 'late_cancel';
}

export interface PartialPayment {
  id: number;
  customerId: number;
  customerName: string;
  totalAmount: number;
  installments: { id: number; amount: number; dueDate: string; paid: boolean; paidDate?: string; method?: string }[];
  note: string;
  createdAt: string;
}

export interface ShiftEntry {
  id: number;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'off' | 'leave';
  note?: string;
}

export interface ClockEntry {
  id: number;
  staffName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  entity: string;
  detail: string;
  ip: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  pinned: boolean;
  readBy: string[];
}

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner:   ['*'],
  manager: ['bookings','customers','payments','invoices','tasks','staff','reminders','broadcast','packages','subscriptions','products','inventory','reports','activity','occasions','waitlist','forecast','commissions','expenses','referrals','health','heatmap','goals','reorder'],
  staff:   ['bookings','customers','tasks','reminders','calendar'],
  viewer:  ['reports','activity','health'],
};

export function canAccess(role: UserRole, page: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes('*') || perms.includes(page);
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_USERS: AppUser[] = [
  { id:1, name:'Ahmad Khalil',  email:'ahmad@eliteautospa.lb',   role:'owner',   avatar:'A', lastLogin:'2024-06-11 09:00', twoFA:true,  active:true },
  { id:2, name:'Lara Mansour',  email:'lara@eliteautospa.lb',    role:'manager', avatar:'L', lastLogin:'2024-06-11 08:30', twoFA:false, active:true },
  { id:3, name:'Tony Saab',     email:'tony@eliteautospa.lb',    role:'staff',   staffName:'Tony', avatar:'T', lastLogin:'2024-06-10 17:00', twoFA:false, active:true },
  { id:4, name:'Mirna Haddad',  email:'mirna@eliteautospa.lb',   role:'viewer',  avatar:'M', lastLogin:'2024-06-09 12:00', twoFA:false, active:true },
];

const SEED_TAGS: CustomerTag[] = [
  { id:1, label:'VIP',          color:'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id:2, label:'Corporate',    color:'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id:3, label:'Problematic',  color:'bg-red-500/20 text-red-400 border-red-500/30' },
  { id:4, label:'Friend',       color:'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id:5, label:'Seasonal',     color:'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id:6, label:'New',          color:'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

const SEED_CUSTOM_FIELDS: CustomField[] = [
  { id:1, label:'Car Model',        type:'text',   required:false },
  { id:2, label:'Preferred Staff',  type:'select', options:['Tony','Mirna','Rami','Sara'], required:false },
  { id:3, label:'Allergies',        type:'text',   required:false },
  { id:4, label:'Building Floor',   type:'number', required:false },
];

const SEED_RECURRING: RecurringRule[] = [
  { id:1, customerId:1, customerName:'Rami Haddad',    service:'Full Detail',     staff:'Tony',  time:'10:00', frequency:'weekly',   dayOfWeek:6, startDate:'2024-06-01', endDate:'2024-08-31', active:true, bookingsCreated:5 },
  { id:2, customerId:2, customerName:'Layla Khoury',   service:'Express Wash',    staff:'Mirna', time:'09:00', frequency:'biweekly', dayOfWeek:3, startDate:'2024-06-01', endDate:'2024-07-31', active:true, bookingsCreated:3 },
  { id:3, customerId:5, customerName:'Sara Nassar',    service:'Interior Clean',  staff:'Tony',  time:'14:00', frequency:'monthly',  dayOfWeek:1, startDate:'2024-05-01', endDate:'2024-12-31', active:false, bookingsCreated:2 },
];

const SEED_NOSHOWS: NoShowRecord[] = [
  { customerId:3, customerName:'Omar Farhat',   date:'2024-06-03', service:'Full Detail',  type:'no_show' },
  { customerId:3, customerName:'Omar Farhat',   date:'2024-05-20', service:'Express Wash', type:'late_cancel' },
  { customerId:7, customerName:'Karim Aziz',    date:'2024-06-08', service:'Polish & Wax', type:'no_show' },
];

const SEED_PARTIAL_PAYMENTS: PartialPayment[] = [
  { id:1, customerId:4, customerName:'Maya Rizk', totalAmount:300, createdAt:'2024-06-01',
    note:'Package payment — 3 installments',
    installments:[
      { id:1, amount:100, dueDate:'2024-06-01',  paid:true,  paidDate:'2024-06-01', method:'Cash' },
      { id:2, amount:100, dueDate:'2024-07-01',  paid:false },
      { id:3, amount:100, dueDate:'2024-08-01',  paid:false },
    ]},
  { id:2, customerId:2, customerName:'Layla Khoury', totalAmount:150, createdAt:'2024-06-05',
    note:'Annual package partial payment',
    installments:[
      { id:1, amount:75, dueDate:'2024-06-05',  paid:true,  paidDate:'2024-06-05', method:'Whish' },
      { id:2, amount:75, dueDate:'2024-07-05',  paid:false },
    ]},
];

const SEED_SHIFTS: ShiftEntry[] = [
  { id:1,  staffName:'Tony',  date:'2024-06-11', startTime:'08:00', endTime:'17:00', type:'work' },
  { id:2,  staffName:'Mirna', date:'2024-06-11', startTime:'09:00', endTime:'18:00', type:'work' },
  { id:3,  staffName:'Rami',  date:'2024-06-11', startTime:'08:00', endTime:'16:00', type:'work' },
  { id:4,  staffName:'Tony',  date:'2024-06-12', startTime:'08:00', endTime:'17:00', type:'work' },
  { id:5,  staffName:'Mirna', date:'2024-06-12', startTime:'09:00', endTime:'18:00', type:'work' },
  { id:6,  staffName:'Rami',  date:'2024-06-12', startTime:'00:00', endTime:'00:00', type:'off' },
  { id:7,  staffName:'Tony',  date:'2024-06-13', startTime:'08:00', endTime:'17:00', type:'work' },
  { id:8,  staffName:'Sara',  date:'2024-06-11', startTime:'10:00', endTime:'16:00', type:'work' },
  { id:9,  staffName:'Sara',  date:'2024-06-12', startTime:'00:00', endTime:'00:00', type:'leave', note:'Medical leave' },
];

const SEED_CLOCKS: ClockEntry[] = [
  { id:1, staffName:'Tony',  date:'2024-06-11', clockIn:'07:58', clockOut:'17:03', totalHours:9.08 },
  { id:2, staffName:'Mirna', date:'2024-06-11', clockIn:'09:05', clockOut:'18:00', totalHours:8.92 },
  { id:3, staffName:'Rami',  date:'2024-06-11', clockIn:'08:00',                                   },
  { id:4, staffName:'Tony',  date:'2024-06-10', clockIn:'08:02', clockOut:'17:00', totalHours:8.97 },
  { id:5, staffName:'Mirna', date:'2024-06-10', clockIn:'09:10', clockOut:'18:05', totalHours:8.92 },
];

const SEED_AUDIT: AuditEntry[] = [
  { id:1,  timestamp:'2024-06-11 09:14', user:'Ahmad Khalil',  role:'owner',   action:'Created',  entity:'Booking',  detail:'New booking for Rami Haddad — Full Detail at 10:00',       ip:'192.168.1.1' },
  { id:2,  timestamp:'2024-06-11 09:08', user:'Lara Mansour',  role:'manager', action:'Updated',  entity:'Payment',  detail:'Marked PAY-0041 as Paid — $120 via Cash',                  ip:'192.168.1.2' },
  { id:3,  timestamp:'2024-06-11 08:55', user:'Tony Saab',     role:'staff',   action:'Moved',    entity:'Task',     detail:'Task for Omar Farhat moved to Completed',                   ip:'192.168.1.3' },
  { id:4,  timestamp:'2024-06-10 17:30', user:'Ahmad Khalil',  role:'owner',   action:'Deleted',  entity:'Invoice',  detail:'Invoice INV-0038 deleted — duplicate entry',                ip:'192.168.1.1' },
  { id:5,  timestamp:'2024-06-10 16:20', user:'Lara Mansour',  role:'manager', action:'Created',  entity:'Customer', detail:'New customer Maya Rizk added — Subscription plan',          ip:'192.168.1.2' },
  { id:6,  timestamp:'2024-06-10 15:00', user:'Ahmad Khalil',  role:'owner',   action:'Updated',  entity:'Settings', detail:'Commission rate for Tony updated: 12% → 15%',              ip:'192.168.1.1' },
  { id:7,  timestamp:'2024-06-10 14:45', user:'Mirna Haddad',  role:'viewer',  action:'Viewed',   entity:'Report',   detail:'Monthly revenue report viewed',                             ip:'192.168.1.4' },
  { id:8,  timestamp:'2024-06-10 12:30', user:'Tony Saab',     role:'staff',   action:'Updated',  entity:'Booking',  detail:'Booking for Layla Khoury status changed: Pending → Confirmed', ip:'192.168.1.3' },
  { id:9,  timestamp:'2024-06-09 11:00', user:'Ahmad Khalil',  role:'owner',   action:'Exported', entity:'Report',   detail:'Customer list exported as CSV — 47 records',               ip:'192.168.1.1' },
  { id:10, timestamp:'2024-06-09 09:30', user:'Lara Mansour',  role:'manager', action:'Created',  entity:'Broadcast',detail:'WhatsApp broadcast sent to 12 expiring subscription customers', ip:'192.168.1.2' },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id:1, title:'New cleaning protocol — READ BEFORE SHIFT', body:'Starting June 12, all staff must use the new eco-friendly cleaning product for interior services. Bottles are in the supply closet. Do NOT mix with old product.', author:'Ahmad Khalil', createdAt:'2024-06-10 08:00', pinned:true, readBy:['Tony','Mirna'] },
  { id:2, title:'Saturday overtime approved', body:'Due to high booking volume this Saturday, all staff working past 5pm will receive 1.5x pay rate. Please confirm your availability with the manager.', author:'Lara Mansour', createdAt:'2024-06-09 14:00', pinned:false, readBy:['Tony'] },
  { id:3, title:'Monthly team meeting — June 15', body:'Mandatory team meeting this Saturday at 7pm after closing. Topics: June performance, new package pricing, customer feedback review.', author:'Ahmad Khalil', createdAt:'2024-06-08 10:00', pinned:false, readBy:[] },
];

// ── Context type ──────────────────────────────────────────────────────────────
interface DemoContextType {
  business: BusinessTemplate;
  businessKey: BusinessKey;
  setBusiness: (key: BusinessKey) => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  walkthroughOpen: boolean;
  setWalkthroughOpen: (v: boolean) => void;
  lang: 'EN' | 'AR';
  setLang: (l: 'EN' | 'AR') => void;
  // New enterprise state
  currentUser: AppUser;
  setCurrentUser: (u: AppUser) => void;
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
  tags: CustomerTag[];
  setTags: (t: CustomerTag[]) => void;
  customFields: CustomField[];
  setCustomFields: (f: CustomField[]) => void;
  customerTags: Record<number, number[]>; // customerId → tagIds
  setCustomerTags: (t: Record<number, number[]>) => void;
  customerFieldValues: Record<number, Record<number, string>>; // customerId → fieldId → value
  setCustomerFieldValues: (v: Record<number, Record<number, string>>) => void;
  recurringRules: RecurringRule[];
  setRecurringRules: (r: RecurringRule[]) => void;
  noShows: NoShowRecord[];
  setNoShows: (n: NoShowRecord[]) => void;
  partialPayments: PartialPayment[];
  setPartialPayments: (p: PartialPayment[]) => void;
  shifts: ShiftEntry[];
  setShifts: (s: ShiftEntry[]) => void;
  clocks: ClockEntry[];
  setClocks: (c: ClockEntry[]) => void;
  auditLog: AuditEntry[];
  setAuditLog: (a: AuditEntry[]) => void;
  announcements: Announcement[];
  setAnnouncements: (a: Announcement[]) => void;
  exchangeRate: number; // USD → LBP
  setExchangeRate: (r: number) => void;
  vatRate: number; // percentage
  setVatRate: (r: number) => void;
  currency: 'USD' | 'LBP' | 'BOTH';
  setCurrency: (c: 'USD' | 'LBP' | 'BOTH') => void;
  theme: 'dark' | 'light' | 'auto';
  setTheme: (t: 'dark' | 'light' | 'auto') => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [businessKey, setBusinessKey] = useState<BusinessKey>('elite-auto-spa');
  const [commandOpen, setCommandOpen]       = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [lang, setLang]                     = useState<'EN' | 'AR'>('EN');
  const [currentUser, setCurrentUser]       = useState<AppUser>(SEED_USERS[0]);
  const [users, setUsers]                   = useState<AppUser[]>(SEED_USERS);
  const [tags, setTags]                     = useState<CustomerTag[]>(SEED_TAGS);
  const [customFields, setCustomFields]     = useState<CustomField[]>(SEED_CUSTOM_FIELDS);
  const [customerTags, setCustomerTags]     = useState<Record<number, number[]>>({ 1:[1,2], 2:[4], 4:[1,5], 7:[3] });
  const [customerFieldValues, setCustomerFieldValues] = useState<Record<number, Record<number, string>>>({ 1:{ 1:'BMW 530i', 2:'Tony', 4:'3' }, 2:{ 1:'Toyota Camry' }, 3:{ 1:'Mercedes C200', 2:'Mirna' } });
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(SEED_RECURRING);
  const [noShows, setNoShows]               = useState<NoShowRecord[]>(SEED_NOSHOWS);
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>(SEED_PARTIAL_PAYMENTS);
  const [shifts, setShifts]                 = useState<ShiftEntry[]>(SEED_SHIFTS);
  const [clocks, setClocks]                 = useState<ClockEntry[]>(SEED_CLOCKS);
  const [auditLog, setAuditLog]             = useState<AuditEntry[]>(SEED_AUDIT);
  const [announcements, setAnnouncements]   = useState<Announcement[]>(SEED_ANNOUNCEMENTS);
  const [exchangeRate, setExchangeRate]     = useState(89500);
  const [vatRate, setVatRate]               = useState(11);
  const [currency, setCurrency]             = useState<'USD' | 'LBP' | 'BOTH'>('USD');
  const [theme, setTheme]                   = useState<'dark' | 'light' | 'auto'>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const setBusiness = (key: BusinessKey) => setBusinessKey(key);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(v => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const applied = theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    root.classList.toggle('light-mode', applied === 'light');
  }, [theme]);

  return (
    <DemoContext.Provider value={{
      business: businesses[businessKey], businessKey, setBusiness,
      commandOpen, setCommandOpen, walkthroughOpen, setWalkthroughOpen,
      lang, setLang, currentUser, setCurrentUser, users, setUsers,
      tags, setTags, customFields, setCustomFields,
      customerTags, setCustomerTags, customerFieldValues, setCustomerFieldValues,
      recurringRules, setRecurringRules, noShows, setNoShows,
      partialPayments, setPartialPayments, shifts, setShifts,
      clocks, setClocks, auditLog, setAuditLog, announcements, setAnnouncements,
      exchangeRate, setExchangeRate, vatRate, setVatRate,
      currency, setCurrency, theme, setTheme,
      sidebarCollapsed, setSidebarCollapsed,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
