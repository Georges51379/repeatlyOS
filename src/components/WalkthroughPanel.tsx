import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

const tips: Record<string, { title: string; steps: string[] }> = {
  '/dashboard': {
    title: 'Dashboard Overview',
    steps: [
      "Start here: show the owner Today's Bookings, Active Subscriptions, and Unpaid Customers at a glance.",
      "Point to 'Expiring This Week' — this is money at risk. RepeatlyOS catches it automatically so nothing slips through.",
      "Show the live clock and activity feed — this is the real-time pulse of the business.",
      "Show the revenue chart. Ask: 'Where do you track this today?' — usually: nowhere, or a messy spreadsheet.",
      "Point to Quick Actions (New Booking, Send Reminder, Mark Payment) — one click for the most common daily tasks.",
    ],
  },
  '/dashboard/calendar': {
    title: 'Calendar View',
    steps: [
      "Show the Week view — all bookings laid out by day and time slot. Staff can see their full schedule at a glance.",
      "Switch to Month view to show the big picture — upcoming busy days and quiet periods.",
      "Click any booking slot to open the detail modal — confirm, remind, or note from here.",
      "Ask: 'How does your team know what to do each day?' — usually WhatsApp. This replaces that.",
      "Switch to Day view to demo the detailed hour-by-hour operational schedule.",
    ],
  },
  '/dashboard/bookings': {
    title: 'Bookings Page',
    steps: [
      "Show the booking table — ask: 'How do you confirm bookings today?' (Usually: WhatsApp).",
      "Demo the status badges — Pending, Confirmed, Completed, No-show. Everything is tracked.",
      "Click 'Confirm' on a Pending booking to show real-time status change — live in front of them.",
      "Show the 'New Booking' button — this is what staff uses instead of WhatsApp threads.",
      "Point to the filter tabs — Today, Pending, Confirmed — instant operational views.",
    ],
  },
  '/dashboard/customers': {
    title: 'Customers Page',
    steps: [
      "Show the customer list. Ask: 'Do you know exactly which customers owe you money right now?'",
      "Filter by 'Unpaid' to instantly show customers with outstanding balances — no searching required.",
      "Click any customer to open their profile — full booking history, package balance, payment status.",
      "This replaces notebooks, Excel sheets, and scrolling through WhatsApp message history.",
      "Show the notes field — staff can leave info like 'prefers mornings' or 'park at building entrance.'",
    ],
  },
  '/dashboard/products': {
    title: 'Products',
    steps: [
      "Show this is where the business sells physical items, not just services — drinks, snacks, retail, parts, anything.",
      "Point out the catalog already has realistic items for this business type — fully editable.",
      "Click '+' or '−' on any product card to demo live stock adjustment, just like a quick sale at the counter.",
      "Show the Low Stock and Out of Stock badges — never get caught without inventory again.",
      "Point to the profit margin shown on each card — instant visibility into what's actually making money.",
      "Mention the 'Full Inventory' button — for businesses that need purchase orders, suppliers, and stock history.",
    ],
  },
  '/dashboard/inventory': {
    title: 'Inventory Management',
    steps: [
      "This is the professional-grade inventory system — for businesses managing real stock and supplier relationships.",
      "Show the Overview tab: total inventory value, units in stock, and automatic reorder suggestions for low-stock items.",
      "Switch to Stock Ledger — every single stock movement is logged with date, reason, reference, and the staff member who made it.",
      "Switch to Purchase Orders — create one, then click through Draft → Sent → Confirmed → Received and watch stock update automatically.",
      "Switch to Suppliers — show contact info, lead times, and ratings. Click 'Order' to start a PO with that supplier pre-filled.",
      "Switch to Reports — show top-selling products and the cost-vs-retail valuation breakdown.",
      "Ask: 'How do you currently know when to reorder stock?' — this replaces guesswork with real visibility.",
    ],
  },
  '/dashboard/packages': {
    title: 'Package Tracking',
    steps: [
      "Show how package session balances are tracked automatically per customer — no paper, no WhatsApp counting.",
      "Click 'Consume Session' to show the balance reduce live — progress bar updates instantly.",
      "Point to the color-coded progress bars — green: healthy, amber: almost out, red: zero remaining.",
      "Ask: 'How do you track this today?' — usually counting WhatsApp messages or marks on paper.",
      "Show 'Renew Package' — resets the balance and extends the expiry with one click.",
    ],
  },
  '/dashboard/subscriptions': {
    title: 'Subscription Renewals',
    steps: [
      "Show the subscriptions table — point to 'Expiring Soon' badges. These customers need attention NOW.",
      "Show the Monthly Recurring Revenue card — this is the business's predictable baseline income.",
      "Click 'Remind' to show the WhatsApp message template — professional and ready in seconds.",
      "Show 'Pause' and 'Resume' — for customers who are traveling or temporarily pausing service.",
      "Ask: 'How many renewals did you lose last month because you forgot to follow up?'",
    ],
  },
  '/dashboard/payments': {
    title: 'Payment Tracking',
    steps: [
      "This page is built for Lebanese business reality: Cash, Whish, OMT, Bank Transfer, Card Later.",
      "Show Overdue payments highlighted in red — real money the business hasn't collected yet.",
      "Click 'Mark Paid' to show how one action updates the status instantly across the system.",
      "Show 'Upload Proof' — customers can send payment screenshots as confirmation.",
      "Ask: 'Where do you record cash payments today?' — usually memory, a notebook, or nowhere.",
    ],
  },
  '/dashboard/invoices': {
    title: 'Invoices',
    steps: [
      "Show the invoice list — every service delivered becomes a trackable invoice automatically.",
      "Click any invoice to open the preview — it looks professional and branded.",
      "Show 'Download PDF' — give clients a real invoice they can keep for their records.",
      "Point to the status badges — Paid, Pending, Partial, Overdue — all tracked in one place.",
      "Ask: 'Do your customers ever ask for an invoice or receipt?' — this handles it professionally.",
    ],
  },
  '/dashboard/tasks': {
    title: 'Staff Task Board',
    steps: [
      "Show the Kanban board — this is the daily operational view the whole team uses.",
      "Point to 'Issue Reported' column — problems surface immediately instead of being hidden.",
      "Show task cards with customer name, service, assigned staff, time, and payment status.",
      "Move a task between columns to demonstrate — drag or click the arrow buttons.",
      "Ask: 'How do you assign work to your team today?' — usually WhatsApp group messages.",
    ],
  },
  '/dashboard/staff': {
    title: 'Staff Performance',
    steps: [
      "Show the staff cards — completion rate, tasks done, revenue generated, and star rating.",
      "Click a staff card to expand their individual task list for today.",
      "Point to the completion rate bar — green is good, amber needs attention, red is a problem.",
      "Show the weekly task distribution chart — see who is overloaded and who has capacity.",
      "Ask: 'How do you give staff performance feedback today?' — this makes accountability visual and fair.",
    ],
  },
  '/dashboard/reminders': {
    title: 'WhatsApp Reminders',
    steps: [
      "Show the reminder types: renewal, unpaid payment, package expiry, follow-up, booking confirmation.",
      "Click 'Prepare' to show the pre-written WhatsApp message — professional, personalized, ready to copy.",
      "Emphasize: these messages go out on time, every time — no more forgotten follow-ups.",
      "Show the reminder status badges — Pending, Sent, Overdue, Scheduled.",
      "Ask: 'How much revenue did you lose last month from forgotten renewals?'",
    ],
  },
  '/dashboard/loyalty': {
    title: 'Loyalty & Retention',
    steps: [
      "Show the customer health scores — instantly see who is engaged and who is at risk of leaving.",
      "Point to the tier system: Platinum, Gold, Silver, New — reward your best customers.",
      "Show the retention chart — growing month over month means the business is healthy.",
      "Point to 'At Risk' customers — these are the ones to reach out to before they churn.",
      "Show the business health radar — a complete picture of operational performance in one view.",
    ],
  },
  '/dashboard/reports': {
    title: 'Reports & Analytics',
    steps: [
      "Show the revenue chart trend — growing month over month demonstrates business health.",
      "Point to staff performance table — accountability without uncomfortable direct conversations.",
      "Show best-selling packages — helps the business double down on what's working.",
      "Show Export CSV/PDF buttons — accountants and business owners love exportable reports.",
      "Ask: 'When was the last time you had a clear view of all this data?'",
    ],
  },
  '/dashboard/activity': {
    title: 'Activity Log',
    steps: [
      "Show the live activity feed — every booking, payment, reminder, and task change is recorded.",
      "Filter by type — Booking, Payment, Subscription, Reminder — to see only what matters.",
      "This is the audit trail — you always know exactly what happened and when.",
      "Show search — instantly find any event by customer name or action.",
      "Ask: 'If something goes wrong with a payment or booking, how do you investigate today?'",
    ],
  },
  '/dashboard/branches': {
    title: 'Multi-Branch View',
    steps: [
      "This is the Enterprise-tier view — for businesses with multiple locations.",
      "Show revenue and customer count side by side across all branches.",
      "Point to the 'Needs Attention' badge — instantly spot underperforming locations.",
      "Click any branch card to see deeper detail — this scales as the business grows.",
      "Mention: 'If you ever open a second location, RepeatlyOS grows with you.'",
    ],
  },
  '/dashboard/broadcast': {
    title: 'WhatsApp Broadcast',
    steps: [
      "This is the most powerful retention tool — send targeted messages to specific customer segments in minutes.",
      "Show the segment selector: Expiring Subscriptions, Overdue Payments, Low Package Sessions, Inactive customers, New customers.",
      "Pick a segment — point out how the right customer list auto-populates. No manual filtering needed.",
      "Show the WhatsApp message preview bubble — it shows exactly what the customer will receive.",
      "Click 'Open WhatsApp' to demo the real wa.me deep link opening on mobile with the message pre-filled.",
      "Ask: 'How long does it take you to send renewal reminders today?' — this does it in 2 minutes for all customers.",
    ],
  },
  '/dashboard/forecast': {
    title: 'Revenue Forecast',
    steps: [
      "Show the three scenarios: Floor (guaranteed), Likely (realistic), Best Case — the business owner instantly knows their revenue range.",
      "Point to the 30-day daily projection chart — show the spikes on renewal days.",
      "Highlight the Revenue Breakdown: what % comes from subscriptions vs packages vs bookings.",
      "Show the Risk Factors panel — unpaid balances and expiring subscriptions that threaten the forecast.",
      "Ask: 'Do you currently know what next month's revenue will look like?' — this answers that question every day.",
    ],
  },
  '/dashboard/commissions': {
    title: 'Commission Tracker',
    steps: [
      "This eliminates the end-of-month salary calculation headache — everything is calculated automatically.",
      "Show the staff commission cards — revenue generated, rate percentage, and exact commission amount per person.",
      "Click 'Rates' to open the settings — show how you can set different percentages per staff member.",
      "Show the Payroll Summary at the bottom — a print-ready breakdown of what each person earns.",
      "Ask: 'How do you calculate staff commissions today?' — usually a calculator and spreadsheet. This replaces that.",
    ],
  },
  '/dashboard/expenses': {
    title: 'Expense Tracker',
    steps: [
      "This turns RepeatlyOS from a booking tool into a real business intelligence platform.",
      "Show the P&L summary: Revenue, Expenses, Net Profit, and Margin all in one line.",
      "Point to the green or red profit banner — immediately tells the owner if they're profitable this month.",
      "Show the category donut chart — instantly see what percentage goes to rent, salaries, supplies, etc.",
      "Show the Revenue vs Expenses bar chart over 6 months — the trend tells the story.",
      "Click 'Add Expense' to demo adding a new line — recurring toggle for monthly fixed costs.",
    ],
  },
  '/dashboard/occasions': {
    title: 'Birthdays & Occasions',
    steps: [
      "This is pure customer retention magic — remembering a birthday builds more loyalty than any discount.",
      "Show the 'Today' highlight section — if any birthdays are today, they appear immediately with a send button.",
      "Point to the urgency badges: TODAY (pink pulse), Tomorrow (amber), In X days (blue).",
      "Show the WhatsApp deep link — one tap pre-fills a personalized birthday message.",
      "Show the message templates for Birthday vs Anniversary — both auto-insert the customer's name.",
      "Ask: 'Do you currently remember your customers' birthdays?' — this does it automatically.",
    ],
  },
  '/dashboard/waitlist': {
    title: 'Waiting List',
    steps: [
      "Every cancellation is lost revenue. The waitlist turns cancellations into immediate bookings.",
      "Show the queue — customers are ordered by priority, and you can drag them up or down.",
      "Click 'Offer Slot' on a waiting customer — a WhatsApp message opens with the slot offer pre-filled.",
      "Show the status flow: Waiting → Offered → Confirmed. One cancellation, one recovered booking.",
      "Click 'Add to Waitlist' to show how fast a customer is added — 30 seconds.",
      "Ask: 'What happens when a customer cancels last minute?' — usually nothing. This fixes that.",
    ],
  },
  '/dashboard/health': {
    title: 'Business Health Score',
    steps: [
      "This is the most powerful opening line in your sales demo: 'What's your business score today?' — nobody can answer that without this.",
      "Show the animated ring filling up to the current score — the animation alone creates a wow moment.",
      "Walk through each factor: retention, payment collection, task completion, stock health, booking efficiency.",
      "Click any factor bar — it links directly to the page where that metric can be improved.",
      "Show the 'How to improve' section at the bottom — it becomes a personal action plan for the owner.",
      "Ask: 'Would you like to know your score is above 80 before you leave for the day?' — that's what this does.",
    ],
  },
  '/dashboard/heatmap': {
    title: 'Revenue Heatmap',
    steps: [
      "Hover over any day on the calendar — the exact revenue for that day appears instantly.",
      "Show the dark green vs light squares — the pattern reveals their busiest days without any effort.",
      "Switch months using the tabs — show how the pattern changes seasonally.",
      "Point to the year-at-a-glance grid — like GitHub for revenue. Immediately shows busy periods.",
      "Show Best Days and Slowest Days panels — 'Every Tuesday is dead. Every Saturday is gold. What are you doing on Tuesdays?'",
      "Ask: 'Have you ever seen your revenue pattern laid out like this before?' — they haven't.",
    ],
  },
  '/dashboard/goals': {
    title: 'Goal Tracker',
    steps: [
      "Show the overall progress ring — a single number that says how the month is going. Immediately motivating.",
      "Point to individual goal rings filling with animation — kinetic, satisfying, impossible to ignore.",
      "Click the edit icon on any goal — show how the business owner sets their own targets.",
      "Show the 'needed per day' calculation — makes abstract monthly goals concrete and actionable.",
      "Show the motivational banner at the bottom — it changes based on performance, not static copy.",
      "Ask: 'What are your targets for this month?' — then set them live in the demo right in front of them.",
    ],
  },
  '/dashboard/referrals': {
    title: 'Referral Tracker',
    steps: [
      "Word of mouth is the #1 growth channel for Lebanese businesses — this makes it trackable and rewardable.",
      "Show the leaderboard — the medals are immediately engaging. Who's your top ambassador?",
      "Click 'Thank you' on the top referrer — a real WhatsApp message opens pre-filled with a thank-you.",
      "Show 'Copy referral link' — a shareable link the business owner can send to customers to refer friends.",
      "Click 'Record Referral' to show the simple form — takes 10 seconds to log a new referral.",
      "Point to the referral revenue column — 'This customer has brought you $X in new business this year.'",
    ],
  },
  '/dashboard/reorder': {
    title: 'Smart Reorder Alerts',
    steps: [
      "This page watches stock levels 24/7 and surfaces every product that needs restocking automatically.",
      "Point to the alert banner — instantly shows how many products need attention and the estimated reorder cost.",
      "Show a product card: current stock, minimum level, and suggested order quantity — calculated automatically.",
      "Click 'Create PO' on one product — a draft purchase order is generated instantly.",
      "Click 'Auto-Order All' to show how you can generate POs for every low-stock item in one click.",
      "Show the Settings: preferred supplier, reorder multiplier, auto-send toggle.",
      "Ask: 'How do you currently know when to reorder stock?' — usually noticing an empty shelf too late.",
    ],
  },
  '/dashboard/settings': {
    title: 'Settings',
    steps: [
      "Show Business Profile — logo, name, area, hours, description. Public-facing info.",
      "Show Services — editable list. The business owner sets their own prices and durations.",
      "Show Reminder Templates — pre-written WhatsApp messages they can customize.",
      "Show Payment Methods — tick which methods you accept: Cash, Whish, OMT, Bank Transfer.",
      "Show Public Page settings — toggle what customers see on the booking page.",
    ],
  },
};

export default function WalkthroughPanel() {
  const { walkthroughOpen, setWalkthroughOpen } = useDemo();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const tip = tips[location.pathname];

  if (!walkthroughOpen || !tip) return null;

  const total = tip.steps.length;
  const safeStep = Math.min(step, total - 1);

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <Lightbulb size={12} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Sales Walkthrough</p>
            <p className="text-slate-500 text-xs">{tip.title}</p>
          </div>
        </div>
        <button onClick={() => setWalkthroughOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-start gap-2 mb-4">
          <span className="w-5 h-5 bg-blue-600 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{safeStep + 1}</span>
          <p className="text-slate-300 text-sm leading-relaxed">{tip.steps[safeStep]}</p>
        </div>
        <div className="flex items-center gap-1 mb-4">
          {tip.steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} className={`h-1 rounded-full transition-all ${i === safeStep ? 'bg-blue-500 w-5' : 'bg-slate-700 w-2 hover:bg-slate-600'}`} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={safeStep === 0} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-slate-600 text-xs">{safeStep + 1} / {total}</span>
          <button onClick={() => setStep(s => Math.min(total - 1, s + 1))} disabled={safeStep === total - 1} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
