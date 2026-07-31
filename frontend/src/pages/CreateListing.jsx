import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, MapPin, Tag, FileText, IndianRupee, PlusCircle } from 'lucide-react';
import Input, { Textarea, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';
import { api, listings, categories } from '../api/api';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const styles = `
  .cl-page { padding: 40px 0 80px; }
  .cl-container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
  .cl-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 40px; box-shadow: var(--shadow-xl); }
  .cl-title { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
  .cl-sub { color: var(--text-secondary); margin-bottom: 32px; font-size: 15px; }

  .dropzone { border: 2px dashed var(--border); border-radius: var(--radius-xl); padding: 36px 20px; text-align: center; background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s; }
  .dropzone:hover, .dropzone.active { border-color: var(--accent); background: rgba(244,63,94,0.06); }

  .img-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 20px; }
  .img-thumb { aspect-ratio: 1; border-radius: var(--radius-md); overflow: hidden; position: relative; border: 1px solid var(--border); }
  .img-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .img-remove { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.7); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
`;

export default function CreateListing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categoryList, setCategoryList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: '', condition: 'good', location: ''
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    categories.list().then(data => setCategoryList(data.categories || data || [])).catch(() => {});
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Valid price is required';
    if (!form.category) errs.category = 'Select a category';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (images.length === 0 && imageFiles.length === 0) errs.images = 'At least 1 image is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    setImageFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { url: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let uploadedUrls = [];
      if (imageFiles.length > 0) {
        const uploadRes = await api.upload(imageFiles);
        uploadedUrls = (uploadRes.urls || uploadRes.data?.urls || []).map(u => ({ url: u.url }));
      }

      await listings.create({
        ...form,
        price: Number(form.price),
        images: uploadedUrls
      });

      navigate('/listing-success', { state: { title: form.title } });
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create listing' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="cl-page">
        <div className="cl-container">
          <div className="cl-card">
            <h1 className="cl-title">Create New Listing</h1>
            <p className="cl-sub">Fill in the details to publish your pre-owned item on Nexus</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Input
                label="Listing Title"
                placeholder="e.g., iPhone 13 Pro Max 256GB Sierra Blue"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                error={errors.title}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  error={errors.category}
                >
                  <option value="">Select Category</option>
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
                  placeholder="0"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  error={errors.price}
                />

                <Input
                  label="Location"
                  placeholder="City, Area"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  error={errors.location}
                />
              </div>

              <Textarea
                label="Item Description"
                placeholder="Describe condition, age, inclusions, and reason for selling..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                error={errors.description}
              />

              <div>
                <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Product Photos</label>
                <div
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} color="var(--accent)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ color: '#ffffff', fontWeight: 600 }}>Click or Drag & Drop Photos</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>PNG, JPG or WEBP up to 5MB</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </div>
                {errors.images && <p className="input-error-text" style={{ marginTop: 6 }}>{errors.images}</p>}

                {images.length > 0 && (
                  <div className="img-grid">
                    {images.map((img, i) => (
                      <div key={i} className="img-thumb">
                        <img src={img.url} alt="Preview" />
                        <button type="button" className="img-remove" onClick={() => removeImage(i)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.submit && <p className="input-error-text">{errors.submit}</p>}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                icon={PlusCircle}
              >
                Publish Listing Now
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
