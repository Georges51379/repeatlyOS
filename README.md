# ⚡ RepeatlyOS

> **The all-in-one business management platform for repeat-service businesses.**
> Built for car washes, cleaning companies, gyms, laundries, and maintenance — any business where customers come back.

---

## 🚀 Quick Start

```bash
# 1. Unzip the project
unzip repeatlyos-enhanced.zip
cd repeatlyos

# 2. Install dependencies
npm install

# 3. Start the demo
npm run dev

# 4. Open in browser
# → http://localhost:5173
```

> **Zero configuration. Zero backend. Zero database.**
> Everything runs 100% in the browser — perfect for live client demos, pitches, and presentations.

---

## 🎯 What Problem Does RepeatlyOS Solve?

Most Lebanese service businesses today manage their operations through:

- 📱 **WhatsApp groups** — chaotic, unsearchable, unprofessional
- 📒 **Paper notebooks** — lost, damaged, inaccessible from anywhere
- 📊 **Excel spreadsheets** — manual, error-prone, no automation
- 🧠 **Owner's memory** — the biggest operational risk of all

RepeatlyOS replaces all of this with a **single, professional platform** that covers every aspect of running a repeat-service business — from booking the first customer to tracking their lifetime value years later.

---

## 🏪 5 Built-In Business Templates

Switch between industries instantly using the **Business Switcher** in the dashboard. Every template ships with realistic customers, bookings, inventory, staff, and financial data.

| Business | Industry | Key Use Case |
|---|---|---|
| 🚗 **Elite Auto Spa** | Car Wash & Detailing | Packages, subscriptions, WhatsApp reminders |
| 🏠 **FreshHome Cleaning** | Cleaning Company | Recurring bookings, zone scheduling |
| 💪 **North Fitness** | Gym & Training | Session packages, coach commissions, waitlist |
| 👕 **QuickLaundry** | Laundry Service | Per-item tracking, delivery scheduling |
| 🔧 **FixPro Maintenance** | Maintenance & Repair | Inventory management, smart reorder |

---

## 📍 Full Page Directory (40 pages)

### 🌐 Public Pages (5)

| Page | URL | Purpose |
|---|---|---|
| **Landing Page** | `/` | Product homepage, features, demo CTA |
| **Business Public Page** | `/business/elite-carwash` | Customer-facing booking page with services, shop |
| **Customer Portal** | `/customer/portal` | Mobile self-service — balance, history, profile |
| **Sales Pitch Deck** | `/demo/pitch` | Full investor/client pitch deck |
| **Demo Setup Wizard** | `/demo/setup` | 4-step wizard to configure the demo for a client |

### 📅 Operations (6 pages)

| Page | URL | Key Capability |
|---|---|---|
| **Overview** | `/dashboard` | Morning briefing, KPIs, at-risk alerts, quick actions |
| **Calendar** | `/dashboard/calendar` | Day/week/month — drag bookings to reschedule |
| **Bookings** | `/dashboard/bookings` | Search, filter, bulk confirm, capacity enforcement |
| **Recurring Bookings** | `/dashboard/recurring` | Auto-create weekly/bi-weekly/monthly bookings |
| **Waiting List** | `/dashboard/waitlist` | Convert cancellations into bookings via WhatsApp |
| **No-Show Tracker** | `/dashboard/noshows` | Flag repeat offenders, calculate lost revenue |

### 👥 Customers (6 pages)

| Page | URL | Key Capability |
|---|---|---|
| **Customers** | `/dashboard/customers` | Tags, custom fields, churn score, CSV import |
| **Packages** | `/dashboard/packages` | Session balance tracking, assign/renew |
| **Subscriptions** | `/dashboard/subscriptions` | Renewal management, pause/resume |
| **Loyalty** | `/dashboard/loyalty` | Tier system, health scores, retention charts |
| **Occasions** | `/dashboard/occasions` | Birthday & anniversary WhatsApp reminders |
| **Referrals** | `/dashboard/referrals` | Who-brought-who leaderboard, referral revenue |

### 💵 Finance (5 pages)

