export type BusinessKey = 'elite-auto-spa' | 'freshhome-cleaning' | 'north-fitness' | 'quick-laundry' | 'fixpro-maintenance';

export interface BusinessTemplate {
  key: BusinessKey;
  name: string;
  emoji: string;
  category: string;
  tagline: string;
  area: string;
  rating: string;
  reviewCount: number;
  color: string;
  engines: string[];
  kpis: {
    todayBookings: number;
    activeSubscriptions: number;
    expiringThisWeek: number;
    unpaidCustomers: number;
    revenueThisMonth: number;
    sessionsRemaining: number;
  };
  services: { name: string; price: number; duration: string; description: string }[];
  packages: { name: string; price: number; sessions: number; description: string }[];
  subscription: { name: string; price: number; includes: string[]; description: string };
  products: {
    id: number; name: string; category: string; price: number; cost: number;
    stock: number; lowStockAt: number; unit: string; sku: string; image: string; status: string;
  }[];
  customers: {
    id: number; name: string; phone: string; type: string; plan: string;
    lastVisit: string; balance: number; status: string; area: string; notes: string;
  }[];
  bookings: {
    id: number; customer: string; service: string; date: string; time: string;
    staff: string; status: string; payment: string; amount: number;
  }[];
  staff: string[];
  tasks: {
    id: number; customer: string; service: string; staff: string;
    time: string; payment: string; notes: string; column: string;
  }[];
  payments: {
    id: number; customer: string; ref: string; amount: number;
    method: string; status: string; date: string; proof: boolean;
  }[];
  revenueData: { month: string; revenue: number; bookings: number }[];
}

