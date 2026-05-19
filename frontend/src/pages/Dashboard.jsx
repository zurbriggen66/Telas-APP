import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Icon, icons } from '../components/Icons'; 

const Dashboard = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => { 
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMenuAbierto(false); 
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname.includes(path);

  const getLinkStyle = (path) => ({
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
    padding: '12px 16px', marginBottom: '6px', borderRadius: '8px',
    border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    transition: 'all 0.2s', textAlign: 'left',
    backgroundColor: isActive(path) ? '#1e293b' : 'transparent',
    color: isActive(path) ? '#ffffff' : '#94a3b8',
  });

  return (
    // CAMBIO CLAVE: Si es mobile, usamos flexDirection: 'column' para que el navbar quede arriba del todo
    <div className="dashboard-root" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100vw', marginLeft: 'calc(-50vw + 50%)', margin: 0, padding: 0, top: 0, left: 0, background: '#f8fafc', position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* NUEVO HEADER MÓVIL: Profesional, oscuro, ocupa todo el ancho */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', padding: '0 16px', height: '64px',
          background: '#0f172a', color: 'white', position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)', flexShrink: 0, margin: 0
        }}>
          <button 
            onClick={() => setMenuAbierto(true)}
            style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Icon d={icons.menu} size={24} color="white" strokeWidth="2" />
          </button>
          <span style={{ fontWeight: 800, fontSize: '18px', marginLeft: '12px', letterSpacing: '-0.5px' }}>
            Telas-APP
          </span>
        </header>
      )}

      

      {/* OVERLAY OSCURO */}
      {isMobile && menuAbierto && (
        <div onClick={() => setMenuAbierto(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      {/* PANEL LATERAL (SIDEBAR) */}
      <aside style={{
        width: 260, background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, height: '100vh', zIndex: 50, margin: 0, padding: 0, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isMobile && !menuAbierto ? 'translateX(-100%)' : 'translateX(0)',
      }}>
        {/* EN MOBILE OCULTAMOS ESTE TÍTULO PORQUE YA ESTÁ EN LA BARRA SUPERIOR */}
        {!isMobile && (
          <div style={{ padding: '32px 24px 24px' }}>
             <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Telas-APP</h2>
             <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>Panel de Control</p>
          </div>
        )}

        {isMobile && (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
                 <span style={{ fontSize: '18px', fontWeight: 800 }}>Menú</span>
                 <button onClick={() => setMenuAbierto(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                     <Icon d={icons.x} size={24} color="#94a3b8" />
                 </button>
            </div>
        )}
        
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '0 0 8px 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Inicio</div>
          <button style={getLinkStyle('/dashboard/inicio')} onClick={() => navigate('/dashboard/inicio')}>
            <Icon d={icons.home} size={18} color={isActive('/dashboard/inicio') ? '#6366f1' : '#94a3b8'} /> Inicio
          </button>
          
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: '24px 0 8px 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Gestión</div>
          <button style={getLinkStyle('/dashboard/productos')} onClick={() => navigate('/dashboard/productos')}>
            <Icon d={icons.package} size={18} color={isActive('/dashboard/productos') ? '#6366f1' : '#94a3b8'} /> Productos & Stock
          </button>
          <button style={getLinkStyle('/dashboard/categorias')} onClick={() => navigate('/dashboard/categorias')}>
            <Icon d={icons.category} size={18} color={isActive('/dashboard/categorias') ? '#6366f1' : '#94a3b8'} /> Categorías
          </button>
          <button style={getLinkStyle('/dashboard/estadisticas')} onClick={() => navigate('/dashboard/estadisticas')}>
            <Icon d={icons.stats} size={18} color={isActive('/dashboard/estadisticas') ? '#6366f1' : '#94a3b8'} /> Estadísticas
          </button>
          <button style={getLinkStyle('/dashboard/diseno')} onClick={() => navigate('/dashboard/diseno')}>
            <Icon d={icons.design} size={18} color={isActive('/dashboard/diseno') ? '#6366f1' : '#94a3b8'} /> Diseño & Colores
          </button>
          <button style={getLinkStyle('/dashboard/pedidos')} onClick={() => navigate('/dashboard/pedidos')}>
            <Icon d={icons.orders} size={18} color={isActive('/dashboard/pedidos') ? '#6366f1' : '#94a3b8'} /> Ventas & Pedidos
          </button>
          <button style={getLinkStyle('/dashboard/transferencias')} onClick={() => navigate('/dashboard/transferencias')}>
            <Icon d={icons.orders} size={18} color={isActive('/dashboard/transferencias') ? '#6366f1' : '#94a3b8'} /> Transferencias
          </button>
          
        </nav>
      </aside>

      <main style={{
        // Ahora el padding es normal, el espacio se adapta solo.
        flex: 1, padding: isMobile ? '24px 16px' : '20px 40px',
        maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden', margin: 0
      }}>
        <Outlet /> 
      </main>
    </div>
  );
};

export default Dashboard;