import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ImageUploader from '../../components/ImageUploader';
import { Icon, icons } from '../../components/Icons';
import { Star } from 'lucide-react';

const API = import.meta.env.VITE_API_URL + '/api';

// --- COMPONENTE: TARJETA DE EDICIÓN RÁPIDA ---
const TarjetaProducto = ({ prod, index, isMobile, onEditarCompleto, onEliminar, onQuickSave, onToggleFavorito }) => {
  const [precio, setPrecio] = useState(prod.precio_por_metro);
  const [stock, setStock] = useState(prod.stock_metros);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const tieneCambios = Number(precio) !== Number(prod.precio_por_metro) || Number(stock) !== Number(prod.stock_metros);

  const handleGuardarRapido = async () => {
    let msg = 'Actualizado correctamente';
    const cambioPrecio = Number(precio) !== Number(prod.precio_por_metro);
    const cambioStock = Number(stock) !== Number(prod.stock_metros);

    if (cambioPrecio && !cambioStock) msg = 'Precio actualizado correctamente';
    if (cambioStock && !cambioPrecio) msg = 'Stock actualizado correctamente';

    setGuardando(true);
    const exito = await onQuickSave(prod.id, { precio_por_metro: precio, stock_metros: stock });
    setGuardando(false);

    if (exito) {
      setMensajeExito(msg);
      setTimeout(() => setMensajeExito(''), 3000);
    }
  };

  const bgAlternado = index % 2 === 0 ? '#ffffff' : '#f8fafc';
  
  return (
    <div style={{ 
      display: 'flex', flexDirection: isMobile ? 'column' : 'row', 
      alignItems: isMobile ? 'stretch' : 'center', 
      justifyContent: 'space-between',
      padding: '20px', borderBottom: '1px solid #e2e8f0', gap: isMobile ? '16px' : '20px',
      backgroundColor: bgAlternado,
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    }}
    onClick={() => onEditarCompleto(prod)} 
    onMouseEnter={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#f1f5f9')} 
    onMouseLeave={(e) => !isMobile && (e.currentTarget.style.backgroundColor = bgAlternado)} 
    >
      
      {/* SECCIÓN 1: Imagen y Títulos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: isMobile ? 'none' : 1, minWidth: 0 }}>
        <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon d={icons.image} size={24} color="#cbd5e1" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.nombre}</div>
          
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {prod.color_hex && (
              <div title={prod.color_nombre} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: prod.color_hex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }}></div>
            )}
            <span>
              {prod.categorias_nombres && prod.categorias_nombres.length > 0 ? prod.categorias_nombres.join(' • ') : 'Sin categoría'} • {prod.ancho_cm}cm ancho
            </span>
          </div>
          {/* Opcional: Mostrar usos debajo (Telas para...) */}
          {prod.usos_nombres && prod.usos_nombres.length > 0 && (
             <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
               Para: {prod.usos_nombres.join(', ')}
             </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: Inputs Rápidos */}
      <div 
        style={{ 
          display: 'flex', flexDirection: isMobile && tieneCambios ? 'column' : 'row', 
          alignItems: isMobile && tieneCambios ? 'stretch' : 'center', 
          gap: '12px', width: isMobile ? '100%' : 'auto' 
        }}
        onClick={(e) => e.stopPropagation()} 
      >
        <div style={{ 
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', 
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '12px', alignItems: 'center',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', flex: 1
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>PRECIO /M</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>$</span>
              <input 
                type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '15px', color: '#0f172a', outline: 'none', minWidth: 0 }}
              />
            </div>
          </div>
          
          <div style={{ width: '1px', height: '100%', background: '#e2e8f0' }}></div>
          
          <div style={{ paddingLeft: '4px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>STOCK</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="number" min="0" step="0.1" value={stock} onChange={e => setStock(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '15px', color: '#0f172a', outline: 'none', minWidth: 0 }}
              />
              <span style={{ color: '#475569', fontWeight: 600, fontSize: '13px' }}>m</span>
            </div>
          </div>
        </div>

        {mensajeExito ? (
          <div style={{
            background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: '10px',
            fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            border: '1px solid #bbf7d0', width: isMobile ? '100%' : 'auto', justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}>
            <Icon d={icons.check} size={14} color="#16a34a" /> {mensajeExito}
          </div>
        ) : tieneCambios && (
          <button 
            onClick={handleGuardarRapido} disabled={guardando}
            style={{ 
              background: '#10b981', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '10px', 
              fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', width: isMobile ? '100%' : 'auto'
            }}>
            {guardando ? 'Guardando...' : <><Icon d={icons.check} size={14} color="white" /> Guardar</>}
          </button>
        )}
      </div>

      {/* SECCIÓN 3: Etiqueta Visual y Acciones */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        gap: '16px', flexShrink: 0,
        borderTop: isMobile ? '1px dashed #e2e8f0' : 'none',
        paddingTop: isMobile ? '16px' : '0'
      }}>
        <span style={{ 
          padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '11px',
          background: Number(prod.stock_metros) <= 2 ? '#fef2f2' : '#f0fdf4', 
          color: Number(prod.stock_metros) <= 2 ? '#ef4444' : '#15803d' 
        }}>
          {Number(prod.stock_metros) <= 2 ? 'STOCK BAJO' : 'EN STOCK'}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorito(prod); }} 
            title={prod.es_favorito ? "Quitar de favoritas" : "Marcar como favorita"} 
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Star size={16} fill={prod.es_favorito ? "#eab308" : "transparent"} color={prod.es_favorito ? "#eab308" : "#94a3b8"} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onEditarCompleto(prod); }} 
            title="Editar completo" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon d={icons.edit} size={16} color="#6366f1" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onEliminar(prod.id); }} 
            title="Eliminar" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon d={icons.trash} size={16} color="#ef4444" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- VISTA PRINCIPAL ---