export const businesses: Record<BusinessKey, BusinessTemplate> = {
  'elite-auto-spa': {
    key: 'elite-auto-spa',
    name: 'Elite Auto Spa',
    emoji: '🚗',
    category: 'Car Wash & Detailing',
    tagline: 'Premium car wash & detailing — packages, subscriptions, and same-day bookings.',
    area: 'Beirut, Lebanon',
    rating: '4.9',
    reviewCount: 48,
    color: 'blue',
    engines: ['Booking Engine', 'Package Engine', 'Subscription Engine', 'Payment Engine', 'Reminder Engine'],
    kpis: { todayBookings: 18, activeSubscriptions: 126, expiringThisWeek: 14, unpaidCustomers: 22, revenueThisMonth: 8420, sessionsRemaining: 312 },
    services: [
      { name: 'Exterior Wash', price: 8, duration: '30 min', description: 'Complete exterior hand wash with drying and window cleaning.' },
      { name: 'Full Wash', price: 15, duration: '45 min', description: 'Interior vacuum + exterior wash. Our most popular service.' },
      { name: 'Interior Deep Clean', price: 35, duration: '90 min', description: 'Full interior detailing including seats, carpets, and surfaces.' },
      { name: 'Ceramic Detail', price: 120, duration: '4 hours', description: 'Professional ceramic coating application with full prep wash.' },
    ],
    packages: [
      { name: '4 Washes / Month', price: 45, sessions: 4, description: 'Perfect for weekly wash customers.' },
      { name: '8 Washes / Month', price: 80, sessions: 8, description: 'Best value for frequent visitors.' },
      { name: 'Premium Detail Package', price: 150, sessions: 3, description: '3 full detail services with priority booking.' },
    ],
    subscription: {
      name: 'Monthly Premium Care',
      price: 99,
      includes: ['4 exterior washes', '1 interior deep clean', 'Priority booking', 'WhatsApp reminders'],
      description: 'All-inclusive monthly plan for car owners who want consistent care.',
    },
    products: [
      { id: 1, name: 'Air Freshener (New Car Scent)', category: 'Accessories', price: 4, cost: 1.5, stock: 42, lowStockAt: 10, unit: 'pcs', sku: 'ACC-001', image: '🌲', status: 'Active' },
      { id: 2, name: 'Microfiber Towel Set', category: 'Accessories', price: 12, cost: 5, stock: 18, lowStockAt: 8, unit: 'pcs', sku: 'ACC-002', image: '🧽', status: 'Active' },
      { id: 3, name: 'Tire Shine Spray', category: 'Car Care', price: 9, cost: 4, stock: 6, lowStockAt: 8, unit: 'pcs', sku: 'CAR-010', image: '🧴', status: 'Active' },
      { id: 4, name: 'Cold Water Bottle', category: 'Drinks', price: 1, cost: 0.3, stock: 84, lowStockAt: 20, unit: 'pcs', sku: 'DRK-001', image: '💧', status: 'Active' },
      { id: 5, name: 'Soft Drink Can', category: 'Drinks', price: 1.5, cost: 0.6, stock: 0, lowStockAt: 15, unit: 'pcs', sku: 'DRK-002', image: '🥤', status: 'Out of Stock' },
      { id: 6, name: 'Dashboard Polish', category: 'Car Care', price: 14, cost: 6, stock: 22, lowStockAt: 10, unit: 'pcs', sku: 'CAR-011', image: '✨', status: 'Active' },
    ],
    customers: [
      { id: 1, name: 'Rami Haddad', phone: '+961 70 123 456', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-08', balance: 0, status: 'Active', area: 'Beirut', notes: 'Prefers morning slots. Silver car.' },
      { id: 2, name: 'Maya Saliba', phone: '+961 71 234 567', type: 'Package', plan: '8 Washes / Month', lastVisit: '2024-06-07', balance: -25, status: 'Unpaid', area: 'Jounieh', notes: 'Has 2 cars. Pays via Whish.' },
      { id: 3, name: 'Karim Nassar', phone: '+961 76 345 678', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-05', balance: 0, status: 'Expiring Soon', area: 'Achrafieh', notes: 'Very punctual.' },
      { id: 4, name: 'Nour Khoury', phone: '+961 78 456 789', type: 'Package', plan: '4 Washes / Month', lastVisit: '2024-06-01', balance: -50, status: 'Overdue', area: 'Hamra', notes: 'Call before visit.' },
      { id: 5, name: 'Elie Khoury', phone: '+961 81 567 890', type: 'Walk-in', plan: '—', lastVisit: '2024-06-09', balance: 0, status: 'Active', area: 'Dbayeh', notes: '' },
      { id: 6, name: 'Bernard Khoury', phone: '+961 71 890 123', type: 'Subscription', plan: 'Monthly Premium Care', lastVisit: '2024-06-09', balance: 0, status: 'Active', area: 'Raouché', notes: 'VIP customer.' },
    ],
    bookings: [
      { id: 1, customer: 'Rami Haddad', service: 'Full Wash', date: '2024-06-11', time: '09:00', staff: 'Tony', status: 'Confirmed', payment: 'Paid', amount: 15 },
      { id: 2, customer: 'Maya Saliba', service: 'Interior Deep Clean', date: '2024-06-11', time: '10:30', staff: 'Sarah', status: 'Confirmed', payment: 'Pending', amount: 35 },
      { id: 3, customer: 'Karim Nassar', service: 'Exterior Wash', date: '2024-06-11', time: '11:00', staff: 'Elie', status: 'Pending', payment: 'Pending', amount: 8 },
      { id: 4, customer: 'Nour Khoury', service: 'Full Wash', date: '2024-06-11', time: '14:00', staff: 'Tony', status: 'Confirmed', payment: 'Overdue', amount: 15 },
      { id: 5, customer: 'Elie Khoury', service: 'Ceramic Detail', date: '2024-06-12', time: '09:00', staff: 'Rami', status: 'Pending', payment: 'Pending', amount: 120 },
      { id: 6, customer: 'Bernard Khoury', service: 'Exterior Wash', date: '2024-06-10', time: '09:30', staff: 'Tony', status: 'Completed', payment: 'Paid', amount: 8 },
    ],
    staff: ['Tony', 'Elie', 'Sarah', 'Rami'],
    tasks: [
      { id: 1, customer: 'Rami Haddad', service: 'Full Wash', staff: 'Tony', time: '09:00', payment: 'Paid', notes: 'Silver BMW 3 Series', column: 'inprogress' },
      { id: 2, customer: 'Maya Saliba', service: 'Interior Deep Clean', staff: 'Sarah', time: '10:30', payment: 'Pending', notes: '2 cars, exterior only', column: 'todo' },
      { id: 3, customer: 'Karim Nassar', service: 'Exterior Wash', staff: 'Elie', time: '11:00', payment: 'Paid', notes: 'Check for scratches after wash', column: 'todo' },
      { id: 4, customer: 'Nour Khoury', service: 'Full Wash', staff: 'Rami', time: '14:00', payment: 'Overdue', notes: 'Customer has unpaid balance.', column: 'issue' },
      { id: 5, customer: 'Bernard Khoury', service: 'Exterior Wash', staff: 'Elie', time: '09:30', payment: 'Paid', notes: 'VIP — use premium products', column: 'completed' },
    ],
    payments: [
      { id: 1, customer: 'Rami Haddad', ref: 'INV-001', amount: 99, method: 'Whish', status: 'Paid', date: '2024-06-01', proof: true },
      { id: 2, customer: 'Maya Saliba', ref: 'INV-002', amount: 80, method: 'Cash', status: 'Partial', date: '2024-06-03', proof: false },
      { id: 3, customer: 'Karim Nassar', ref: 'INV-003', amount: 99, method: 'Bank Transfer', status: 'Pending', date: '2024-06-05', proof: false },
      { id: 4, customer: 'Nour Khoury', ref: 'INV-004', amount: 50, method: 'Cash', status: 'Overdue', date: '2024-05-20', proof: false },
      { id: 5, customer: 'Bernard Khoury', ref: 'INV-005', amount: 99, method: 'Bank Transfer', status: 'Paid', date: '2024-06-02', proof: true },
    ],
    revenueData: [
      { month: 'Jan', revenue: 5200, bookings: 68 }, { month: 'Feb', revenue: 4800, bookings: 62 },
      { month: 'Mar', revenue: 6100, bookings: 79 }, { month: 'Apr', revenue: 7300, bookings: 94 },
      { month: 'May', revenue: 7800, bookings: 101 }, { month: 'Jun', revenue: 8420, bookings: 112 },
    ],
  },

  'freshhome-cleaning': {
    key: 'freshhome-cleaning',
    name: 'FreshHome Cleaning',
    emoji: '🧹',
    category: 'Cleaning Company',
    tagline: 'Weekly and bi-weekly home cleaning services — recurring visits, customer contracts.',
    area: 'Jounieh, Lebanon',
    rating: '4.8',
    reviewCount: 61,
    color: 'emerald',
    engines: ['Booking Engine', 'Subscription Engine', 'Payment Engine', 'Reminder Engine'],
    kpis: { todayBookings: 12, activeSubscriptions: 84, expiringThisWeek: 9, unpaidCustomers: 17, revenueThisMonth: 5640, sessionsRemaining: 0 },
    services: [
      { name: 'Standard Clean', price: 35, duration: '2 hours', description: 'Kitchen, bathrooms, living areas, vacuuming and mopping.' },
      { name: 'Deep Clean', price: 75, duration: '4 hours', description: 'Full deep clean including inside appliances, windows, and baseboards.' },
      { name: 'Post-Construction Clean', price: 150, duration: '6+ hours', description: 'Heavy-duty cleanup after renovation or construction.' },
      { name: 'Move-In / Move-Out', price: 90, duration: '5 hours', description: 'Thorough cleaning for property handovers.' },
    ],
    packages: [
      { name: 'Weekly Plan (4 visits)', price: 120, sessions: 4, description: 'One standard clean per week.' },
      { name: 'Bi-Weekly Plan (2 visits)', price: 65, sessions: 2, description: 'Clean every two weeks.' },
      { name: 'Deep Clean Bundle (3x)', price: 200, sessions: 3, description: '3 deep cleans with priority scheduling.' },
    ],
    subscription: {
      name: 'Monthly Home Care',
      price: 149,
      includes: ['4 standard cleans', 'Priority scheduling', 'Same cleaner every time', 'WhatsApp reminders'],
      description: 'Consistent weekly cleaning by a dedicated team member you trust.',
    },
    products: [
      { id: 1, name: 'Eco Multi-Surface Cleaner', category: 'Cleaning Supplies', price: 8, cost: 3, stock: 36, lowStockAt: 10, unit: 'bottles', sku: 'CLN-001', image: '🧴', status: 'Active' },
      { id: 2, name: 'Microfiber Cloth Pack (5x)', category: 'Cleaning Supplies', price: 10, cost: 4, stock: 24, lowStockAt: 8, unit: 'packs', sku: 'CLN-002', image: '🧽', status: 'Active' },
      { id: 3, name: 'Air Freshener Spray', category: 'Home Care', price: 6, cost: 2, stock: 5, lowStockAt: 8, unit: 'pcs', sku: 'HOM-010', image: '🌸', status: 'Active' },
      { id: 4, name: 'Laundry Detergent (Pet-Safe)', category: 'Cleaning Supplies', price: 15, cost: 7, stock: 12, lowStockAt: 6, unit: 'bottles', sku: 'CLN-003', image: '🧺', status: 'Active' },
      { id: 5, name: 'Disposable Gloves Box', category: 'Supplies', price: 5, cost: 2, stock: 0, lowStockAt: 10, unit: 'boxes', sku: 'SUP-001', image: '🧤', status: 'Out of Stock' },
    ],
    customers: [
      { id: 1, name: 'Lara Gemayel', phone: '+961 70 111 001', type: 'Subscription', plan: 'Monthly Home Care', lastVisit: '2024-06-07', balance: 0, status: 'Active', area: 'Jounieh', notes: 'Has 2 dogs. Use pet-safe products.' },
      { id: 2, name: 'Pierre Rahme', phone: '+961 71 222 002', type: 'Package', plan: 'Weekly Plan (4 visits)', lastVisit: '2024-06-05', balance: -35, status: 'Unpaid', area: 'Dbayeh', notes: 'Key kept with doorman.' },
      { id: 3, name: 'Nadine Sarkis', phone: '+961 76 333 003', type: 'Subscription', plan: 'Monthly Home Care', lastVisit: '2024-06-01', balance: 0, status: 'Expiring Soon', area: 'Antelias', notes: 'Prefers mornings before 11am.' },
      { id: 4, name: 'Michel Aoun', phone: '+961 78 444 004', type: 'Package', plan: 'Bi-Weekly Plan (2 visits)', lastVisit: '2024-05-28', balance: -70, status: 'Overdue', area: 'Metn', notes: 'Office cleaning. Has 3 floors.' },
      { id: 5, name: 'Rita Hanna', phone: '+961 03 555 005', type: 'Subscription', plan: 'Monthly Home Care', lastVisit: '2024-06-09', balance: 0, status: 'Active', area: 'Zouk', notes: 'New customer. Very satisfied.' },
      { id: 6, name: 'Jad Frangieh', phone: '+961 81 666 006', type: 'Walk-in', plan: '—', lastVisit: '2024-06-04', balance: -150, status: 'Overdue', area: 'Byblos', notes: 'Post-construction. Refused to pay balance.' },
    ],
    bookings: [
      { id: 1, customer: 'Lara Gemayel', service: 'Standard Clean', date: '2024-06-11', time: '09:00', staff: 'Maria', status: 'Confirmed', payment: 'Paid', amount: 35 },
      { id: 2, customer: 'Pierre Rahme', service: 'Weekly Plan', date: '2024-06-11', time: '10:00', staff: 'Hana', status: 'Confirmed', payment: 'Pending', amount: 30 },
      { id: 3, customer: 'Nadine Sarkis', service: 'Standard Clean', date: '2024-06-11', time: '11:00', staff: 'Maria', status: 'Pending', payment: 'Pending', amount: 35 },
      { id: 4, customer: 'Michel Aoun', service: 'Deep Clean', date: '2024-06-12', time: '09:00', staff: 'Joe', status: 'Pending', payment: 'Overdue', amount: 75 },
      { id: 5, customer: 'Rita Hanna', service: 'Standard Clean', date: '2024-06-12', time: '14:00', staff: 'Hana', status: 'Confirmed', payment: 'Paid', amount: 35 },
    ],
    staff: ['Maria', 'Hana', 'Joe', 'Charbel'],
    tasks: [
      { id: 1, customer: 'Lara Gemayel', service: 'Standard Clean', staff: 'Maria', time: '09:00', payment: 'Paid', notes: 'Pet-safe products only', column: 'inprogress' },
      { id: 2, customer: 'Pierre Rahme', service: 'Weekly Clean', staff: 'Hana', time: '10:00', payment: 'Pending', notes: 'Key with doorman, Floor 3', column: 'todo' },
      { id: 3, customer: 'Michel Aoun', service: 'Deep Clean', staff: 'Joe', time: '09:00', payment: 'Overdue', notes: 'Customer has unpaid balance — collect first', column: 'issue' },
      { id: 4, customer: 'Jad Frangieh', service: 'Post-Construction', staff: 'Charbel', time: '13:00', payment: 'Overdue', notes: 'Refused payment — escalate', column: 'issue' },
      { id: 5, customer: 'Rita Hanna', service: 'Standard Clean', staff: 'Hana', time: '14:00', payment: 'Paid', notes: 'New customer. Be thorough.', column: 'completed' },
    ],
    payments: [
      { id: 1, customer: 'Lara Gemayel', ref: 'INV-101', amount: 149, method: 'Whish', status: 'Paid', date: '2024-06-01', proof: true },
      { id: 2, customer: 'Pierre Rahme', ref: 'INV-102', amount: 120, method: 'Cash', status: 'Partial', date: '2024-06-03', proof: false },
      { id: 3, customer: 'Nadine Sarkis', ref: 'INV-103', amount: 149, method: 'Bank Transfer', status: 'Pending', date: '2024-06-05', proof: false },
      { id: 4, customer: 'Michel Aoun', ref: 'INV-104', amount: 70, method: 'Cash', status: 'Overdue', date: '2024-05-15', proof: false },
      { id: 5, customer: 'Jad Frangieh', ref: 'INV-105', amount: 150, method: 'OMT', status: 'Overdue', date: '2024-05-10', proof: false },
    ],
    revenueData: [
      { month: 'Jan', revenue: 3800, bookings: 52 }, { month: 'Feb', revenue: 3600, bookings: 48 },
      { month: 'Mar', revenue: 4200, bookings: 58 }, { month: 'Apr', revenue: 4800, bookings: 66 },
      { month: 'May', revenue: 5200, bookings: 71 }, { month: 'Jun', revenue: 5640, bookings: 78 },
    ],
  },

  'north-fitness': {
    key: 'north-fitness',
    name: 'North Fitness Club',
    emoji: '🏋️',
    category: 'Gym & Sports Academy',
    tagline: 'Monthly memberships, class packages, and renewal tracking for fitness members.',
    area: 'Tripoli, Lebanon',
    rating: '4.7',
    reviewCount: 93,
    color: 'purple',
    engines: ['Package Engine', 'Subscription Engine', 'Reminder Engine', 'Payment Engine'],
    kpis: { todayBookings: 34, activeSubscriptions: 218, expiringThisWeek: 27, unpaidCustomers: 31, revenueThisMonth: 11240, sessionsRemaining: 580 },
    services: [
      { name: 'Day Pass', price: 8, duration: 'Full day', description: 'Single-day gym access with all facilities.' },
      { name: 'Personal Training Session', price: 40, duration: '1 hour', description: 'One-on-one session with a certified trainer.' },
      { name: 'Group Class', price: 12, duration: '45 min', description: 'HIIT, Yoga, Spinning, or Zumba group classes.' },
      { name: 'Nutrition Consultation', price: 50, duration: '1 hour', description: 'Custom nutrition plan with a certified dietitian.' },
    ],
    packages: [
      { name: '10 Classes Package', price: 100, sessions: 10, description: 'Use for any group classes. Valid 60 days.' },
      { name: '5 PT Sessions', price: 175, sessions: 5, description: '5 personal training sessions with your assigned trainer.' },
      { name: 'Student Bundle (20 sessions)', price: 140, sessions: 20, description: 'Best for students — 20 gym entries at a discounted rate.' },
    ],
    subscription: {
      name: 'Monthly Membership',
      price: 65,
      includes: ['Unlimited gym access', '2 group classes / week', 'Locker access', 'Monthly fitness check-in'],
      description: 'Full gym access all month with included weekly classes.',
    },
    products: [
      { id: 1, name: 'Whey Protein (1kg)', category: 'Supplements', price: 38, cost: 22, stock: 14, lowStockAt: 5, unit: 'tubs', sku: 'SUP-101', image: '🥤', status: 'Active' },
      { id: 2, name: 'Pre-Workout Energy Drink', category: 'Drinks', price: 3, cost: 1, stock: 60, lowStockAt: 15, unit: 'cans', sku: 'DRK-101', image: '⚡', status: 'Active' },
      { id: 3, name: 'Gym Towel (Branded)', category: 'Merch', price: 10, cost: 4, stock: 30, lowStockAt: 10, unit: 'pcs', sku: 'MER-001', image: '🏋️', status: 'Active' },
      { id: 4, name: 'North Fitness T-Shirt', category: 'Merch', price: 18, cost: 8, stock: 22, lowStockAt: 8, unit: 'pcs', sku: 'MER-002', image: '👕', status: 'Active' },
      { id: 5, name: 'Shaker Bottle', category: 'Merch', price: 8, cost: 3, stock: 4, lowStockAt: 8, unit: 'pcs', sku: 'MER-003', image: '🧴', status: 'Active' },
      { id: 6, name: 'Energy Bar (Box of 12)', category: 'Snacks', price: 24, cost: 14, stock: 0, lowStockAt: 5, unit: 'boxes', sku: 'SNK-001', image: '🍫', status: 'Out of Stock' },
    ],
    customers: [
      { id: 1, name: 'Ahmad Karami', phone: '+961 70 700 001', type: 'Subscription', plan: 'Monthly Membership', lastVisit: '2024-06-10', balance: 0, status: 'Active', area: 'Tripoli', notes: 'Prefers early morning. Assigned to Coach Samer.' },
      { id: 2, name: 'Dina Mrad', phone: '+961 71 800 002', type: 'Package', plan: '10 Classes Package', lastVisit: '2024-06-08', balance: -12, status: 'Unpaid', area: 'Mina', notes: 'Missed last 2 classes. Call to re-engage.' },
      { id: 3, name: 'Omar Fayyad', phone: '+961 76 900 003', type: 'Subscription', plan: 'Monthly Membership', lastVisit: '2024-06-07', balance: 0, status: 'Expiring Soon', area: 'Tripoli', notes: 'Renewal due June 15.' },
      { id: 4, name: 'Hana Srour', phone: '+961 78 100 004', type: 'Package', plan: '5 PT Sessions', lastVisit: '2024-06-05', balance: -40, status: 'Overdue', area: 'Koura', notes: 'Owes for 1 PT session.' },
      { id: 5, name: 'Samir Hajj', phone: '+961 03 200 005', type: 'Subscription', plan: 'Monthly Membership', lastVisit: '2024-06-09', balance: 0, status: 'Active', area: 'Tripoli', notes: 'Brings 2 friends regularly.' },
      { id: 6, name: 'Rana Makhoul', phone: '+961 81 300 006', type: 'Package', plan: 'Student Bundle', lastVisit: '2024-06-03', balance: 0, status: 'Active', area: 'Mina', notes: 'Student discount applied.' },
    ],
    bookings: [
      { id: 1, customer: 'Ahmad Karami', service: 'Personal Training', date: '2024-06-11', time: '07:00', staff: 'Samer', status: 'Confirmed', payment: 'Paid', amount: 40 },
      { id: 2, customer: 'Dina Mrad', service: 'Group Class', date: '2024-06-11', time: '09:00', staff: 'Layla', status: 'Confirmed', payment: 'Pending', amount: 12 },
      { id: 3, customer: 'Omar Fayyad', service: 'Group Class', date: '2024-06-11', time: '10:00', staff: 'Layla', status: 'Pending', payment: 'Pending', amount: 12 },
      { id: 4, customer: 'Hana Srour', service: 'Personal Training', date: '2024-06-12', time: '08:00', staff: 'Samer', status: 'Pending', payment: 'Overdue', amount: 40 },
      { id: 5, customer: 'Samir Hajj', service: 'Nutrition Consult', date: '2024-06-12', time: '11:00', staff: 'Rania', status: 'Confirmed', payment: 'Paid', amount: 50 },
    ],
    staff: ['Samer', 'Layla', 'Rania', 'Karim'],
    tasks: [
      { id: 1, customer: 'Ahmad Karami', service: 'PT Session', staff: 'Samer', time: '07:00', payment: 'Paid', notes: 'Focus on upper body today', column: 'inprogress' },
      { id: 2, customer: 'Dina Mrad', service: 'Group HIIT', staff: 'Layla', time: '09:00', payment: 'Pending', notes: 'Collect session fee before class', column: 'todo' },
      { id: 3, customer: 'Hana Srour', service: 'PT Session', staff: 'Samer', time: '08:00', payment: 'Overdue', notes: 'Owes $40 — do not start until paid', column: 'issue' },
      { id: 4, customer: 'Rana Makhoul', service: 'Spinning Class', staff: 'Layla', time: '07:30', payment: 'Paid', notes: 'Regular — no issues', column: 'completed' },
    ],
    payments: [
      { id: 1, customer: 'Ahmad Karami', ref: 'INV-201', amount: 65, method: 'Bank Transfer', status: 'Paid', date: '2024-06-01', proof: true },
      { id: 2, customer: 'Dina Mrad', ref: 'INV-202', amount: 100, method: 'Cash', status: 'Partial', date: '2024-06-03', proof: false },
      { id: 3, customer: 'Omar Fayyad', ref: 'INV-203', amount: 65, method: 'Whish', status: 'Pending', date: '2024-06-07', proof: false },
      { id: 4, customer: 'Hana Srour', ref: 'INV-204', amount: 40, method: 'Cash', status: 'Overdue', date: '2024-05-20', proof: false },
      { id: 5, customer: 'Samir Hajj', ref: 'INV-205', amount: 65, method: 'Whish', status: 'Paid', date: '2024-06-01', proof: true },
    ],
    revenueData: [
      { month: 'Jan', revenue: 8400, bookings: 112 }, { month: 'Feb', revenue: 7900, bookings: 104 },
      { month: 'Mar', revenue: 9200, bookings: 128 }, { month: 'Apr', revenue: 10100, bookings: 138 },
      { month: 'May', revenue: 10800, bookings: 147 }, { month: 'Jun', revenue: 11240, bookings: 156 },
    ],
  },

  'quick-laundry': {
    key: 'quick-laundry',
    name: 'QuickLaundry',
    emoji: '👕',
    category: 'Laundry Pickup & Delivery',
    tagline: 'Scheduled laundry pickup and delivery — recurring weekly rounds, driver tasks.',
    area: 'Hamra, Beirut',
    rating: '4.6',
    reviewCount: 37,
    color: 'cyan',
    engines: ['Booking Engine', 'Package Engine', 'Payment Engine', 'Reminder Engine'],
    kpis: { todayBookings: 8, activeSubscriptions: 52, expiringThisWeek: 6, unpaidCustomers: 14, revenueThisMonth: 3280, sessionsRemaining: 94 },
    services: [
      { name: 'Wash & Fold (per kg)', price: 3, duration: 'Next day', description: 'Regular clothes wash, dry, and fold. Pickup & delivery included.' },
      { name: 'Dry Clean (per item)', price: 8, duration: '2 days', description: 'Professional dry cleaning for suits, dresses, and delicates.' },
      { name: 'Duvet / Blanket', price: 15, duration: '2 days', description: 'Large item laundry service.' },
      { name: 'Express (same day)', price: 20, duration: 'Same day', description: 'Priority washing and delivery before 8pm.' },
    ],
    packages: [
      { name: 'Weekly 5kg Bundle', price: 55, sessions: 4, description: '4 weekly pickups of up to 5kg each.' },
      { name: 'Monthly Dry Clean (8 items)', price: 55, sessions: 8, description: '8 dry clean slots per month.' },
      { name: 'Family Bundle (10 pickups)', price: 120, sessions: 10, description: '10 pickups up to 8kg each.' },
    ],
    subscription: {
      name: 'Weekly Laundry Plan',
      price: 59,
      includes: ['Weekly 5kg pickup', 'Free delivery', 'Priority wash', 'WhatsApp updates'],
      description: 'Never worry about laundry again — scheduled every week, automatically.',
    },
    products: [
      { id: 1, name: 'Fabric Softener (1L)', category: 'Laundry Supplies', price: 7, cost: 3, stock: 28, lowStockAt: 8, unit: 'bottles', sku: 'LND-001', image: '🧴', status: 'Active' },
      { id: 2, name: 'Garment Bags (Pack of 10)', category: 'Packaging', price: 6, cost: 2, stock: 40, lowStockAt: 10, unit: 'packs', sku: 'PKG-001', image: '👔', status: 'Active' },
      { id: 3, name: 'Stain Remover Pen', category: 'Laundry Supplies', price: 4, cost: 1.5, stock: 15, lowStockAt: 6, unit: 'pcs', sku: 'LND-002', image: '✏️', status: 'Active' },
      { id: 4, name: 'Premium Hangers (Set of 10)', category: 'Accessories', price: 9, cost: 4, stock: 3, lowStockAt: 8, unit: 'sets', sku: 'ACC-201', image: '🪝', status: 'Active' },
      { id: 5, name: 'Scented Laundry Beads', category: 'Laundry Supplies', price: 8, cost: 3, stock: 0, lowStockAt: 10, unit: 'bags', sku: 'LND-003', image: '🌺', status: 'Out of Stock' },
    ],
    customers: [
      { id: 1, name: 'Celine Abou Jaoude', phone: '+961 70 010 101', type: 'Subscription', plan: 'Weekly Laundry Plan', lastVisit: '2024-06-08', balance: 0, status: 'Active', area: 'Hamra', notes: 'No fabric softener. Pickup Sundays.' },
      { id: 2, name: 'Tony Rizk', phone: '+961 71 020 202', type: 'Package', plan: 'Weekly 5kg Bundle', lastVisit: '2024-06-06', balance: -15, status: 'Unpaid', area: 'Ras Beirut', notes: 'Leave bags with building security.' },
      { id: 3, name: 'Mira Asmar', phone: '+961 76 030 303', type: 'Subscription', plan: 'Weekly Laundry Plan', lastVisit: '2024-06-04', balance: 0, status: 'Expiring Soon', area: 'Verdun', notes: 'Renewing every 2 months.' },
      { id: 4, name: 'Georges Khoury', phone: '+961 78 040 404', type: 'Package', plan: 'Family Bundle', lastVisit: '2024-05-30', balance: -60, status: 'Overdue', area: 'Sanayeh', notes: 'Large family. Multiple bags.' },
      { id: 5, name: 'Joumana Rizk', phone: '+961 03 050 505', type: 'Walk-in', plan: '—', lastVisit: '2024-06-09', balance: 0, status: 'Active', area: 'Clemenceau', notes: 'Dry cleaning only.' },
    ],
    bookings: [
      { id: 1, customer: 'Celine Abou Jaoude', service: 'Weekly Pickup', date: '2024-06-11', time: '10:00', staff: 'Fadi', status: 'Confirmed', payment: 'Paid', amount: 15 },
      { id: 2, customer: 'Tony Rizk', service: 'Wash & Fold', date: '2024-06-11', time: '11:30', staff: 'Ali', status: 'Confirmed', payment: 'Pending', amount: 12 },
      { id: 3, customer: 'Mira Asmar', service: 'Weekly Pickup', date: '2024-06-11', time: '14:00', staff: 'Fadi', status: 'Pending', payment: 'Pending', amount: 15 },
      { id: 4, customer: 'Georges Khoury', service: 'Family Bundle', date: '2024-06-12', time: '09:00', staff: 'Ali', status: 'Pending', payment: 'Overdue', amount: 20 },
    ],
    staff: ['Fadi', 'Ali', 'Hassan', 'Rola'],
    tasks: [
      { id: 1, customer: 'Celine Abou Jaoude', service: 'Pickup + Wash', staff: 'Fadi', time: '10:00', payment: 'Paid', notes: 'No softener. Ring bell twice.', column: 'inprogress' },
      { id: 2, customer: 'Tony Rizk', service: 'Wash & Fold 4kg', staff: 'Ali', time: '11:30', payment: 'Pending', notes: 'Bags with security desk', column: 'todo' },
      { id: 3, customer: 'Georges Khoury', service: 'Family Pickup', staff: 'Hassan', time: '09:00', payment: 'Overdue', notes: '$60 overdue — collect before pickup', column: 'issue' },
      { id: 4, customer: 'Joumana Rizk', service: 'Dry Cleaning 3 items', staff: 'Rola', time: '15:00', payment: 'Paid', notes: 'Suit + 2 dresses', column: 'completed' },
    ],
    payments: [
      { id: 1, customer: 'Celine Abou Jaoude', ref: 'INV-301', amount: 59, method: 'Whish', status: 'Paid', date: '2024-06-01', proof: true },
      { id: 2, customer: 'Tony Rizk', ref: 'INV-302', amount: 55, method: 'Cash', status: 'Partial', date: '2024-06-04', proof: false },
      { id: 3, customer: 'Mira Asmar', ref: 'INV-303', amount: 59, method: 'OMT', status: 'Pending', date: '2024-06-06', proof: false },
      { id: 4, customer: 'Georges Khoury', ref: 'INV-304', amount: 60, method: 'Cash', status: 'Overdue', date: '2024-05-18', proof: false },
    ],
    revenueData: [
      { month: 'Jan', revenue: 2100, bookings: 38 }, { month: 'Feb', revenue: 2400, bookings: 44 },
      { month: 'Mar', revenue: 2700, bookings: 49 }, { month: 'Apr', revenue: 2900, bookings: 52 },
      { month: 'May', revenue: 3100, bookings: 56 }, { month: 'Jun', revenue: 3280, bookings: 60 },
    ],
  },

  'fixpro-maintenance': {
    key: 'fixpro-maintenance',
    name: 'FixPro Maintenance',
    emoji: '🔧',
    category: 'Maintenance & Repair',
    tagline: 'Service contracts, technician visits, and renewal reminders for maintenance companies.',
    area: 'Ashrafieh, Beirut',
    rating: '4.8',
    reviewCount: 29,
    color: 'amber',
    engines: ['Booking Engine', 'Subscription Engine', 'Payment Engine', 'Reminder Engine'],
    kpis: { todayBookings: 7, activeSubscriptions: 43, expiringThisWeek: 5, unpaidCustomers: 9, revenueThisMonth: 6850, sessionsRemaining: 0 },
    services: [
      { name: 'AC Service', price: 45, duration: '1-2 hours', description: 'Full AC checkup, filter cleaning, and refrigerant check.' },
      { name: 'Plumbing Visit', price: 35, duration: '1 hour', description: 'Diagnosis and minor repair for leaks, clogs, and fixtures.' },
      { name: 'Electrical Inspection', price: 60, duration: '2 hours', description: 'Panel, wiring, and outlet safety inspection.' },
      { name: 'Annual Contract', price: 400, duration: 'Yearly', description: '4 visits per year — AC, plumbing, electrical, and general.' },
    ],
    packages: [
      { name: 'AC Package (4 services)', price: 160, sessions: 4, description: 'Quarterly AC servicing for one unit.' },
      { name: 'Plumbing Pack (3 visits)', price: 90, sessions: 3, description: '3 plumbing visits, priority scheduling.' },
      { name: 'Annual Home Maintenance', price: 350, sessions: 6, description: '6 visits across all maintenance categories.' },
    ],
    subscription: {
      name: 'Annual Maintenance Contract',
      price: 400,
      includes: ['4 scheduled visits/year', 'Priority emergency response', 'AC + plumbing + electrical', 'Renewal reminder'],
      description: 'Full home maintenance covered under a single annual contract.',
    },
    products: [
      { id: 1, name: 'AC Filter (Universal)', category: 'Spare Parts', price: 12, cost: 5, stock: 25, lowStockAt: 8, unit: 'pcs', sku: 'PRT-001', image: '🌬️', status: 'Active' },
      { id: 2, name: 'Pipe Sealant Tape', category: 'Spare Parts', price: 3, cost: 1, stock: 50, lowStockAt: 15, unit: 'rolls', sku: 'PRT-002', image: '🔧', status: 'Active' },
      { id: 3, name: 'LED Bulb (9W)', category: 'Electrical', price: 4, cost: 1.5, stock: 18, lowStockAt: 10, unit: 'pcs', sku: 'ELE-001', image: '💡', status: 'Active' },
      { id: 4, name: 'Circuit Breaker (20A)', category: 'Electrical', price: 22, cost: 12, stock: 6, lowStockAt: 5, unit: 'pcs', sku: 'ELE-002', image: '⚡', status: 'Active' },
      { id: 5, name: 'Refrigerant Gas Can (R410A)', category: 'Spare Parts', price: 45, cost: 28, stock: 0, lowStockAt: 4, unit: 'cans', sku: 'PRT-003', image: '🧊', status: 'Out of Stock' },
    ],
    customers: [
      { id: 1, name: 'Gaby Nasr', phone: '+961 70 900 901', type: 'Subscription', plan: 'Annual Maintenance Contract', lastVisit: '2024-04-10', balance: 0, status: 'Active', area: 'Ashrafieh', notes: 'Building owner. 6 apartments.' },
      { id: 2, name: 'Lea Dagher', phone: '+961 71 800 802', type: 'Package', plan: 'AC Package (4 services)', lastVisit: '2024-05-20', balance: -45, status: 'Unpaid', area: 'Gemmayzeh', notes: 'AC makes noise. Check compressor.' },
      { id: 3, name: 'Marc Tannous', phone: '+961 76 700 703', type: 'Subscription', plan: 'Annual Maintenance Contract', lastVisit: '2024-03-15', balance: 0, status: 'Expiring Soon', area: 'Badaro', notes: 'Contract renews June 20.' },
      { id: 4, name: 'Chantal Abi Nader', phone: '+961 78 600 604', type: 'Package', plan: 'Plumbing Pack (3 visits)', lastVisit: '2024-05-01', balance: -90, status: 'Overdue', area: 'Mar Mikhael', notes: 'Bathroom leak unresolved.' },
      { id: 5, name: 'Fadi Geagea', phone: '+961 03 500 505', type: 'Subscription', plan: 'Annual Maintenance Contract', lastVisit: '2024-05-28', balance: 0, status: 'Active', area: 'Sin El Fil', notes: 'New villa — just signed contract.' },
    ],
    bookings: [
      { id: 1, customer: 'Gaby Nasr', service: 'AC Service', date: '2024-06-11', time: '09:00', staff: 'Khalil', status: 'Confirmed', payment: 'Paid', amount: 45 },
      { id: 2, customer: 'Lea Dagher', service: 'AC Service', date: '2024-06-11', time: '11:00', staff: 'Walid', status: 'Confirmed', payment: 'Pending', amount: 45 },
      { id: 3, customer: 'Marc Tannous', service: 'Electrical Inspection', date: '2024-06-12', time: '10:00', staff: 'Khalil', status: 'Pending', payment: 'Pending', amount: 60 },
      { id: 4, customer: 'Chantal Abi Nader', service: 'Plumbing Visit', date: '2024-06-12', time: '14:00', staff: 'Walid', status: 'Pending', payment: 'Overdue', amount: 35 },
    ],
    staff: ['Khalil', 'Walid', 'Ramzi', 'Jean'],
    tasks: [
      { id: 1, customer: 'Gaby Nasr', service: 'AC Service (Apt 3)', staff: 'Khalil', time: '09:00', payment: 'Paid', notes: 'Building has 6 units. Start apt 3.', column: 'inprogress' },
      { id: 2, customer: 'Lea Dagher', service: 'AC Checkup', staff: 'Walid', time: '11:00', payment: 'Pending', notes: 'Check compressor noise', column: 'todo' },
      { id: 3, customer: 'Chantal Abi Nader', service: 'Plumbing', staff: 'Jean', time: '14:00', payment: 'Overdue', notes: 'Bathroom leak — urgent. Collect payment.', column: 'issue' },
      { id: 4, customer: 'Fadi Geagea', service: 'First Visit Inspection', staff: 'Ramzi', time: '10:00', payment: 'Paid', notes: 'New contract. Document all issues.', column: 'completed' },
    ],
    payments: [
      { id: 1, customer: 'Gaby Nasr', ref: 'INV-401', amount: 400, method: 'Bank Transfer', status: 'Paid', date: '2024-04-01', proof: true },
      { id: 2, customer: 'Lea Dagher', ref: 'INV-402', amount: 45, method: 'Cash', status: 'Pending', date: '2024-06-05', proof: false },
      { id: 3, customer: 'Marc Tannous', ref: 'INV-403', amount: 400, method: 'Whish', status: 'Pending', date: '2024-06-10', proof: false },
      { id: 4, customer: 'Chantal Abi Nader', ref: 'INV-404', amount: 90, method: 'Cash', status: 'Overdue', date: '2024-04-20', proof: false },
      { id: 5, customer: 'Fadi Geagea', ref: 'INV-405', amount: 400, method: 'Bank Transfer', status: 'Paid', date: '2024-05-28', proof: true },
    ],
    revenueData: [
      { month: 'Jan', revenue: 4200, bookings: 18 }, { month: 'Feb', revenue: 3800, bookings: 16 },
      { month: 'Mar', revenue: 5100, bookings: 22 }, { month: 'Apr', revenue: 5800, bookings: 25 },
      { month: 'May', revenue: 6200, bookings: 27 }, { month: 'Jun', revenue: 6850, bookings: 30 },
    ],
  },
};

export const businessList = Object.values(businesses);
