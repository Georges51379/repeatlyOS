// ============================================================
// RepeatlyOS — Mock Data
// ============================================================

export const customers = [
  { id: 1, name: 'Rami Haddad', phone: '+961 70 123 456', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-08', balance: 0, status: 'Active', email: 'rami@email.com', area: 'Beirut', notes: 'Prefers morning slots. Silver car.', nextReminder: '2024-06-20' },
  { id: 2, name: 'Maya Saliba', phone: '+961 71 234 567', type: 'Package', plan: '8 Washes / Month', lastVisit: '2024-06-07', balance: -25, status: 'Unpaid', email: 'maya@email.com', area: 'Jounieh', notes: 'Has 2 cars. Pays via Whish.', nextReminder: '2024-06-15' },
  { id: 3, name: 'Karim Nassar', phone: '+961 76 345 678', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-05', balance: 0, status: 'Expiring Soon', email: 'karim@email.com', area: 'Achrafieh', notes: 'Very punctual.', nextReminder: '2024-06-18' },
  { id: 4, name: 'Nour Khoury', phone: '+961 78 456 789', type: 'Package', plan: '4 Washes / Month', lastVisit: '2024-06-01', balance: -50, status: 'Overdue', email: 'nour@email.com', area: 'Hamra', notes: 'Call before visit.', nextReminder: '2024-06-12' },
  { id: 5, name: 'Elie Khoury', phone: '+961 81 567 890', type: 'Walk-in', plan: '—', lastVisit: '2024-06-09', balance: 0, status: 'Active', email: 'elie@email.com', area: 'Dbayeh', notes: '', nextReminder: '—' },
  { id: 6, name: 'Sarah Abi Raad', phone: '+961 03 678 901', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-06', balance: 0, status: 'Active', email: 'sarah@email.com', area: 'Antelias', notes: 'Prefers female staff.', nextReminder: '2024-06-25' },
  { id: 7, name: 'Jad Bitar', phone: '+961 70 789 012', type: 'Package', plan: 'Premium Detail Package', lastVisit: '2024-05-28', balance: -120, status: 'Unpaid', email: 'jad@email.com', area: 'Verdun', notes: 'Owns BMW. Needs special care.', nextReminder: '2024-06-14' },
  { id: 8, name: 'Bernard Khoury', phone: '+961 71 890 123', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-09', balance: 0, status: 'Active', email: 'bernard@email.com', area: 'Raouché', notes: 'VIP customer.', nextReminder: '2024-06-30' },
];

export const bookings = [
  { id: 1, customer: 'Rami Haddad', service: 'Full Wash', date: '2024-06-11', time: '09:00', staff: 'Tony', status: 'Confirmed', payment: 'Paid', amount: 15 },
  { id: 2, customer: 'Maya Saliba', service: 'Interior Deep Clean', date: '2024-06-11', time: '10:30', staff: 'Sarah', status: 'Confirmed', payment: 'Pending', amount: 35 },
  { id: 3, customer: 'Karim Nassar', service: 'Exterior Wash', date: '2024-06-11', time: '11:00', staff: 'Elie', status: 'Pending', payment: 'Pending', amount: 8 },
  { id: 4, customer: 'Nour Khoury', service: 'Full Wash', date: '2024-06-11', time: '14:00', staff: 'Tony', status: 'Confirmed', payment: 'Overdue', amount: 15 },
  { id: 5, customer: 'Elie Khoury', service: 'Ceramic Detail', date: '2024-06-12', time: '09:00', staff: 'Rami', status: 'Pending', payment: 'Pending', amount: 120 },
  { id: 6, customer: 'Sarah Abi Raad', service: 'Full Wash', date: '2024-06-12', time: '11:00', staff: 'Sarah', status: 'Confirmed', payment: 'Paid', amount: 15 },
  { id: 7, customer: 'Jad Bitar', service: 'Interior Deep Clean', date: '2024-06-10', time: '15:00', staff: 'Elie', status: 'Completed', payment: 'Unpaid', amount: 35 },
  { id: 8, customer: 'Bernard Khoury', service: 'Exterior Wash', date: '2024-06-10', time: '09:30', staff: 'Tony', status: 'Completed', payment: 'Paid', amount: 8 },
  { id: 9, customer: 'Rami Haddad', service: 'Full Wash', date: '2024-06-09', time: '10:00', staff: 'Elie', status: 'Completed', payment: 'Paid', amount: 15 },
  { id: 10, customer: 'Maya Saliba', service: 'Exterior Wash', date: '2024-06-08', time: '13:00', staff: 'Sarah', status: 'No-show', payment: 'Pending', amount: 8 },
];

export const packages = [
  { id: 1, customer: 'Maya Saliba', packageName: '8 Washes / Month', total: 8, used: 5, remaining: 3, expiry: '2024-06-30', status: 'Active', price: 80 },
  { id: 2, customer: 'Nour Khoury', packageName: '4 Washes / Month', total: 4, used: 4, remaining: 0, expiry: '2024-06-15', status: 'Expiring Soon', price: 45 },
  { id: 3, customer: 'Jad Bitar', packageName: 'Premium Detail Package', total: 3, used: 1, remaining: 2, expiry: '2024-07-28', status: 'Active', price: 150 },
  { id: 4, customer: 'Elie Khoury', packageName: '4 Washes / Month', total: 4, used: 2, remaining: 2, expiry: '2024-06-25', status: 'Active', price: 45 },
  { id: 5, customer: 'Sarah Abi Raad', packageName: '8 Washes / Month', total: 8, used: 7, remaining: 1, expiry: '2024-06-18', status: 'Expiring Soon', price: 80 },
  { id: 6, customer: 'Bernard Khoury', packageName: 'Premium Detail Package', total: 3, used: 0, remaining: 3, expiry: '2024-08-09', status: 'Active', price: 150 },
];

export const subscriptions = [
  { id: 1, customer: 'Rami Haddad', plan: 'Monthly Premium Care', renewal: '2024-06-30', amount: 99, paymentStatus: 'Paid', status: 'Active', reminder: 'Sent' },
  { id: 2, customer: 'Karim Nassar', plan: 'Monthly Premium Care', renewal: '2024-06-18', amount: 99, paymentStatus: 'Pending', status: 'Expiring Soon', reminder: 'Pending' },
  { id: 3, customer: 'Sarah Abi Raad', plan: 'Monthly Premium Care', renewal: '2024-06-25', amount: 99, paymentStatus: 'Paid', status: 'Active', reminder: 'Sent' },
  { id: 4, customer: 'Bernard Khoury', plan: 'Monthly Premium Care', renewal: '2024-06-30', amount: 99, paymentStatus: 'Paid', status: 'Active', reminder: 'Not Sent' },
  { id: 5, customer: 'Nour Khoury', plan: 'Monthly Premium Care', renewal: '2024-06-12', amount: 99, paymentStatus: 'Unpaid', status: 'Expiring Soon', reminder: 'Failed' },
  { id: 6, customer: 'Jad Bitar', plan: 'Monthly Premium Care', renewal: '2024-05-20', amount: 99, paymentStatus: 'Unpaid', status: 'Cancelled', reminder: 'Sent' },
];

export const payments = [
  { id: 1, customer: 'Rami Haddad', ref: 'INV-001', amount: 99, method: 'Whish', status: 'Paid', date: '2024-06-01', proof: true },
  { id: 2, customer: 'Maya Saliba', ref: 'INV-002', amount: 80, method: 'Cash', status: 'Partial', date: '2024-06-03', proof: false },
  { id: 3, customer: 'Karim Nassar', ref: 'INV-003', amount: 99, method: 'Bank Transfer', status: 'Pending', date: '2024-06-05', proof: false },
  { id: 4, customer: 'Nour Khoury', ref: 'INV-004', amount: 50, method: 'Cash', status: 'Overdue', date: '2024-05-20', proof: false },
  { id: 5, customer: 'Elie Khoury', ref: 'INV-005', amount: 120, method: 'Card Later', status: 'Pending', date: '2024-06-08', proof: false },
  { id: 6, customer: 'Sarah Abi Raad', ref: 'INV-006', amount: 99, method: 'Whish', status: 'Paid', date: '2024-06-01', proof: true },
  { id: 7, customer: 'Jad Bitar', ref: 'INV-007', amount: 150, method: 'OMT', status: 'Overdue', date: '2024-05-15', proof: false },
  { id: 8, customer: 'Bernard Khoury', ref: 'INV-008', amount: 99, method: 'Bank Transfer', status: 'Paid', date: '2024-06-02', proof: true },
];

export const tasks = [
  { id: 1, customer: 'Rami Haddad', service: 'Full Wash', staff: 'Tony', time: '09:00', payment: 'Paid', notes: 'Silver BMW 3 Series', column: 'inprogress' },
  { id: 2, customer: 'Maya Saliba', service: 'Weekly Cleaning', staff: 'Sarah', time: '10:30', payment: 'Pending', notes: '2 cars, exterior only', column: 'todo' },
  { id: 3, customer: 'Karim Nassar', service: 'AC Maintenance', staff: 'Elie', time: '11:00', payment: 'Paid', notes: 'Check refrigerant levels', column: 'todo' },
  { id: 4, customer: 'Nour Khoury', service: 'Laundry Pickup', staff: 'Rami', time: '14:00', payment: 'Overdue', notes: '3 bags. Call before arrival.', column: 'issue' },
  { id: 5, customer: 'Elie Khoury', service: 'Ceramic Detail', staff: 'Tony', time: '09:00', payment: 'Pending', notes: 'Full exterior ceramic coat', column: 'todo' },
  { id: 6, customer: 'Sarah Abi Raad', service: 'Interior Deep Clean', staff: 'Sarah', time: '15:00', payment: 'Paid', notes: 'White interior, be careful', column: 'completed' },
  { id: 7, customer: 'Bernard Khoury', service: 'Exterior Wash', staff: 'Elie', time: '09:30', payment: 'Paid', notes: 'VIP — use premium products', column: 'completed' },
];

export const reminders = [
  { id: 1, customer: 'Karim Nassar', type: 'Renewal Reminder', due: '2024-06-13', channel: 'WhatsApp', status: 'Pending', phone: '+961 76 345 678', message: "Hello Karim, this is a reminder that your Monthly Premium Care subscription renews on June 18. Please ensure your payment is ready. Thank you — Elite Auto Spa." },
  { id: 2, customer: 'Nour Khoury', type: 'Unpaid Payment', due: '2024-06-12', channel: 'WhatsApp', status: 'Overdue', phone: '+961 78 456 789', message: "Hello Nour, your balance of $50 is overdue. Please settle your payment at your earliest convenience. Thank you — Elite Auto Spa." },
  { id: 3, customer: 'Maya Saliba', type: 'Package Expiry', due: '2024-06-14', channel: 'WhatsApp', status: 'Pending', phone: '+961 71 234 567', message: "Hello Maya, your 8 Washes / Month package expires on June 30 and you have 3 sessions remaining. Would you like to renew? — Elite Auto Spa." },
  { id: 4, customer: 'Rami Haddad', type: 'Booking Confirmation', due: '2024-06-11', channel: 'WhatsApp', status: 'Sent', phone: '+961 70 123 456', message: "Hello Rami, your Full Wash is confirmed for June 11 at 09:00. See you then! — Elite Auto Spa." },
  { id: 5, customer: 'Jad Bitar', type: 'Follow-up After Service', due: '2024-06-11', channel: 'WhatsApp', status: 'Pending', phone: '+961 70 789 012', message: "Hello Jad, how was your service at Elite Auto Spa? We'd love your feedback! Reply to let us know." },
  { id: 6, customer: 'Sarah Abi Raad', type: 'Renewal Reminder', due: '2024-06-20', channel: 'WhatsApp', status: 'Scheduled', phone: '+961 03 678 901', message: "Hello Sarah, your Monthly Premium Care subscription renews on June 25. Thank you for being a valued customer — Elite Auto Spa." },
];

export const revenueData = [
  { month: 'Jan', revenue: 5200, bookings: 68 },
  { month: 'Feb', revenue: 4800, bookings: 62 },
  { month: 'Mar', revenue: 6100, bookings: 79 },
  { month: 'Apr', revenue: 7300, bookings: 94 },
  { month: 'May', revenue: 7800, bookings: 101 },
  { month: 'Jun', revenue: 8420, bookings: 112 },
];

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

export const staff = ['Tony', 'Elie', 'Sarah', 'Rami'];

export const services = [
  { id: 1, name: 'Exterior Wash', price: 8, duration: '30 min', description: 'Complete exterior hand wash with drying and window cleaning.' },
  { id: 2, name: 'Full Wash', price: 15, duration: '45 min', description: 'Interior vacuum + exterior wash. Our most popular service.' },
  { id: 3, name: 'Interior Deep Clean', price: 35, duration: '90 min', description: 'Full interior detailing including seats, carpets, and surfaces.' },
  { id: 4, name: 'Ceramic Detail', price: 120, duration: '4 hours', description: 'Professional ceramic coating application with full prep wash.' },
];

export const publicPackages = [
  { id: 1, name: '4 Washes / Month', price: 45, sessions: 4, description: 'Perfect for weekly wash customers.' },
  { id: 2, name: '8 Washes / Month', price: 80, sessions: 8, description: 'Best value for frequent visitors.' },
  { id: 3, name: 'Premium Detail Package', price: 150, sessions: 3, description: '3 full detail services with priority booking.' },
];

export const publicSubscription = {
  name: 'Monthly Premium Care',
  price: 99,
  includes: ['4 exterior washes', '1 interior deep clean', 'Priority booking', 'WhatsApp reminders'],
  description: 'Our all-inclusive monthly plan for car owners who want consistent care without the hassle.',
};

export const reviews = [
  { id: 1, name: 'Rami H.', rating: 5, text: 'Amazing service. The team is professional and always on time. My car has never looked better.', date: '2024-06-08' },
  { id: 2, name: 'Maya S.', rating: 5, text: 'Best car wash in Beirut. The package deal is worth every penny. Highly recommend!', date: '2024-06-05' },
  { id: 3, name: 'Karim N.', rating: 4, text: 'Great results every time. Small wait sometimes but quality makes up for it.', date: '2024-06-01' },
  { id: 4, name: 'Sarah A.', rating: 5, text: 'Love the WhatsApp reminders! Easy to book, excellent results. 10/10.', date: '2024-05-28' },
];
