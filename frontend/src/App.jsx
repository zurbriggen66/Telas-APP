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

// Importamos las páginas públicas
import Home from './pages/Home/Home.jsx';
import Carrito from './pages/Carrito/Carrito.jsx';
import DetalleProducto from './pages/Detalle producto/Detalle_producto.jsx';
import CheckoutSelection from './pages/Checkoutselection/CheckoutSelection.jsx';
import Success from './pages/Success/Success.jsx'; // <-- IMPORTAMOS LA NUEVA PÁGINA
import Productos from './pages/Products/Products.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === RUTAS PÚBLICAS === */}
        <Route path="/" element={<Home />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/productos" element={<Productos />} />
        
        {/* RUTAS DE PAGO */}
        <Route path="/checkout" element={<CheckoutSelection />} />
        <Route path="/success" element={<Success />} /> 

        {/* === RUTA PADRE: DASHBOARD === */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<VistaInicio />} />
          <Route path="productos" element={<VistaProductos />} />
          <Route path="categorias" element={<VistaCategorias />} />
          <Route path="diseno" element={<VistaDiseno />} />
          <Route path="estadisticas" element={<VistaStats />} />
          <Route path="pedidos" element={<VistaPedidos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;