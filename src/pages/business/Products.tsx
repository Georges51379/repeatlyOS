import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, ShoppingBag, X, Package, DollarSign, Layers, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { hasBusinessPermission } from '../../lib/authz';
import PageHeader from '../../components/PageHeader';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/Skeletons';
import LazyImage from '../../components/LazyImage';
import type { Product } from '../../types/domain';

interface AttributeRow {
  key: string;
  value: string;
}

interface FormState {
  id: string | null;
  name: string;
  category: string;
  price: string;
  sale_price: string;
  sku: string;
  image_url: string;
  attributes: AttributeRow[];
}

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  category: '',
  price: '',
  sale_price: '',
  sku: '',
  image_url: '',
  attributes: [],
};

export default function Products() {
  const { memberships } = useAuth();
  const { business } = useCurrentBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManage = business ? hasBusinessPermission(memberships, business.id, 'products.manage') : false;

  const load = useCallback(async () => {
    if (!business) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q),
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.active).length;
    const categories = new Set(products.map((p) => p.category).filter(Boolean)).size;
    const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + (p.sale_price ?? p.price), 0) / products.length : 0;
    return { total: products.length, active, categories, avgPrice };
  }, [products]);

  if (!business) return null;

  const handleSave = async () => {
    if (!form || !form.name.trim() || !form.price.trim()) {
      setError('Name and price are required.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      business_id: business.id,
      name: form.name.trim(),
      category: form.category.trim() || null,
      price: Number(form.price),
      sale_price: form.sale_price.trim() === '' ? null : Number(form.sale_price),
      sku: form.sku.trim() || null,
      image_url: form.image_url.trim() || null,
    };

    let productId = form.id;
    if (productId) {
      const { error: saveError } = await supabase.from('products').update(payload).eq('id', productId);
      if (saveError) {
        setSaving(false);
        setError(saveError.message);
        return;
      }
    } else {
      const { data: inserted, error: saveError } = await supabase.from('products').insert(payload).select('id').single();
      if (saveError || !inserted) {
        setSaving(false);
        setError(saveError?.message ?? 'Failed to create product.');
        return;
      }
      productId = inserted.id;
    }

    const cleanAttributes = form.attributes
      .map((a) => ({ key: a.key.trim(), value: a.value.trim() }))
      .filter((a) => a.key !== '' && a.value !== '');

    await supabase.from('product_attributes').delete().eq('product_id', productId);
    if (cleanAttributes.length > 0) {
      const { error: attrError } = await supabase
        .from('product_attributes')
        .insert(cleanAttributes.map((a) => ({ product_id: productId, key: a.key, value: a.value })));
      if (attrError) {
        setSaving(false);
        setError(attrError.message);
        return;
      }
    }

    setSaving(false);
    setForm(null);
    setToast({ message: productId && form.id ? 'Product updated.' : 'Product added.', type: 'success' });
    await load();
  };

  const openEditForm = async (p: Product) => {
    const { data: attrRows } = await supabase
      .from('product_attributes')
      .select('key, value')
      .eq('product_id', p.id)
      .order('key');
    setForm({
      id: p.id,
      name: p.name,
      category: p.category ?? '',
      price: String(p.price),
      sale_price: p.sale_price != null ? String(p.sale_price) : '',
      sku: p.sku ?? '',
      image_url: p.image_url ?? '',
      attributes: (attrRows ?? []).map((a) => ({ key: a.key, value: a.value })),
    });
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
    setConfirmDeleteId(null);
    if (deleteError) {
      setToast({ message: deleteError.message, type: 'error' });
      return;
    }
    setToast({ message: 'Product removed.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Products"
        subtitle={business.name}
        actionLabel={canManage ? 'Add product' : undefined}
        actionIcon={Plus}
        onAction={() => setForm(EMPTY_FORM)}
      />

      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Total products" value={stats.total} icon={Package} accent="blue" />
          <StatCard title="Active" value={stats.active} icon={ShoppingBag} accent="emerald" />
          <StatCard title="Categories" value={stats.categories} icon={Layers} accent="purple" />
          <StatCard title="Avg. price" value={`$${stats.avgPrice.toFixed(2)}`} icon={DollarSign} accent="amber" />
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, category, or SKU…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={canManage ? 5 : 4} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4}>
                  {products.length === 0 ? (
                    <EmptyState type="products" onCreate={canManage ? () => setForm(EMPTY_FORM) : undefined} />
                  ) : (
                    <EmptyState type="generic" search={search} onClear={() => setSearch('')} />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {p.image_url ? (
                          <LazyImage src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white truncate">{p.name}</p>
                        {p.sku && <p className="text-slate-600 text-xs flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {p.sale_price != null ? (
                      <>
                        <span className="line-through text-slate-600 mr-1">${p.price}</span>${p.sale_price}
                      </>
                    ) : (
                      `$${p.price}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.active ? 'active' : 'archived'} label={p.active ? 'Active' : 'Inactive'} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditForm(p)} className="text-slate-500 hover:text-slate-300 p-1 focus-ring rounded">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(p.id)} className="text-slate-500 hover:text-red-400 p-1 focus-ring rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? 'Edit product' : 'Add product'} onClose={() => { setForm(null); setError(null); }} icon={<Package className="w-4 h-4 text-blue-400" />}>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name *"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Category"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Price *"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                placeholder="Sale price"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="Image URL"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />

            <div>
              <p className="text-xs text-slate-500 mb-2">
                Attributes (brand, size, color, edition…) — lets shoppers filter by them in search.
              </p>
              <div className="space-y-2">
                {form.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={attr.key}
                      onChange={(e) => {
                        const attributes = [...form.attributes];
                        attributes[i] = { ...attributes[i], key: e.target.value };
                        setForm({ ...form, attributes });
                      }}
                      placeholder="key (e.g. brand)"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      value={attr.value}
                      onChange={(e) => {
                        const attributes = [...form.attributes];
                        attributes[i] = { ...attributes[i], value: e.target.value };
                        setForm({ ...form, attributes });
                      }}
                      placeholder="value (e.g. Nike)"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setForm({ ...form, attributes: form.attributes.filter((_, j) => j !== i) })}
                      className="text-slate-600 hover:text-red-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setForm({ ...form, attributes: [...form.attributes, { key: '', value: '' }] })}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add attribute
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { setForm(null); setError(null); }}
              className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {confirmDeleteId && (
        <Modal title="Remove product" onClose={() => setConfirmDeleteId(null)} size="sm">
          <p className="text-slate-400 text-sm mb-4">This will permanently remove the product from your catalog.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Remove
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
