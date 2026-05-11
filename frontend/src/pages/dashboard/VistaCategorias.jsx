import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ImageUploader from '../../components/ImageUploader';
import { Icon, icons } from '../../components/Icons';

const API = 'http://127.0.0.1:8000/api';

const VistaCategorias = () => {
  const [categorias,  setCategorias]  = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaPadre, setCategoriaPadre] = useState(''); // Nuevo estado
  const [images,      setImages]      = useState([]); 
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [statusMsg,   setStatusMsg]   = useState('');
  const [editando,    setEditando]    = useState(null); 

  const fetchCategorias = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API}/categorias/`);
      setCategorias(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setCategorias([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  const abrirEditar = (cat) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
    setCategoriaPadre(cat.categoria_padre || ''); // Cargamos el padre si existe
    setImages([]); 
    setShowForm(true);
    setStatusMsg('');
  };

  const resetForm = () => {
    setShowForm(false);
    setNombre('');
    setDescripcion('');
    setCategoriaPadre('');
    setImages([]); 
    setEditando(null);
    setStatusMsg('');
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) { 
      setStatusMsg('El nombre es obligatorio.'); 
      return; 
    }
    
    setLoading(true); 
    setStatusMsg('');
    
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      
      // Enviamos la categoría padre (si la vacían, enviamos null o string vacío)
      if (categoriaPadre) {
        formData.append('categoria_padre', categoriaPadre);
      } else {
        formData.append('categoria_padre', ''); 
      }
      
      if (images.length > 0 && images[0].file) {
        formData.append('imagen', images[0].file);
      }

      if (editando) {
        await axios.patch(`${API}/categorias/${editando.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/categorias/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setStatusMsg('ok');
      await fetchCategorias();
      setTimeout(resetForm, 800);
    } catch {
      setStatusMsg('Error al guardar. Verificá la conexión o los datos ingresados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await axios.delete(`${API}/categorias/${id}/`);
      setCategorias(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('No se pudo eliminar. Puede que tenga productos o subcategorías asociadas.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', color: '#1e293b', background: 'white', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
        <Header title="Categorías" subtitle="Organizá tus productos por categoría" />
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
          fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          <Icon d={icons.plus} size={16} color="white" />
          Nueva categoría
        </button>
      </div>

      {showForm && (
        <Card style={{ width: '100%', marginBottom: 28, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon d={icons.category} size={20} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                {editando ? 'Editar categoría' : 'Nueva categoría'}
              </span>
            </div>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon d={icons.x} size={18} color="#94a3b8" />
            </button>
          </div>

          <div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
  gap: 20, 
  marginBottom: 20 
}}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre *</label>
              <input
                style={inputStyle}
                placeholder="Ej: Gamuza, Cuerina, Linos..."
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>
                Categoría Padre <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Si es una subcategoría)</span>
              </label>
              <select
                style={inputStyle}
                value={categoriaPadre}
                onChange={e => setCategoriaPadre(e.target.value)}
              >
                <option value="">Ninguna (Es categoría principal)</option>
                {categorias
                  .filter(c => !editando || c.id !== editando.id) // Evita que sea padre de sí misma
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre_padre ? `${cat.nombre_padre} > ${cat.nombre}` : cat.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descripción <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                placeholder="Breve descripción de la categoría..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon d={icons.image} size={14} color="#6366f1" />
                Imagen de la categoría <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(opcional)</span>
              </label>
              <ImageUploader images={images} setImages={setImages} max={1} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSubmit} disabled={loading} style={{
              flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear categoría'}
            </button>
            <button onClick={resetForm} style={{
              padding: '12px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}>Cancelar</button>
          </div>

          {statusMsg === 'ok' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
              <Icon d={icons.check} size={16} color="#16a34a" />
              <span style={{ color: '#15803d', fontWeight: 600, fontSize: 14 }}>¡Categoría guardada!</span>
            </div>
          )}
          {statusMsg && statusMsg !== 'ok' && (
            <p style={{ marginTop: 12, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{statusMsg}</p>
          )}
        </Card>
      )}

      <Card style={{ padding: 0, overflowX: 'auto' }}>
        {fetching ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}><p style={{ fontWeight: 600 }}>Cargando categorías...</p></div>
        ) : categorias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <Icon d={icons.category} size={40} color="#e2e8f0" />
            <p style={{ marginTop: 12, fontWeight: 600 }}>No hay categorías todavía</p>
          </div>
        ) : (
          <div style={{ minWidth: 600 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1.5fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', gap: 16, color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Img</span>
              <span>Nombre</span>
              <span>Jerarquía</span>
              <span>Acciones</span>
            </div>
           {categorias.map(cat => (
              <div 
                key={cat.id} 
                // 1. Agregamos la función al contenedor principal
                onClick={() => abrirEditar(cat)} 
                style={{ 
                  display: 'grid', gridTemplateColumns: '48px 1.5fr 1fr auto', 
                  alignItems: 'center', gap: 16, padding: '16px 20px', 
                  borderBottom: '1px solid #f8fafc',
                  cursor: 'pointer', // Hace que aparezca la manito
                  transition: 'background-color 0.2s', 
                }}
                // 2. Un truco para que la fila cambie de color al pasar el mouse por encima (Hover)
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cat.imagen ? <img src={cat.imagen} alt={cat.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon d={icons.image} size={20} color="#cbd5e1" />}
                </div>
                
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{cat.nombre}</div>
                
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {cat.nombre_padre ? <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 6 }}>Sub de: {cat.nombre_padre}</span> : <strong>Principal</strong>}
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* El botón del lápiz sigue funcionando, pero le frenamos la propagación por las dudas */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); abrirEditar(cat); }} 
                    style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: 'white', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Icon d={icons.edit} size={13} color="#6366f1" />
                  </button>

                  {/* 3. Evitamos que al hacer clic en eliminar, se abra el formulario de edición */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEliminar(cat.id); }} 
                    style={{ padding: '7px 12px', borderRadius: 7, border: '1.5px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Icon d={icons.trash} size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VistaCategorias;