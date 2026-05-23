import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';

const API = 'http://127.0.0.1:8000/api';

// ── COMPONENTE REUTILIZABLE PARA SUBIR IMÁGENES ──
const ImageUploadBox = ({ title, fieldName, fileData, onFileChange, recomendacion }) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 4 }}>
        {title}
      </label>
      {recomendacion && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px 0' }}>{recomendacion}</p>}
      
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); onFileChange(fieldName, e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById(`file-${fieldName}`).click()}
        style={{
          width: '100%', height: 160, borderRadius: 10,
          border: dragging ? '2px dashed #6366f1' : '2px dashed #e2e8f0',
          background: dragging ? '#f0f0ff' : '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {fileData.preview ? (
          <img src={fileData.preview} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <Icon d={icons.upload} size={28} color="#cbd5e1" />
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>Clic o arrastrar</p>
          </div>
        )}
        <input id={`file-${fieldName}`} type="file" accept="image/*" style={{ display: 'none' }} 
               onChange={e => onFileChange(fieldName, e.target.files[0])} />
      </div>
    </div>
  );
};


const VistaDiseno = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [textData, setTextData] = useState({ instagram: '', telefono: '' });
  
  // 👇 NUEVOS ESTADOS PARA LOS COLORES 👇
  const [colores, setColores] = useState([]);
  const [nuevoColor, setNuevoColor] = useState({ nombre: '', codigo_hex: '#6366f1' }); // Color por defecto al abrir
  const [loadingColor, setLoadingColor] = useState(false);

  const [images, setImages] = useState({
    banner_1: { file: null, preview: null },
    banner_2: { file: null, preview: null },
    banner_3: { file: null, preview: null },
    logo: { file: null, preview: null },
    logo_desarrollador: { file: null, preview: null },
    imagen_secundaria_1: { file: null, preview: null },
    imagen_secundaria_2: { file: null, preview: null },
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos actuales (Configuración y Colores)
  useEffect(() => {
    // 1. Cargar Banners y Textos
    axios.get(`${API}/banner/`).then(res => {
      const data = res.data;
      const config = Array.isArray(data) ? data[0] : data;
      if (!config) return;

      setTextData({
        instagram: config.instagram || '',
        telefono: config.telefono || '',
      });

      const loadedImages = { ...images };
      const imgFields = ['banner_1', 'banner_2', 'banner_3', 'logo', 'logo_desarrollador', 'imagen_secundaria_1', 'imagen_secundaria_2'];
      
      imgFields.forEach(field => {
        if (config[field]) {
          loadedImages[field].preview = config[field];
        }
      });
      setImages(loadedImages);
    }).catch(() => {});

    // 2. Cargar Colores Disponibles
    fetchColores();
  }, []);

  // --- FUNCIONES DE COLORES ---
  const fetchColores = async () => {
    try {
      const res = await axios.get(`${API}/colores/`);
      setColores(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      console.error("Error al cargar colores:", error);
    }
  };

  const handleAddColor = async () => {
    if (!nuevoColor.nombre.trim()) {
      alert("El nombre del color es obligatorio.");
      return;
    }
    setLoadingColor(true);
    try {
      await axios.post(`${API}/colores/`, nuevoColor);
      setNuevoColor({ nombre: '', codigo_hex: '#6366f1' }); // Resetear formulario
      fetchColores(); // Recargar la lista
    } catch (error) {
      alert("Hubo un error al agregar el color. Quizás el nombre ya existe.");
    } finally {
      setLoadingColor(false);
    }
  };

  const handleDeleteColor = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este color?")) return;
    try {
      await axios.delete(`${API}/colores/${id}/`);
      setColores(colores.filter(c => c.id !== id));
    } catch (error) {
      alert("No se pudo eliminar el color. Quizás está siendo usado por alguna tela.");
    }
  };

  const handleTextChange = (e) => {
    setTextData({ ...textData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (fieldName, file) => {
    if (!file) return;
    setImages(prev => ({
      ...prev,
      [fieldName]: { file: file, preview: URL.createObjectURL(file) }
    }));
  };

  // Guardado Maestro de Banners
  const handleGuardarTodo = async () => {
    setLoading(true); setStatus(null);
    const formData = new FormData();
    
    formData.append('instagram', textData.instagram);
    formData.append('telefono', textData.telefono);

    Object.keys(images).forEach(key => {
      if (images[key].file) {
        formData.append(key, images[key].file);
      }
    });

    try {
      await axios.post(`${API}/banner/`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setStatus('ok');
      setTimeout(() => setStatus(null), 4000);
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#1e293b', boxSizing: 'border-box', marginBottom: 16 };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Diseño & Colores" subtitle="Personalizá la información y aspecto visual de tu tienda" />
      
      {/* MENSAJE RECORDATORIO */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '6px', display: 'flex', flexShrink: 0 }}>
            <Icon d={icons.edit} size={16} color="white" />
        </div>
        <span style={{ color: '#1e3a8a', fontSize: 14, lineHeight: '1.4' }}>
          <strong>¡Tip!</strong> Recordá hacer clic en <strong>"Guardar configuración"</strong> en la barra inferior cuando termines de subir tus imágenes o modificar tus datos.
        </span>
      </div>

      {/* SECCIÓN NUEVA: GESTIÓN DE COLORES (Arriba para destacar) */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ background: '#f0fdf4', padding: '6px', borderRadius: '8px' }}>
            <Icon d={icons.tag} size={20} color="#16a34a" />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>Paleta de Colores</h3>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px 0' }}>Agregá los colores oficiales que luego podrás asignarle a tus telas en el inventario.</p>

        {/* Formulario rápido de Colores */}
        <div style={{ 
          display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', 
          background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 20
        }}>
           <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre del Color</label>
              <input 
                value={nuevoColor.nombre} 
                onChange={e => setNuevoColor({...nuevoColor, nombre: e.target.value})} 
                placeholder="Ej: Verde Oliva, Azul Marino..." 
                style={{ ...inputStyle, marginBottom: 0 }} 
              />
           </div>
           <div style={{ width: isMobile ? '100%' : '140px' }}>
              <label style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tono (Hex)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...inputStyle, marginBottom: 0, padding: '7px 12px' }}>
                 <input 
                    type="color" 
                    value={nuevoColor.codigo_hex} 
                    onChange={e => setNuevoColor({...nuevoColor, codigo_hex: e.target.value})} 
                    style={{ border: 'none', padding: 0, width: 30, height: 30, cursor: 'pointer', background: 'transparent', borderRadius: '50%' }} 
                  />
                 <span style={{ fontSize: 13, color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>{nuevoColor.codigo_hex}</span>
              </div>
           </div>
           <button 
              onClick={handleAddColor} 
              disabled={loadingColor} 
              style={{ 
                background: '#10b981', color: 'white', border: 'none', borderRadius: 8, 
                padding: '12px 24px', fontWeight: 700, cursor: 'pointer', marginTop: isMobile ? '0' : '23px',
                width: isMobile ? '100%' : 'auto', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}>
              {loadingColor ? 'Guardando...' : 'Agregar Color'}
           </button>
        </div>

        {/* Lista de Colores Creados */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
           {colores.map(c => (
              <div key={c.id} style={{ 
                display: 'flex', alignItems: 'center', gap: 10, background: 'white', 
                border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '30px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                 {/* Circulito de color */}
                 <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: c.codigo_hex, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                 <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{c.nombre}</span>
                 
                 {/* Botón cruz roja */}
                 <button onClick={() => handleDeleteColor(c.id)} title="Eliminar color" style={{ 
                   background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', 
                   alignItems: 'center', justifyContent: 'center', marginLeft: 4, width: 22, height: 22, borderRadius: '50%', padding: 0
                 }}>
                    <Icon d={icons.x} size={12} color="#ef4444" />
                 </button>
              </div>
           ))}
           {colores.length === 0 && <span style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic' }}>Aún no has agregado ningún color a tu paleta.</span>}
        </div>
      </Card>

      {/* GRID EN 2 COLUMNAS (Banners y Redes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* COLUMNA 1: Redes y Logos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon d={icons.edit} size={20} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Información de Contacto</h3>
            </div>
            
            <label style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 6, display: 'block' }}>Usuario de Instagram (sin @)</label>
            <input name="instagram" value={textData.instagram} onChange={handleTextChange} placeholder="ej: telas.app" style={inputStyle} />

            <label style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 6, display: 'block' }}>Teléfono / WhatsApp</label>
            <input name="telefono" value={textData.telefono} onChange={handleTextChange} placeholder="ej: 3512345678" style={inputStyle} />
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon d={icons.image} size={20} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Logotipos</h3>
            </div>
            <ImageUploadBox title="Logo Principal" fieldName="logo" fileData={images.logo} onFileChange={handleImageChange} recomendacion="Se mostrará en el menú principal." />
            <ImageUploadBox title="Logo del Desarrollador" fieldName="logo_desarrollador" fileData={images.logo_desarrollador} onFileChange={handleImageChange} recomendacion="Se mostrará en el pie de página (footer)." />
          </Card>
        </div>

        {/* COLUMNA 2: Banners y Secundarias */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon d={icons.grid} size={20} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Banners (Carrusel Principal)</h3>
            </div>
            <ImageUploadBox title="Banner Principal 1" fieldName="banner_1" fileData={images.banner_1} onFileChange={handleImageChange} />
            <ImageUploadBox title="Banner Principal 2" fieldName="banner_2" fileData={images.banner_2} onFileChange={handleImageChange} />
            <ImageUploadBox title="Banner Principal 3" fieldName="banner_3" fileData={images.banner_3} onFileChange={handleImageChange} />
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon d={icons.grid} size={20} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Imágenes Secundarias</h3>
            </div>
            <ImageUploadBox title="Imagen Secundaria 1" fieldName="imagen_secundaria_1" fileData={images.imagen_secundaria_1} onFileChange={handleImageChange} />
            <ImageUploadBox title="Imagen Secundaria 2" fieldName="imagen_secundaria_2" fileData={images.imagen_secundaria_2} onFileChange={handleImageChange} />
          </Card>
        </div>
      </div>

      {/* BARRA FLOTANTE DE GUARDADO (Responsive) */}
      <div style={{ 
        position: 'fixed', 
        bottom: isMobile ? 16 : 20, 
        right: isMobile ? 16 : 20, 
        left: isMobile ? 16 : 270,
        padding: isMobile ? '12px' : '16px 24px', 
        background: 'white', 
        borderRadius: 12, 
        border: '1px solid #e2e8f0',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isMobile ? 'center' : 'space-between', 
        zIndex: 100,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
      }}>
        
        {!isMobile && (
          <div>
            {status === 'ok' && <span style={{ color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icon d={icons.check} size={18} color="#16a34a" /> Cambios guardados correctamente</span>}
            {status === 'error' && <span style={{ color: '#dc2626', fontWeight: 700 }}>Error al guardar los cambios</span>}
          </div>
        )}
        
        <div style={{ width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {isMobile && status === 'ok' && <span style={{ color: '#15803d', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>¡Cambios guardados!</span>}
          {isMobile && status === 'error' && <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>Error al guardar</span>}

          <button onClick={handleGuardarTodo} disabled={loading} style={{
            width: '100%',
            padding: isMobile ? '14px 20px' : '12px 24px', 
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}>
            <Icon d={icons.upload} size={18} color="white" />
            {loading ? 'Guardando...' : (isMobile ? 'Guardar configuración' : 'Guardar toda la configuración')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VistaDiseno;