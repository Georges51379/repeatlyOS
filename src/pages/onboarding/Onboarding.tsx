import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import FormField, { fieldInputClass } from '../../components/FormField';
import type { City, BusinessType } from '../../types/domain';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type Step = 'city' | 'type' | 'details';

export default function Onboarding() {
  const { refreshMemberships } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('city');
  const [cities, setCities] = useState<City[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [cityId, setCityId] = useState<string | null>(null);
  const [businessTypeKey, setBusinessTypeKey] = useState<string | null>(null);
  const [typeSearch, setTypeSearch] = useState('');
  const [name, setName] = useState('');
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cityRows }, { data: typeRows }] = await Promise.all([
        supabase.from('cities').select('*').eq('active', true).order('name'),
        supabase.from('business_types').select('*').order('label'),
      ]);
      setCities((cityRows ?? []) as City[]);
      setBusinessTypes((typeRows ?? []) as BusinessType[]);
      setLoadingOptions(false);
    })();
  }, []);

  const slug = slugOverride ?? slugify(name);
  const selectedType = businessTypes.find((t) => t.key === businessTypeKey);
  const filteredTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    if (!q) return businessTypes;
    return businessTypes.filter((t) => t.label.toLowerCase().includes(q));
  }, [businessTypes, typeSearch]);

  const handleSubmit = async () => {
    if (!cityId || !businessTypeKey || !name.trim() || !slug.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('businesses').insert({
      city_id: cityId,
      business_type_key: businessTypeKey,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      status: 'pending_approval',
      custom_field_values: customFieldValues,
    });

    setSubmitting(false);

    if (insertError) {
      if (insertError.code === '23505') {
        setError('That name is already taken in this city — try a different name.');
      } else {
        setError(insertError.message);
      }
      return;
    }

    await refreshMemberships();
    navigate('/app');
  };

  if (loadingOptions) return null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS</span>
        </div>

        <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
          {(['city', 'type', 'details'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  step === s
                    ? 'border-blue-500 text-blue-400'
                    : 'border-slate-700 text-slate-600'
                }`}
              >
                {i + 1}
              </span>
              <span className={step === s ? 'text-slate-300' : ''}>
                {s === 'city' ? 'City' : s === 'type' ? 'Business Type' : 'Details'}
              </span>
              {i < 2 && <span className="text-slate-700">→</span>}
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {step === 'city' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-white font-semibold text-lg mb-1">Where's your business?</h1>
                <p className="text-slate-500 text-sm">Choose the city you operate in.</p>
              </div>
              <div className="space-y-2">
                {cities.length === 0 && (
                  <p className="text-sm text-slate-500">No cities open for registration yet.</p>
                )}
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => setCityId(city.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      cityId === city.id
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-white text-sm font-medium">
                      {city.display_name || city.name}
                    </span>
                    <span className="block text-xs text-slate-500">{city.region ?? city.country}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('type')}
                disabled={!cityId}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'type' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-white font-semibold text-lg mb-1">What kind of business?</h1>
                <p className="text-slate-500 text-sm">
                  Pick the closest match — it sets up sensible defaults you can still change later.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  placeholder="Search — e.g. barber, bakery, gym…"
                  className={`${fieldInputClass} pl-9`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {filteredTypes.length === 0 ? (
                  <p className="col-span-2 text-sm text-slate-500 text-center py-6">
                    No match for "{typeSearch}" — pick "Other" and describe it in the details step.
                  </p>
                ) : (
                  filteredTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setBusinessTypeKey(type.key)}
                      className={`text-left px-3.5 py-3 rounded-lg border transition-colors ${
                        businessTypeKey === type.key
                          ? 'border-blue-500 bg-blue-600/10 text-white'
                          : 'border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('city')}
                  className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('details')}
                  disabled={!businessTypeKey}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-white font-semibold text-lg mb-1">Tell us about it</h1>
                <p className="text-slate-500 text-sm">
                  {selectedType?.label} in {cities.find((c) => c.id === cityId)?.display_name}
                </p>
              </div>

              <FormField label="Business name" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldInputClass}
                  placeholder="e.g. Georges Computers"
                />
              </FormField>
              <FormField label="Web address" required helper={`Shoppers will find you at repeatlyos.com/${cities.find((c) => c.id === cityId)?.slug ?? 'city'}/business/${slug || '…'}`}>
                <input
                  value={slug}
                  onChange={(e) => setSlugOverride(slugify(e.target.value))}
                  className={fieldInputClass}
                  placeholder="georges-computers"
                />
              </FormField>
              <FormField label="Description" helper="A sentence or two shoppers see before anything else.">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What do you sell or offer?"
                  className={fieldInputClass}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Phone" helper="Optional.">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldInputClass}
                    placeholder="+961 1 234 567"
                  />
                </FormField>
                <FormField label="WhatsApp" helper="Optional.">
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={fieldInputClass}
                    placeholder="+961 70 123 456"
                  />
                </FormField>
              </div>
              <FormField label="Public email" helper="Optional — shown to shoppers, not used to sign in.">
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldInputClass} placeholder="name@example.com" />
              </FormField>
              <FormField label="Address" helper="Optional.">
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={fieldInputClass} placeholder="Street, building, city" />
              </FormField>

              {/* Vertical-specific fields (migration
                  20260914000012_business_type_custom_fields.sql) — a
                  restaurant/hotel/etc. gets fields a generic form wouldn't
                  ask for, driven entirely by business_types.custom_fields
                  rather than a hardcoded per-type form. */}
              {(selectedType?.custom_fields ?? [])
                .filter((f) => f.applies_to === 'business')
                .map((field) => (
                  <FormField key={field.key} label={field.label}>
                    {field.type === 'select' ? (
                      <select
                        value={customFieldValues[field.key] ?? ''}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.key]: e.target.value })}
                        className={fieldInputClass}
                      >
                        <option value="">—</option>
                        {(field.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={customFieldValues[field.key] ?? ''}
                        onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.key]: e.target.value })}
                        className={fieldInputClass}
                      />
                    )}
                  </FormField>
                ))}

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('type')}
                  className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim() || !slug.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Submitting…' : 'Submit for approval'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
