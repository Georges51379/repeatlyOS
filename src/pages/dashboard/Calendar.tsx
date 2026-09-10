import { useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Toast from '../../components/Toast';
import { useDemo } from '../../context/DemoContext';
import Modal from '../../components/Modal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const slotColors = ['bg-blue-600/80', 'bg-emerald-600/80', 'bg-purple-600/80', 'bg-amber-600/80', 'bg-cyan-600/80', 'bg-red-600/80'];

export default function CalendarPage() {
  const { business } = useDemo();
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate] = useState(new Date(2024, 5, 11));
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<typeof business.bookings[0] | null>(null);
  const [toast, setToast] = useState('');
  const [bookings, setBookings] = useState(business.bookings);
  const [dragging, setDragging] = useState<{ id: number; customer: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null); // "date:hour"

  // Build week days from current date
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  const fmtDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  // Use local bookings state for all calendar reads
  const getBookingsForDayHour = (date: Date, hour: string) => {
    const dateStr = fmtDate(date);
    return bookings.filter(b => {
      const bHour = b.time.split(':')[0].padStart(2, '0') + ':00';
      return b.date === dateStr && bHour === hour;
    });
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = fmtDate(date);
    return bookings.filter(b => b.date === dateStr);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, b: typeof bookings[0]) => {
    setDragging({ id: b.id, customer: b.customer });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date, hour: string) => {
    e.preventDefault();
    if (!dragging) return;
    const newDate = fmtDate(date);
    const newTime = hour;
    setBookings(prev => prev.map(b =>
      b.id === dragging.id ? { ...b, date: newDate, time: newTime, status: 'Confirmed' } : b
    ));
    setToast(`✅ ${dragging.customer} rescheduled to ${newDate} at ${newTime}. Reminder drafted.`);
    setDragging(null);
    setDragOver(null);
  };

  const slotKey = (date: Date, hour: string) => `${fmtDate(date)}:${hour}`;

  // Month view helpers
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const statusDot: Record<string, string> = {
    Confirmed: 'bg-emerald-400', Pending: 'bg-amber-400',
    Completed: 'bg-blue-400', Cancelled: 'bg-slate-500', 'No-show': 'bg-red-400',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Calendar</h2>
          <p className="text-slate-500 text-sm">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()} · {business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            {(['month','week','day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{v}</button>
            ))}
          </div>
          {view === 'week' && (
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={15} /></button>
              <span className="text-slate-400 text-xs px-1">Week {weekOffset === 0 ? 'current' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</span>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={15} /></button>
            </div>
          )}
          <button onClick={() => setToast('New booking created. Demo only.')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">+ New</button>
        </div>
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <>
          <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-2.5 text-xs text-blue-300">
            <GripVertical size={13} className="text-blue-400 shrink-0" />
            <span><strong>Drag any booking</strong> to a new time slot to reschedule it instantly. A WhatsApp reminder will be drafted automatically.</span>
          </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-slate-800">
            <div className="px-3 py-3 text-slate-600 text-xs" />
            {weekDays.map((d, i) => {
              const isToday = d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth();
              const dayBookings = getBookingsForDay(d);
              return (
                <div key={i} className={`px-2 py-3 text-center border-l border-slate-800 ${isToday ? 'bg-blue-600/10' : ''}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{DAYS[d.getDay()]}</p>
                  <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-400' : 'text-white'}`}>{d.getDate()}</p>
                  {dayBookings.length > 0 && <div className="flex justify-center gap-0.5 mt-1">{dayBookings.slice(0,3).map((_, bi) => <div key={bi} className="w-1 h-1 rounded-full bg-blue-400" />)}</div>}
                </div>
              );
            })}
          </div>

          {/* Time slots - drag and drop enabled */}
          <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-slate-800/50 min-h-[60px]">
                <div className="px-3 py-2 text-slate-600 text-xs font-mono shrink-0 pt-2">{hour}</div>
                {weekDays.map((d, di) => {
                  const isToday = d.getDate() === currentDate.getDate();
                  const bkgs = getBookingsForDayHour(d, hour);
                  const key = slotKey(d, hour);
                  const isOver = dragOver === key;
                  return (
                    <div
                      key={di}
                      className={`border-l border-slate-800/50 p-1 transition-all ${isToday ? 'bg-blue-600/5' : ''} ${isOver ? 'bg-blue-500/20 ring-1 ring-blue-500/50 ring-inset' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(e, d, hour)}
                    >
                      {bkgs.map((b, bi) => (
                        <div
                          key={bi}
                          draggable
                          onDragStart={e => handleDragStart(e, b)}
                          onDragEnd={() => { setDragging(null); setDragOver(null); }}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left rounded-md px-2 py-1 mb-1 text-xs font-medium text-white cursor-grab active:cursor-grabbing transition-all hover:opacity-90 hover:scale-[1.02] ${slotColors[bi % slotColors.length]} ${dragging?.id === b.id ? 'opacity-40 scale-95' : ''}`}
                          title={`${b.customer} · ${b.service} — drag to reschedule`}
                        >
                          <div className="flex items-center gap-1">
                            <GripVertical size={9} className="opacity-50 shrink-0" />
                            <p className="truncate font-semibold">{b.customer.split(' ')[0]}</p>
                          </div>
                          <p className="truncate opacity-80 pl-3">{b.service}</p>
                        </div>
                      ))}
                      {isOver && bkgs.length === 0 && (
                        <div className="w-full h-10 rounded-md border-2 border-dashed border-blue-500/60 flex items-center justify-center">
                          <p className="text-blue-400 text-xs">Drop here</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-800">
            {DAYS.map(d => <div key={d} className="text-center py-3 text-slate-500 text-xs font-semibold uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((day, i) => {
              const isToday = day === currentDate.getDate();
              const dayDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
              const dayBkgs = dayDate ? getBookingsForDay(dayDate) : [];
              return (
                <div key={i} className={`min-h-[80px] border-r border-b border-slate-800/50 p-1.5 ${!day ? 'bg-slate-900/30' : 'hover:bg-slate-800/20 transition-colors'}`}>
                  {day && (
                    <>
                      <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{day}</span>
                      <div className="space-y-0.5">
                        {dayBkgs.slice(0, 2).map((b, bi) => (
                          <div key={bi} onClick={() => setSelectedBooking(b)} className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[b.status] || 'bg-slate-400'}`} />
                            <p className="text-slate-300 text-xs truncate">{b.customer.split(' ')[0]}</p>
                          </div>
                        ))}
                        {dayBkgs.length > 2 && <p className="text-slate-500 text-xs">+{dayBkgs.length - 2} more</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {view === 'day' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Tuesday, June 11, 2024</p>
              <p className="text-slate-500 text-xs">{business.bookings.filter(b => b.date === '2024-06-11').length} bookings today</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {HOURS.map(hour => {
              const bkgs = business.bookings.filter(b => b.date === '2024-06-11' && b.time.startsWith(hour.split(':')[0]));
              return (
                <div key={hour} className="flex gap-4">
                  <span className="text-slate-600 text-xs font-mono w-12 pt-2 shrink-0">{hour}</span>
                  <div className={`flex-1 min-h-[48px] rounded-xl border transition-colors ${bkgs.length > 0 ? 'border-slate-700' : 'border-slate-800/50'}`}>
                    {bkgs.length > 0 ? (
                      <div className="p-3 space-y-2">
                        {bkgs.map((b, bi) => (
                          <button key={bi} onClick={() => setSelectedBooking(b)} className="w-full text-left flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className={`w-1 h-10 rounded-full shrink-0 ${statusDot[b.status] || 'bg-slate-500'}`} />
                            <div>
                              <p className="text-white text-sm font-semibold">{b.customer}</p>
                              <p className="text-slate-400 text-xs">{b.service} · {b.staff} · <StatusBadge status={b.status} /></p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[40px]">
                        <span className="text-slate-700 text-xs">Free</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking detail modal */}
      {selectedBooking && (
        <Modal title="Booking Details" onClose={() => setSelectedBooking(null)} size="sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">{selectedBooking.customer[0]}</div>
              <div>
                <p className="text-white font-bold">{selectedBooking.customer}</p>
                <p className="text-slate-400 text-sm">{selectedBooking.service}</p>
              </div>
            </div>
            {[
              { label: 'Date', value: selectedBooking.date },
              { label: 'Time', value: selectedBooking.time },
              { label: 'Staff', value: selectedBooking.staff },
              { label: 'Amount', value: `$${selectedBooking.amount}` },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                <span className="text-slate-400 text-xs">{r.label}</span>
                <span className="text-slate-200 text-xs font-medium">{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-xs">Status</span>
              <StatusBadge status={selectedBooking.status} />
            </div>
            <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-xs">Payment</span>
              <StatusBadge status={selectedBooking.payment} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setToast('Booking confirmed. Demo only.'); setSelectedBooking(null); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">Confirm</button>
              <button onClick={() => { setToast('Reminder sent. Demo only.'); setSelectedBooking(null); }} className="flex-1 bg-green-600/15 hover:bg-green-600/25 border border-green-600/30 text-green-400 text-sm font-medium py-2.5 rounded-xl transition-colors">Remind</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
