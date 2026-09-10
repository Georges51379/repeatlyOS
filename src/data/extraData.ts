// Extended mock data for enhanced demo features

export const invoices = [
  { id: 'INV-2024-001', customer: 'Rami Haddad', items: [{ name: 'Monthly Premium Care', qty: 1, price: 99 }], total: 99, status: 'Paid', date: '2024-06-01', dueDate: '2024-06-07', method: 'Whish' },
  { id: 'INV-2024-002', customer: 'Maya Saliba', items: [{ name: '8 Washes / Month', qty: 1, price: 80 }], total: 80, status: 'Partial', date: '2024-06-03', dueDate: '2024-06-10', method: 'Cash' },
  { id: 'INV-2024-003', customer: 'Karim Nassar', items: [{ name: 'Monthly Premium Care', qty: 1, price: 99 }], total: 99, status: 'Pending', date: '2024-06-05', dueDate: '2024-06-12', method: 'Bank Transfer' },
  { id: 'INV-2024-004', customer: 'Nour Khoury', items: [{ name: 'Full Wash', qty: 3, price: 15 }], total: 45, status: 'Overdue', date: '2024-05-20', dueDate: '2024-05-27', method: 'Cash' },
  { id: 'INV-2024-005', customer: 'Jad Bitar', items: [{ name: 'Premium Detail Package', qty: 1, price: 150 }], total: 150, status: 'Overdue', date: '2024-05-15', dueDate: '2024-05-22', method: 'OMT' },
  { id: 'INV-2024-006', customer: 'Sarah Abi Raad', items: [{ name: 'Monthly Premium Care', qty: 1, price: 99 }], total: 99, status: 'Paid', date: '2024-06-01', dueDate: '2024-06-07', method: 'Whish' },
  { id: 'INV-2024-007', customer: 'Bernard Khoury', items: [{ name: 'Monthly Premium Care', qty: 1, price: 99 }], total: 99, status: 'Paid', date: '2024-06-02', dueDate: '2024-06-09', method: 'Bank Transfer' },
  { id: 'INV-2024-008', customer: 'Elie Khoury', items: [{ name: 'Ceramic Detail', qty: 1, price: 120 }], total: 120, status: 'Pending', date: '2024-06-08', dueDate: '2024-06-15', method: 'Card Later' },
];

export const renewalHistory = [
  { id: 1, customer: 'Rami Haddad', plan: 'Monthly Premium Care', renewedOn: '2024-06-01', amount: 99, method: 'Whish', months: 4 },
  { id: 2, customer: 'Sarah Abi Raad', plan: 'Monthly Premium Care', renewedOn: '2024-06-01', amount: 99, method: 'Whish', months: 2 },
  { id: 3, customer: 'Bernard Khoury', plan: 'Monthly Premium Care', renewedOn: '2024-06-02', amount: 99, method: 'Bank Transfer', months: 7 },
  { id: 4, customer: 'Karim Nassar', plan: 'Monthly Premium Care', renewedOn: '2024-05-18', amount: 99, method: 'Cash', months: 1 },
];

export const fullActivityLog = [
  { id: 1, time: '11:45', date: 'Today', type: 'subscription', icon: '🔄', text: 'Sarah Abi Raad subscription renewed', sub: 'Monthly Premium Care · $99' },
  { id: 2, time: '11:00', date: 'Today', type: 'booking', icon: '📅', text: 'New booking — Elie Khoury', sub: 'Ceramic Detail · June 12, 09:00' },
  { id: 3, time: '10:22', date: 'Today', type: 'reminder', icon: '💬', text: 'Reminder sent to Karim Nassar', sub: 'Renewal due June 18' },
  { id: 4, time: '10:05', date: 'Today', type: 'payment', icon: '💵', text: 'Payment received · Bernard Khoury', sub: '$99 via Bank Transfer' },
  { id: 5, time: '09:30', date: 'Today', type: 'package', icon: '📦', text: 'Session consumed · Maya Saliba', sub: '8 Washes / Month · 3 remaining' },
  { id: 6, time: '09:12', date: 'Today', type: 'booking', icon: '✅', text: 'Rami Haddad checked in', sub: 'Full Wash · Tony assigned' },
  { id: 7, time: '17:30', date: 'Yesterday', type: 'payment', icon: '💵', text: 'Payment overdue — Nour Khoury', sub: '$50 · Cash unpaid since May 20' },
  { id: 8, time: '16:00', date: 'Yesterday', type: 'task', icon: '✔️', text: 'Task completed · Bernard Khoury', sub: 'Exterior Wash by Elie' },
  { id: 9, time: '14:30', date: 'Yesterday', type: 'booking', icon: '❌', text: 'No-show — Maya Saliba', sub: 'Exterior Wash · 13:00' },
  { id: 10, time: '09:00', date: 'Yesterday', type: 'booking', icon: '📅', text: 'Booking completed · Rami Haddad', sub: 'Full Wash · Tony · $15 paid' },
];

export const quickStats = {
  totalCustomers: 8,
  totalBookingsThisMonth: 47,
  avgRevenuePerCustomer: 312,
  churnRisk: 3,
  newCustomersThisMonth: 2,
  repeatRate: 91,
};

export const serviceData = [
  { name: 'Full Wash', value: 38 },
  { name: 'Exterior Wash', value: 28 },
  { name: 'Interior Deep Clean', value: 20 },
  { name: 'Ceramic Detail', value: 14 },
];

export const staffData = [
  { name: 'Tony', tasks: 34, completed: 31, rating: 4.9 },
  { name: 'Elie', tasks: 28, completed: 25, rating: 4.7 },
  { name: 'Sarah', tasks: 22, completed: 22, rating: 5.0 },
  { name: 'Rami', tasks: 18, completed: 15, rating: 4.5 },
];

export const testimonialData = [
  { name: 'Rami H.', rating: 5, text: 'Amazing service. Always on time and my car has never looked better.', date: '2024-06-08', service: 'Full Wash' },
  { name: 'Maya S.', rating: 5, text: 'Best car wash in Beirut. The package deal is worth every penny.', date: '2024-06-05', service: 'Interior Deep Clean' },
  { name: 'Karim N.', rating: 4, text: 'Great results every time. Small wait sometimes but quality makes up for it.', date: '2024-06-01', service: 'Exterior Wash' },
  { name: 'Sarah A.', rating: 5, text: 'Love the WhatsApp reminders! Easy to book, excellent results.', date: '2024-05-28', service: 'Full Wash' },
];