| Page | URL | Key Capability |
|---|---|---|
| **Payments** | `/dashboard/payments` | Cash/Whish/OMT/Bank — bulk mark paid, receipts |
| **Invoices** | `/dashboard/invoices` | QR code generator, payment links, PDF actions |
| **Payment Plans** | `/dashboard/partial-payments` | Split into 2–6 installments, track each |
| **Expenses** | `/dashboard/expenses` | Real P&L — revenue vs expenses, profit margin |
| **Revenue Forecast** | `/dashboard/forecast` | 30-day Floor/Likely/Best-Case projection |

### 👷 Team (6 pages)

| Page | URL | Key Capability |
|---|---|---|
| **Staff Tasks** | `/dashboard/tasks` | Kanban — To Do / In Progress / Completed / Issue |
| **Staff** | `/dashboard/staff` | Performance, revenue generated, bookings per person |
| **Scheduler** | `/dashboard/scheduler` | 7-day roster + Clock In/Out tracking |
| **Commissions** | `/dashboard/commissions` | Auto-calculate from paid bookings, payroll summary |
| **Reminders** | `/dashboard/reminders` | WhatsApp reminder center, bulk send |
| **Broadcast** | `/dashboard/broadcast` | Targeted messages to 6 customer segments |

### 📊 Intelligence (5 pages)

| Page | URL | Key Capability |
|---|---|---|
| **Health Score** | `/dashboard/health` | Animated 0–100 business health ring |
| **Revenue Heatmap** | `/dashboard/heatmap` | Calendar of busiest days — GitHub-style grid |
| **Goals** | `/dashboard/goals` | Monthly targets with animated progress rings |
| **Reports** | `/dashboard/reports` | CLV leaderboard, profit per service, retention |
| **Activity Log** | `/dashboard/activity` | Full audit trail — who did what and when |

### 🏢 Enterprise (5 pages)

| Page | URL | Key Capability |
|---|---|---|
| **Team & Roles** | `/dashboard/team` | Owner/Manager/Staff/Viewer — RBAC |
| **Enterprise Tools** | `/dashboard/enterprise` | Announcements, Audit Log, Data Export |
| **Smart Reorder** | `/dashboard/reorder` | Auto-detect low stock, auto-generate POs |
| **Multi-Branch** | `/dashboard/branches` | Enterprise branch comparison and KPIs |
| **Settings** | `/dashboard/settings` | Theme, currency, VAT, PWA install, sidebar |

---

## ✨ Signature Features

### 💚 Live Business Health Score
A single animated number (0–100) calculated in real-time from 6 operational dimensions: customer retention, payment collection, task completion, issue rate, stock health, booking efficiency. Visible as a badge in the sidebar and topbar on every page. The business owner knows their score before they even sit down.

### 📢 WhatsApp Broadcast Center
Send targeted messages to customer segments — expiring subscriptions, overdue payments, low session packages, inactive customers, new customers — all without contacting people one by one. Real `wa.me` deep-links pre-fill the message in WhatsApp. One click per customer, every customer contacted in minutes.

### 🎯 Drag-to-Reschedule Calendar
In Week view, every booking card is draggable. Drop it on a new time slot and it reschedules instantly with a confirmation toast and a WhatsApp message pre-drafted for the customer. No form, no modal — direct manipulation of the schedule.

### 📊 Revenue Forecast
Floor / Likely / Best-Case scenarios for the next 30 days, built from subscription renewals due, package sales, and booking averages. Includes a daily projection chart with renewal-day revenue spikes and a Risk Factors panel that quantifies how much revenue is at risk from unpaid balances.

### 👥 Customer Journey Timeline
Inside every customer profile drawer, a visual timeline tells their entire story: joined → first booking → package purchased → overdue → renewed. Each event is a colored card with a dot-and-line connector. Not a table, not a list — a story.

### 🔥 Revenue Heatmap
A calendar where every day is colored by revenue intensity, like GitHub's contribution graph but for money. Hover any day to see exact revenue. A full year-at-a-glance view reveals seasonal patterns in 2 seconds that would take an accountant 2 hours.

