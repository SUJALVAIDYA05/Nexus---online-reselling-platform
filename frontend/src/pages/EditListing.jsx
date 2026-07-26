import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, ImageIcon, MapPin, Tag, FileText, DollarSign, Layers, Pencil } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Input, { Textarea, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { api, listings, categories } from '../api/api';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [categoryList, setCategoryList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [listingRes, catRes] = await Promise.all([
          listings.get(id),
          categories.list(),
        ]);
        const listing = listingRes.listing || listingRes;
        const cats = catRes.categories || catRes || [];
        setCategoryList(cats);

        if (user && listing.seller?._id !== user._id && listing.seller !== user._id) {
          setNotFound(true);
          return;
        }

        setForm({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price?.toString() || '',
          category: listing.category?._id || listing.category || '',
          condition: listing.condition || '',
          location: listing.location || '',
        });

        const imgs = (listing.images || []).map(img => ({
          url: typeof img === 'string' ? img : img.url,
          publicId: typeof img === 'object' ? img.publicId : undefined,
        }));
        setImages(imgs);
        setExistingImages(imgs);
      } catch {
        setNotFound(true);
      } finally {
        setLoadingData(false);
      }
    };
    if (user) load();
  }, [id, user]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters';
    if (!form.price) errs.price = 'Price is required';
    else if (Number(form.price) <= 0) errs.price = 'Price must be greater than 0';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.condition) errs.condition = 'Please select a condition';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (images.length === 0) errs.images = 'At least one image is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const total = images.length + imageFiles.length + validFiles.length;
    if (total > 6) {
      setErrors(prev => ({ ...prev, images: 'Maximum 6 images allowed' }));
      return;
    }
    setImageFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { url: e.target.result, temp: true }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const img = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));
    if (img.temp) {
      setImageFiles(prev => prev.filter((_, i) => {
        const tempIdx = images.slice(0, index).filter(im => im.temp).length;
        return i !== tempIdx;
      }));
    } else {
      setExistingImages(prev => prev.filter((_, i) => i !== images.slice(0, index).filter(im => !im.temp).length));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let allImageUrls = [...existingImages];

      if (imageFiles.length > 0) {
        setUploading(true);
        const uploadRes = await api.upload(imageFiles);
        const newUrls = (uploadRes.urls || uploadRes.data?.urls || []).map(u => ({
          url: u.url,
          publicId: u.publicId,
        }));
        allImageUrls = [...allImageUrls, ...newUrls];
        setUploading(false);
      }

      await listings.update(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        condition: form.condition,
        location: form.location.trim(),
        images: allImageUrls,
      });

      navigate('/my-listings');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to update listing' });
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (loadingData) return <PageLoader />;

  if (notFound) {
    return (
      <div className="page-enter" style={styles.centered}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Listing not found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>This listing doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => navigate('/my-listings')}>Back to My Listings</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Edit Listing</h1>
          <p style={styles.subtitle}>Update your listing details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div style={styles.main}>
              <Card style={{ animation: 'slideUp 0.4s ease' }}>
                <CardHeader>
                  <div style={styles.cardTitle}>
                    <FileText size={20} color="var(--accent)" />
                    <span>Item Details</span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div style={styles.formStack}>
                    <Input
                      label="Title"
                      placeholder="e.g. iPhone 15 Pro Max 256GB"
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      error={errors.title}
                      icon={Tag}
                    />
                    <Textarea
                      label="Description"
                      placeholder="Describe your item in detail..."
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      error={errors.description}
                      rows={5}
                    />
                    <Input
                      label="Price"
                      type="number"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      error={errors.price}
                      icon={DollarSign}
                    />
                  </div>
                </CardBody>
              </Card>

              <Card style={{ animation: 'slideUp 0.5s ease' }}>
                <CardHeader>
                  <div style={styles.cardTitle}>
                    <Layers size={20} color="var(--accent)" />
                    <span>Category & Condition</span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div style={styles.row}>
                    <Select
                      label="Category"
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      error={errors.category}
                    >
                      <option value="">Select category</option>
                      {categoryList.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </Select>
                    <Select
                      label="Condition"
                      value={form.condition}
                      onChange={(e) => updateField('condition', e.target.value)}
                      error={errors.condition}
                    >
                      <option value="">Select condition</option>
                      {CONDITIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Select>
                  </div>
                  <Input
                    label="Location"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    error={errors.location}
                    icon={MapPin}
                  />
                </CardBody>
              </Card>
            </div>

            <div style={styles.sidebar}>
              <Card style={{ animation: 'slideUp 0.45s ease' }}>
                <CardHeader>
                  <div style={styles.cardTitle}>
                    <ImageIcon size={20} color="var(--accent)" />
                    <span>Photos</span>
                  </div>
                </CardHeader>
                <CardBody>
                  <p style={styles.imageHelper}>Add up to 6 photos. First photo will be the cover.</p>

                  <div
                    ref={dropRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      ...styles.dropZone,
                      ...(dragOver ? styles.dropZoneActive : {}),
                      ...(errors.images ? styles.dropZoneError : {}),
                    }}
                  >
                    <Upload size={32} color={dragOver ? 'var(--accent)' : 'var(--text-tertiary)'} />
                    <p style={styles.dropText}>Drag & drop images or click to browse</p>
                    <p style={styles.dropHint}>PNG, JPG, WEBP up to 5MB each</p>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: 'none' }} />

                  {errors.images && <p style={styles.errorText}>{errors.images}</p>}

                  {images.length > 0 && (
                    <div style={styles.previewGrid}>
                      {images.map((img, i) => (
                        <div key={i} style={styles.previewItem}>
                          <img src={img.url} alt={`Preview ${i + 1}`} style={styles.previewImg} />
                          <button type="button" onClick={() => removeImage(i)} style={styles.removeBtn}>
                            <X size={14} />
                          </button>
                          {i === 0 && <span style={styles.coverBadge}>Cover</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {(uploading || submitting) && (
                    <div style={styles.uploadingOverlay}>
                      <div style={styles.spinnerSmall} />
                      <span>{uploading ? 'Uploading images...' : 'Saving changes...'}</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {errors.submit && (
            <div style={styles.errorBanner}>{errors.submit}</div>
          )}

          <div style={styles.actions}>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting} icon={Pencil}>Save Changes</Button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: '36px 0 72px' },
  container: { maxWidth: 960, margin: '0 auto', padding: '0 24px' },
  header: { marginBottom: 36 },
  title: { fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.6px' },
  subtitle: { fontSize: 15, color: 'var(--text-secondary)', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 28 },
  sidebar: { position: 'sticky', top: 96 },
  formStack: { display: 'flex', flexDirection: 'column', gap: 22 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  imageHelper: { fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 14 },
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'all var(--transition-slow)',
    background: 'var(--bg)',
  },
  dropZoneActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-light)',
    boxShadow: '0 0 0 4px var(--accent-light)',
  },
  dropZoneError: {
    borderColor: 'var(--error)',
    background: 'var(--error-bg)',
    boxShadow: '0 0 0 4px var(--error-bg)',
  },
  dropText: { fontSize: 14, color: 'var(--text-secondary)', margin: 0 },
  dropHint: { fontSize: 12, color: 'var(--text-tertiary)', margin: 0 },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 },
  previewItem: { position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--border)' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: {
    position: 'absolute', top: 6, right: 6, width: 26, height: 26,
    borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', transition: 'all var(--transition-fast)',
  },
  coverBadge: {
    position: 'absolute', bottom: 6, left: 6, fontSize: 10, fontWeight: 700,
    padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff',
    boxShadow: '0 2px 6px rgba(233, 69, 96, 0.3)',
  },
  errorText: { fontSize: 13, color: 'var(--error)', marginTop: 10 },
  uploadingOverlay: {
    display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
    padding: '12px 16px', borderRadius: 'var(--radius-lg)',
    background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 13, fontWeight: 600,
  },
  spinnerSmall: {
    width: 18, height: 18, border: '2px solid var(--accent-light)',
    borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  errorBanner: {
    padding: '14px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--error-bg)',
    color: 'var(--error)', fontSize: 14, marginTop: 18, border: '1px solid var(--error-border)',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 28, paddingBottom: 36 },
  centered: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', padding: 32,
  },
};
