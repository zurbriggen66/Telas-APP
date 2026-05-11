import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos el Layout (el esqueleto)
import Dashboard from './pages/Dashboard';

// Importamos las páginas fragmentadas
import VistaInicio from './pages/dashboard/VistaInicio';
import VistaProductos from './pages/dashboard/VistaProductos';
import VistaCategorias from './pages/dashboard/VistaCategorias';
import VistaDiseno from './pages/dashboard/VistaDiseno';
import VistaStats from './pages/dashboard/VistaStats';
import VistaPedidos from './pages/dashboard/VistaPedidos';
import Home from './pages/Home/Home.jsx';
import Carrito from './pages/Carrito/Carrito.jsx';
import DetalleProducto from './pages/Detalle producto/Detalle_producto.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        
        {/* Ruta Padre: Dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          {/* Si entran a /dashboard los mandamos a /dashboard/inicio */}
          <Route index element={<Navigate to="inicio" replace />} />
          
          {/* ¡Acá está la corrección! Ahora sí existe la ruta "inicio" */}
          <Route path="inicio" element={<VistaInicio />} />
          <Route path="productos" element={<VistaProductos />} />
          <Route path="categorias" element={<VistaCategorias />} />
          <Route path="diseno" element={<VistaDiseno />} />
          <Route path="stats" element={<VistaStats />} />
          <Route path="pedidos" element={<VistaPedidos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;