const VistaProductos = () => {
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({ 
    nombre: '', precio_por_metro: '', descripcion: '', ancho_cm: '', 
    stock_metros: '', categorias: [], usos: [], color: '', es_favorito: false 
  });
  
  const [images, setImages] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]); 
  const [usosDisponibles, setUsosDisponibles] = useState([]); 

  const [fetching, setFetching] = useState(true);
  const [editando, setEditando] = useState(null); 
  const [imagenesOriginales, setImagenesOriginales] = useState([]); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [prodRes, catRes, colRes, usosRes] = await Promise.all([
        axios.get(`${API}/productos/`),
        axios.get(`${API}/categorias/`),
        axios.get(`${API}/colores/`),
        axios.get(`${API}/usos/`),
      ]);
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || []);
      setCategorias(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
      setColores(Array.isArray(colRes.data) ? colRes.data : colRes.data.results || []);
      setUsosDisponibles(Array.isArray(usosRes.data) ? usosRes.data : usosRes.data.results || []);
    } catch {
      setProductos([]); setCategorias([]); setColores([]); setUsosDisponibles([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleQuickSave = async (id, data) => {
    try {
      const formData = new FormData();
      formData.append('precio_por_metro', data.precio_por_metro);
      formData.append('stock_metros', data.stock_metros);

      await axios.patch(`${API}/productos/${id}/`, formData);
      setProductos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      return true; 
    } catch {
      alert("Error al actualizar rápidamente. Por favor, intentá de nuevo.");
      return false; 
    }
  };

  const handleToggleFavorito = async (prod) => {
    try {
      const nuevoEstado = !prod.es_favorito;
      await axios.patch(`${API}/productos/${prod.id}/`, { es_favorito: nuevoEstado });
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, es_favorito: nuevoEstado } : p));
    } catch (error) {
      console.error(error);
      alert('Error al actualizar favorita.');
    }
  };

  const abrirEditar = (prod) => {
    setEditando(prod.id);
    setForm({
      nombre: prod.nombre, 
      precio_por_metro: prod.precio_por_metro, 
      descripcion: prod.descripcion || '',
      ancho_cm: prod.ancho_cm, 
      stock_metros: prod.stock_metros, 
      categorias: prod.categorias || [],
      usos: prod.usos || [],
      color: prod.color || '', 
      es_favorito: prod.es_favorito || false
    });

    const imagenesCargadas = [];
    const idsOriginales = [];
    if (prod.imagen) imagenesCargadas.push({ preview: prod.imagen, id: 'main', file: null });
    if (prod.imagenes_galeria && Array.isArray(prod.imagenes_galeria)) {
      prod.imagenes_galeria.forEach((imgObj) => {
        imagenesCargadas.push({ preview: imgObj.imagen, id: imgObj.id, file: null });
        idsOriginales.push(imgObj.id);
      });
    }

    setImagenesOriginales(idsOriginales); setImages(imagenesCargadas); setShowForm(true); setStatusMsg('');
  };

  const resetForm = () => {
    setShowForm(false);
    setForm({ nombre: '', precio_por_metro: '', descripcion: '', ancho_cm: '', stock_metros: '', categorias: [], usos: [], color: '', es_favorito: false });
    setImages([]); setImagenesOriginales([]); setEditando(null); setStatusMsg('');
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio_por_metro || !form.ancho_cm || !form.stock_metros) {
      setStatusMsg('Completá nombre, precio, ancho y stock.'); return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('precio_por_metro', form.precio_por_metro);
      formData.append('ancho_cm', form.ancho_cm);
      formData.append('stock_metros', form.stock_metros);
      formData.append('descripcion', form.descripcion);
      formData.append('es_favorito', form.es_favorito ? 'True' : 'False');
      
      if (form.color) {
        formData.append('color', form.color);
      } else {
        formData.append('color', '');
      }
      
      if (form.categorias && form.categorias.length > 0) {
        form.categorias.forEach(catId => {
          formData.append('categorias', catId);
        });
      }

      if (form.usos && form.usos.length > 0) {
        form.usos.forEach(usoId => {
          formData.append('usos', usoId);
        });
      }
      
      images.forEach((img, i) => { if (img.file) formData.append(i === 0 ? 'imagen' : `imagen_extra_${i}`, img.file); });

      if (editando) {
        const idsActuales = images.map(img => img.id).filter(id => id && id !== 'main');
        const idsEliminados = imagenesOriginales.filter(id => !idsActuales.includes(id));
        idsEliminados.forEach(id => formData.append('eliminar_imagenes', id));
        await axios.patch(`${API}/productos/${editando}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${API}/productos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setStatusMsg('ok'); resetForm(); await fetchData(); 
    } catch {
      setStatusMsg('Error al guardar. Verificá los datos e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tela del catálogo?')) return;
    try {
      await axios.delete(`${API}/productos/${id}/`);
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('No se pudo eliminar el producto.');
    }
  };

  const productosFiltrados = categoriaFiltro === 'todas' 
    ? productos 
    : productos.filter(p => p.categorias && p.categorias.includes(categoriaFiltro));

  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1e293b', background: 'white', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
        <Header title="Productos & Stock" subtitle="Gestioná tu catálogo de telas" />
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14
        }}>
          <Icon d={icons.plus} size={16} color="white" /> Agregar Tela
        </button>
      </div>

      {showForm && (
        <Card style={{ width: '100%', marginBottom: 28, padding: isMobile ? '16px' : '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon d={icons.tag} size={20} color="#6366f1" />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{editando ? 'Editar Tela' : 'Nueva Tela'}</span>
            </div>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon d={icons.x} size={18} color="#94a3b8" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Nombre de la tela *</label>
              <input style={inputStyle} placeholder="Ej: Gamuzado Premium" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Precio por Metro (ARS) *</label>
              <input style={inputStyle} type="number" min="0" step="100" placeholder="0.00" value={form.precio_por_metro} onChange={e => setForm({ ...form, precio_por_metro: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Ancho de fábrica (cm) *</label>
              <input style={inputStyle} type="number" min="1" placeholder="Ej: 150" value={form.ancho_cm} onChange={e => setForm({ ...form, ancho_cm: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Stock disponible (Metros) *</label>
              <input style={inputStyle} type="number" min="0" step="0.1" placeholder="Ej: 8.5" value={form.stock_metros} onChange={e => setForm({ ...form, stock_metros: e.target.value })} />
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Categorías (Hacé clic para activar o desactivar)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {categorias.map(cat => {
                  const isSelected = form.categorias && form.categorias.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm(prev => ({
                          ...prev,
                          categorias: isSelected 
                            ? prev.categorias.filter(id => id !== cat.id) 
                            : [...(prev.categorias || []), cat.id] 
                        }));
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: '20px',
                        border: isSelected ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#e0e7ff' : '#f8fafc',
                        color: isSelected ? '#4338ca' : '#64748b',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      {isSelected && <Icon d={icons.check} size={14} color="#4338ca" />}
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 👇 NUEVA SECCIÓN: Selector de Usos (Telas para...) 👇 */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Telas Para... (Etiquetas de uso opcionales)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {usosDisponibles.map(uso => {
                  const isSelected = form.usos && form.usos.includes(uso.id);
                  return (
                    <button
                      key={uso.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm(prev => ({
                          ...prev,
                          usos: isSelected 
                            ? prev.usos.filter(id => id !== uso.id) 
                            : [...(prev.usos || []), uso.id] 
                        }));
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: '20px',
                        border: isSelected ? '1.5px solid #d97706' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#fef3c7' : '#f8fafc',
                        color: isSelected ? '#b45309' : '#64748b',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      {isSelected && <Icon d={icons.check} size={14} color="#b45309" />}
                      {uso.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={{...labelStyle, marginBottom: 2}}>Color Principal (Opcional)</label>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px 0' }}>El cliente podrá filtrar por este color.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, color: '' })); }}
                  style={{
                    padding: '6px 14px', borderRadius: '20px',
                    border: form.color === '' ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                    background: form.color === '' ? '#f1f5f9' : 'white',
                    color: form.color === '' ? '#0f172a' : '#64748b',
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  🚫 Sin color
                </button>

                {colores.map(c => {
                  const isSelected = form.color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, color: c.id })); }}
                      style={{
                        padding: '6px 14px', borderRadius: '20px',
                        border: isSelected ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                        background: isSelected ? '#f8fafc' : 'white',
                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: c.codigo_hex, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#0f172a' : '#64748b' }}>{c.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <input 
                    type="checkbox" 
                    id="es_favorito" 
                    checked={form.es_favorito} 
                    onChange={e => setForm({...form, es_favorito: e.target.checked})} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="es_favorito" style={{fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer'}}>
                    🌟 Marcar como Tela Favorita / Destacada
                </label>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Detalles de la tela, composición..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon d={icons.grid} size={14} color="#6366f1" /> Imágenes (opcional · hasta 5)
              </label>
              <ImageUploader images={images} setImages={setImages} max={5} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: loading ? '#c7d2fe' : '#6366f1', color: 'white', fontWeight: 700 }}>
              {loading ? 'Guardando...' : 'Guardar tela'}
            </button>
            <button onClick={resetForm} style={{ padding: '12px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>

          {statusMsg === 'ok' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
              <Icon d={icons.check} size={16} color="#16a34a" /><span style={{ color: '#15803d', fontWeight: 600 }}>¡Tela guardada!</span>
            </div>
          )}
          {statusMsg && statusMsg !== 'ok' && <p style={{ marginTop: 12, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{statusMsg}</p>}
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {fetching ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}><p style={{ fontWeight: 600 }}>Cargando telas...</p></div>
        ) : productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <Icon d={icons.package} size={40} color="#e2e8f0" />
            <p style={{ marginTop: 12, fontWeight: 600 }}>No hay telas cargadas aún</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', 
              borderBottom: '1px solid #e2e8f0', overflowX: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px', flexShrink: 0 }}>
                FILTRAR POR:
              </span>

              <button
                onClick={() => setCategoriaFiltro('todas')}
                style={{
                  padding: '8px 16px', borderRadius: '24px', border: categoriaFiltro === 'todas' ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: categoriaFiltro === 'todas' ? '#0f172a' : 'white',
                  color: categoriaFiltro === 'todas' ? 'white' : '#475569',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                }}
              >
                Todos
              </button>

              {categorias.map(cat => {
                const isActive = categoriaFiltro === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaFiltro(cat.id)}
                    style={{
                      padding: cat.imagen ? '4px 16px 4px 6px' : '8px 16px',
                      borderRadius: '24px', border: isActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      background: isActive ? '#0f172a' : 'white',
                      color: isActive ? 'white' : '#475569',
                      fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                  >
                    {cat.imagen && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={cat.imagen} alt={cat.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    {cat.nombre}
                  </button>
                )
              })}
            </div>

            {productosFiltrados.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                 <p style={{ fontWeight: 600 }}>No hay telas en esta categoría.</p>
               </div>
            ) : (
               productosFiltrados.map((prod, index) => (
                 <TarjetaProducto 
                   key={prod.id} 
                   prod={prod}
                   index={index}
                   isMobile={isMobile}
                   onEditarCompleto={abrirEditar} 
                   onEliminar={handleEliminar}
                   onQuickSave={handleQuickSave}
                   onToggleFavorito={handleToggleFavorito}
                 />
               ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VistaProductos;