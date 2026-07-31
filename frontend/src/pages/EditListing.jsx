import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Save, X, IndianRupee } from 'lucide-react';
import Input, { Textarea, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import { listings, categories } from '../api/api';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const styles = `
  .el-page { padding: 40px 0 80px; }
  .el-container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
  .el-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 40px; box-shadow: var(--shadow-xl); }
`;

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: '', condition: '', location: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [listingRes, catRes] = await Promise.all([
          listings.get(id),
          categories.list()
        ]);
        const listing = listingRes.listing || listingRes;
        setCategoryList(catRes.categories || catRes || []);

        setForm({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price?.toString() || '',
          category: listing.category?._id || listing.category || '',
          condition: listing.condition || 'good',
          location: listing.location || '',
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) loadData();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }

    setSubmitting(true);
    try {
      await listings.update(id, {
        ...form,
        price: Number(form.price)
      });
      navigate(`/listing/${id}`);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to update listing' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="el-page">
        <div className="el-container">
          <div className="el-card">
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>Edit Listing</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Update details for your pre-owned item</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Input
                label="Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                error={errors.title}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {categoryList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>

                <Select
                  label="Condition"
                  value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Price"
                  type="number"
                  icon={IndianRupee}
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />

                <Input
                  label="Location"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <Textarea
                label="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />

              {errors.submit && <p className="input-error-text">{errors.submit}</p>}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting} icon={Save}>
                  Save Listing Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
