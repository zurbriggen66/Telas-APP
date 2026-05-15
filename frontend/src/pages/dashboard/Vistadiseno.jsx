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
  // Estado para detectar si es versión móvil (celular)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [textData, setTextData] = useState({ instagram: '', telefono: '' });
  
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

  // Escuchar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos actuales desde el backend
  useEffect(() => {
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
  }, []);

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

  // Guardado Maestro
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
    <div style={{ paddingBottom: '90px' }}> {/* Margen inferior ampliado para que no tape contenido el botón flotante */}
      <Header title="Diseño & Configuración" subtitle="Personalizá la información y aspecto visual de tu tienda" />
      
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

      {/* GRID EN 2 COLUMNAS */}
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
        left: isMobile ? 16 : 270, // 270px asume el ancho de tu Sidebar en escritorio
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
        
        {/* En escritorio mostramos el estado a la izquierda */}
        {!isMobile && (
          <div>
            {status === 'ok' && <span style={{ color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icon d={icons.check} size={18} color="#16a34a" /> Cambios guardados correctamente</span>}
            {status === 'error' && <span style={{ color: '#dc2626', fontWeight: 700 }}>Error al guardar los cambios</span>}
          </div>
        )}
        
        {/* Contenedor del botón (y mensajes de estado en mobile) */}
        <div style={{ width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* En mobile mostramos el estado centrado arriba del botón */}
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