### 💬 Smart WhatsApp Quick Replies
Inside every customer profile, contextual WhatsApp templates are pre-written using that specific customer's live data — their package balance, overdue amount, last visit date. One tap copies, another opens WhatsApp with the message pre-filled and addressed to their number.

### ⚡ Smart Reorder Alerts
Auto-detects every product below its minimum threshold. "Auto-Order All" generates purchase orders for every flagged item in one click — supplier, quantity, and estimated cost pre-filled. The business owner never discovers an empty shelf again.

### 🧮 Churn Prediction Score
Every customer gets a churn risk score (1–10) calculated from days since last visit, outstanding balance, subscription status, and session balance. Shows in the customer table and profile. The Overview surfaces an "At-Risk Customers" panel naming every at-risk customer with their specific risk factor.

### 🤝 Referral Tracker
A medals leaderboard showing who referred how many customers and how much revenue that generated. "Thank you" button opens WhatsApp with a pre-written thank-you message. Turns word-of-mouth — the #1 growth channel in Lebanon — into a trackable, rewardable system.

---

## 💡 Demo Presentation Guide

### Opening (30 seconds)
1. Navigate to `/` — show the landing page briefly to establish credibility
2. Click **"Open Demo"** to go to `/dashboard`
3. Point to the **Daily Briefing card**: *"This is what the owner sees every morning. Bookings today, who owes money, whose subscription expires this week, any birthdays — in 10 seconds."*

### The Core 5-Minute Demo Flow

**Step 1 — Business Switcher (30 sec)**
Click the business name in the topbar and switch industries live. Every number, customer, and product updates instantly.
> *"One platform. Five industries. Your business is already configured here."*

**Step 2 — Health Score (60 sec)**
Click the green score badge in the topbar → `/dashboard/health`. Let the animated ring fill. Click a low-scoring factor — it navigates to the fix.
> *"What's your business score today? Most owners can't answer that without pulling 5 spreadsheets. This answers it in real time — and tells you exactly what's dragging it down."*

**Step 3 — Drag Calendar (60 sec)**
Go to `/dashboard/calendar`. Stay on Week view. Drag a booking card to a new slot. Show the instant reschedule and the toast notification.
> *"How do you reschedule a booking today? WhatsApp back-and-forth? Phone call? Here it's one drag. And the WhatsApp confirmation is already written."*

**Step 4 — WhatsApp Broadcast (60 sec)**
Go to `/dashboard/broadcast`. Select **"Expiring Subscriptions"**. Show the segment auto-populate. Click Open WhatsApp on one customer — show the message opening with their name and plan already in it.
> *"How long does it take you today to send renewal reminders to 15 customers? This does all of them in 2 minutes. With personalized messages."*

**Step 5 — Revenue Forecast (30 sec)**
Go to `/dashboard/forecast`. Point to the three cards: Floor, Likely, Best Case.
> *"Do you know what next month's revenue will be? Not a guess — based on your actual subscriptions, packages, and booking frequency. Every day you wake up knowing your floor revenue."*

**Step 6 — Customer Lifetime Value (30 sec)**
Go to `/dashboard/reports`. Scroll to the CLV leaderboard with medals.
> *"This customer — Rami — has spent $2,400 with you over 18 months. Do you know who your most valuable customer is today? Because that's who you should be calling first."*

---

## 🧭 Navigation Reference

| Action | How |
|---|---|
| Search anything | `Cmd+K` or `Ctrl+K` |
| All keyboard shortcuts | Press `?` |
| Sales guide tips | Click 💡 in topbar |
| Switch business | Click business name in topbar |
| Toggle theme (dark/light) | Settings → Appearance |
| Collapse sidebar | Settings → Appearance → Compact |
| Install as mobile app | Settings → Appearance → Install |
| Go to home page | Home link in sidebar bottom |
| Navigate back | Breadcrumb trail at top of every page |
| Mobile quick actions | Floating `+` button (mobile only) |

---

## 🔐 Team Roles (Live Demo)

Go to `/dashboard/team` → Click **"Switch"** next to any user to see the interface adapt immediately.

