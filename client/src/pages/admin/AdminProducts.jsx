import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import ProductImage from '../../components/ui/ProductImage.jsx';
import ProductForm from '../../components/admin/ProductForm.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../utils/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatNaira } from '../../utils/format.js';

export default function AdminProducts() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, product = edit
  const [version, setVersion] = useState(0);

  const { data, loading, error } = useApi(() => api(`/admin/products?q=${encodeURIComponent(search)}`), [search, version]);
  const { data: catData } = useApi(() => api('/categories'), []);
  const items = data?.items || [];
  const categories = catData?.items || [];

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Past orders keep their record of it.`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE' });
      toast('Product deleted');
      setVersion((v) => v + 1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="adm__head">
        <h1>Products</h1>
        <div className="adm__tools">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(q); }} role="search">
            <input className="input" placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <Button onClick={() => setEditing({})}>Add product</Button>
        </div>
      </div>

      {error && <p className="alert alert--error">{error.message}</p>}
      <div className="tablewrap" aria-busy={loading}>
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Visibility</th><th /></tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && <tr><td colSpan="6">No products found.</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="table__thumb"><ProductImage src={p.image_url} kind={p.category_id && categories.find((c) => c.id === p.category_id)?.slug} alt="" /></div>
                    <div><strong>{p.name}</strong>{p.is_featured ? <div className="pill pill--gold" style={{ marginTop: 4 }}>Featured</div> : null}</div>
                  </div>
                </td>
                <td>{p.category_name}</td>
                <td className="num">{formatNaira(p.price)}</td>
                <td className="num" style={p.stock <= 3 ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>{p.stock}</td>
                <td><span className={`pill ${p.is_active ? 'pill--green' : 'pill--red'}`}>{p.is_active ? 'Visible' : 'Hidden'}</span></td>
                <td>
                  <div className="table__actions">
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                    <Button size="sm" variant="quiet" onClick={() => remove(p)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          product={editing.id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setVersion((v) => v + 1); toast('Product saved'); }}
        />
      )}
    </>
  );
}
