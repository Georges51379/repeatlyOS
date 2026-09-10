import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Wrench, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Business, Service } from '../../types/domain';

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function ServiceDetail() {
  const { citySlug, businessSlug, serviceId } = useParams<{
    citySlug: string;
    businessSlug: string;
    serviceId: string;
  }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!citySlug || !businessSlug || !serviceId) return;
    (async () => {
      const { data: cityRow } = await supabase.from('cities').select('id').eq('slug', citySlug).maybeSingle();
      if (!cityRow) {
        setLoading(false);
        return;
      }
      const { data: businessRow } = await supabase
        .from('businesses')
        .select('*')
        .eq('city_id', cityRow.id)
        .eq('slug', businessSlug)
        .eq('status', 'active')
        .eq('marketplace_visible', true)
        .maybeSingle();
      if (!businessRow) {
        setLoading(false);
        return;
      }
      setBusiness(businessRow as Business);

      const { data: serviceRow } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('business_id', businessRow.id)
        .eq('active', true)
        .eq('booking_enabled', true)
        .maybeSingle();
      setService((serviceRow as Service) ?? null);
      setLoading(false);
    })();
  }, [citySlug, businessSlug, serviceId]);

  if (loading) return null;
  if (!business || !service) {
    return <p className="text-slate-400 text-center py-20">This service isn't available.</p>;
  }

  const handleBook = async () => {
    if (!name.trim() || !phone.trim() || !date || !time) {
      setError('Name, phone, date, and time are all required.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('bookings').insert({
      business_id: business.id,
      service_id: service.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      scheduled_date: date,
      start_time: time,
      end_time: addMinutes(time, service.duration_minutes),
      notes: notes.trim() || null,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h1 className="text-white font-semibold text-lg mb-1">Booking requested</h1>
        <p className="text-slate-400 text-sm">
          {business.name} will confirm your {service.name} booking on {date} at {time}.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
          <Wrench className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{business.name}</p>
          <h1 className="text-white font-semibold">{service.name}</h1>
          <p className="text-xs text-slate-500">
            {service.duration_minutes} min{service.price != null ? ` · $${service.price}` : ''}
          </p>
        </div>
      </div>

      {service.description && <p className="text-slate-400 text-sm mb-6">{service.description}</p>}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-white font-medium text-sm mb-1">Book this service</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name *"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone / WhatsApp *"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleBook}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {submitting ? 'Requesting…' : 'Request booking'}
        </button>
      </div>
    </div>
  );
}