| User | Role | What They Can See |
|---|---|---|
| Ahmad Khalil | **Owner** | Everything — no restrictions |
| Lara Mansour | **Manager** | All operations except team roles and settings |
| Tony Saab | **Staff** | Bookings, tasks, and customers only |
| Mirna Haddad | **Viewer** | Reports and analytics only |

---

## 🇱🇧 Lebanon-Specific Features

RepeatlyOS was built with Lebanese business reality as the primary design constraint:

- **Multi-currency** — USD, LBP, or both simultaneously. Configurable exchange rate
- **VAT/TVA** — configurable tax rate on all invoices (11% default)
- **Payment methods** — Cash, Whish, OMT, Bank Transfer, Card Later — tracked separately
- **WhatsApp-first flows** — real `wa.me` deep-links throughout, because WhatsApp is how Lebanese businesses communicate
- **Offline mode** — app works without internet via PWA service worker. Shows amber banner when offline. Built for unstable connectivity
- **Lebanese phone format** — `+961` prefix in all customer flows

---

## 📦 Project Structure

```
repeatlyos/
├── public/
│   ├── manifest.json          # PWA — install as mobile app
│   └── sw.js                  # Service worker — offline support
├── src/
│   ├── App.tsx                # 40-route application
│   ├── context/
│   │   └── DemoContext.tsx    # Global state — 14 data types + seed data
│   ├── data/
│   │   ├── businesses.ts      # 5 complete industry templates
│   │   ├── mockData.ts        # Chart + analytics data
│   │   └── inventoryData.ts   # Suppliers, POs, stock movements
│   ├── pages/
│   │   ├── dashboard/         # 35 dashboard pages
│   │   ├── demo/              # Setup wizard + Pitch deck
│   │   └── customer/          # Self-service portal
│   └── components/            # 25 shared UI components
│       ├── ChurnBadge.tsx     # Churn prediction score
│       ├── CSVImport.tsx      # Customer import from CSV
│       ├── EmptyState.tsx     # Contextual animated empty states
│       ├── InvoiceQR.tsx      # QR code generator for invoices
│       ├── CustomerJourney.tsx# Visual customer history timeline
│       └── QuickReply.tsx     # WhatsApp smart template panel
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** (strict) | Full type safety |
| **Vite 6** | Build tool |
| **Tailwind CSS 3** | Styling |
| **React Router 6** | 40-route navigation |
| **Recharts** | All charts and data visualizations |
| **Lucide React** | Icons |

**No backend. No database. No API keys. No accounts required.**

---

## 📊 By the Numbers

| | |
|---|---|
| Total pages | **40** |
| Dashboard pages | **35** |
| Shared components | **25** |
| Business templates | **5** |
| TypeScript interfaces | **14** |
| WhatsApp flows | **12** |
| Source lines | **~15,000** |
| Build time | **< 5 seconds** |

---

## ❓ When Clients Ask

**"Does it work with real data?"**
> *"This is the demo version — it runs in the browser so you can explore freely without setup. In production, it connects to your real customer database, sends actual WhatsApp messages via the WhatsApp Business API, and syncs across all devices and staff phones in real time. Every feature you see here is exactly what production looks like."*

**"Is it an app or a website?"**
> *"Both. It's a Progressive Web App — you can use it in the browser or install it to your phone's home screen like a native app. Go to Settings → Appearance → Install. It works offline too."*

**"Can my staff use it?"**
> *"Yes. You give each staff member a role — Owner, Manager, Staff, or Viewer. They each see only what they need to see. A staff member sees their tasks and bookings. A manager sees everything except financial settings. You, as the owner, see everything."*

**"What about WhatsApp?"**
> *"Every flow in RepeatlyOS is WhatsApp-first. Reminders, broadcasts, birthday messages, booking confirmations, payment receipts — they all open WhatsApp with the message already written and addressed. In production, messages go out automatically through the WhatsApp Business API."*

**"How long does setup take?"**
> *"The Demo Setup Wizard at `/demo/setup` takes 4 minutes. In production, onboarding is guided — you add your services, your staff, and import your existing customers from a spreadsheet. Most businesses are fully live within one day."*

---

*RepeatlyOS — Built for the businesses that built Lebanon.* 🇱🇧
