import { useEffect, useState } from 'react';
import Field from '../ui/Field.jsx';
import Button from '../ui/Button.jsx';
import ProductImage from '../ui/ProductImage.jsx';
import Icon from '../ui/Icon.jsx';
import { api } from '../../api/client.js';

const EMPTY = {
  name: '', category_id: '', price: '', compare_at_price: '', stock: '0',
  description: '', image_url: '', is_featured: false, is_active: true,
};

export default function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    product
      ? { ...EMPTY, ...product, compare_at_price: product.compare_at_price ?? '', image_url: product.image_url ?? '', description: product.description ?? '', is_featured: !!product.is_featured, is_active: !!product.is_active }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('image', file);
    setUploading(true);
    setFormError('');
    try {
      const { url } = await api('/admin/upload', { method: 'POST', form: body });
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      const body = { ...form, category_id: Number(form.category_id) || 0 };
      if (product) await api(`/admin/products/${product.id}`, { method: 'PUT', body });
      else await api('/admin/products', { method: 'POST', body });
      onSaved();
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const slug = categories.find((c) => c.id === Number(form.category_id))?.slug;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={product ? 'Edit product' : 'Add product'}>
      <form className="modal__box" onSubmit={submit} noValidate>
        <div className="modal__head">
          <h2>{product ? 'Edit product' : 'Add product'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 0 }}><Icon name="close" /></button>
        </div>
        {formError && <p className="alert alert--error" role="alert">{formError}</p>}

        <div className="modal__grid">
          <Field className="full" label="Product name" value={form.name} onChange={set('name')} error={errors.name} />
          <Field as="select" label="Category" value={form.category_id} onChange={set('category_id')} error={errors.category_id}>
            <option value="">Choose a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Field>
          <Field label="Stock count" type="number" min="0" value={form.stock} onChange={set('stock')} error={errors.stock} />
          <Field label="Price (₦)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} error={errors.price} />
          <Field label="Old price (₦)" type="number" min="0" step="0.01" value={form.compare_at_price} onChange={set('compare_at_price')} error={errors.compare_at_price} hint="Optional. Shows struck through next to the price." />
          <Field as="textarea" className="full" label="Description" value={form.description} onChange={set('description')} />

          <div className="field full">
            <span className="label">Photo</span>
            <div className="imgfield">
              <div className="imgfield__thumb"><ProductImage src={form.image_url} kind={slug} alt="" /></div>
              <div className="imgfield__ctrl">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading} aria-label="Upload a photo" />
                <input className="input" placeholder="or paste an image link" value={form.image_url} onChange={set('image_url')} aria-label="Image link" />
                {uploading && <span className="field-hint">Uploading...</span>}
              </div>
            </div>
          </div>

          <label className="check"><input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> Show in Featured pieces</label>
          <label className="check"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Visible in the store</label>
        </div>

        <div className="modal__foot">
          <Button variant="quiet" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || uploading}>{busy ? 'Saving...' : 'Save product'}</Button>
        </div>
      </form>
    </div>
  );
}
