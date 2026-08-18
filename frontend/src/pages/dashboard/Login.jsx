import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../../api/auth';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    if (isAuthenticated()) {
        navigate('/dashboard/inicio', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            await login(username, password);
            navigate('/dashboard/inicio', { replace: true });
        } catch {
            setError('Usuario o contraseña incorrectos.');
        } finally {
            setCargando(false);
        }
    };

    const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1e293b', background: 'white', boxSizing: 'border-box' };
    const labelStyle = { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: "'DM Sans', sans-serif" }}>
            <form onSubmit={handleSubmit} style={{ width: 340, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Telas-APP</h1>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>Ingresá para acceder al panel de control</p>

                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Usuario</label>
                    <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Contraseña</label>
                    <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: '0 0 16px' }}>{error}</p>}

                <button type="submit" disabled={cargando} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: cargando ? '#c7d2fe' : '#6366f1', color: 'white', fontWeight: 700 }}>
                    {cargando ? 'Ingresando...' : 'Ingresar'}
                </button>
            </form>
        </div>
    );
};

export default Login;
