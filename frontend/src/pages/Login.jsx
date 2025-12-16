import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isLogin) {
            await login(email, password);
            addToast("¡Bienvenido de vuelta!", "success");
            navigate('/dashboard');
        } else {
            if (password !== confirmPassword) {
                addToast("Las contraseñas no coinciden", "error");
                setLoading(false);
                return;
            }
            await register(email, password, name);
            addToast("Cuenta creada exitosamente", "success");
            navigate('/dashboard');
        }
    } catch (err) {
        console.error("Login Error:", err);
        let msg = 'Error al iniciar sesión.';
        if(err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'Credenciales inválidas.';
        if(err.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado.';
        if(err.code === 'auth/weak-password') msg = 'La contraseña es muy débil (min 6 caracteres).';
        
        addToast(msg, "error");
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      try {
          await loginWithGoogle();
          addToast("¡Inicio de sesión con Google exitoso!", "success");
          navigate('/dashboard');
      } catch (err) {
          console.error("Google Auth Error:", err);
          // Detailed Error for User Diagnosis
          let errorMsg = "Error con Google Login.";
          if (err.code === 'auth/popup-closed-by-user') errorMsg = "La ventana de inicio de sesión fue cerrada.";
          if (err.code === 'auth/cancelled-popup-request') errorMsg = "Solicitud cancelada.";
          if (err.code === 'auth/popup-blocked') errorMsg = "El navegador bloqueó la ventana emergente.";
          if (err.code === 'auth/operation-not-allowed') errorMsg = "Google Auth no está habilitado en Firebase Console.";
          if (err.code === 'auth/unauthorized-domain') errorMsg = "Dominio no autorizado (verifica localhost en Firebase).";

          addToast(`${errorMsg} (${err.code})`, "error");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden p-4 text-brand-text-primary">
      {/* Video Background */}
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-40">
        <source src="/vid/login.mp4" type="video/mp4" />
      </video>
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-black/20 via-brand-dark/60 to-brand-dark/90 z-1"></div>

      <div className="w-full max-w-sm z-10 animate-fade-in relative">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-linear-to-r from-brand-turquoise to-brand-purple rounded-full blur opacity-40 animate-pulse"></div>
            <img src="/img/logo.png" alt="Groddy's Lab" className="relative w-20 h-20 drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mt-4 tracking-tight">Groddy's Lab</h1>
          <p className="text-brand-text-secondary text-lg font-light">Process Academy + Workspace</p>
        </div>

        <div className="glass-card p-8 rounded-2xl shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-8 border-b border-white/10 relative">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Iniciar Sesión
              {isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-turquoise shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${!isLogin ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Registrarse
              {!isLogin && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-turquoise shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
                <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Nombre Completo</label>
                    <input type="text" required className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-turquoise/50 focus:ring-1 focus:ring-brand-turquoise/50 transition-all text-sm text-white placeholder-gray-600" placeholder="Ej: Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Correo Electrónico</label>
              <input type="email" required className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-turquoise/50 focus:ring-1 focus:ring-brand-turquoise/50 transition-all text-sm text-white placeholder-gray-600" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Contraseña</label>
              <input type="password" required className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-turquoise/50 focus:ring-1 focus:ring-brand-turquoise/50 transition-all text-sm text-white placeholder-gray-600" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-brand-text-secondary uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                  <input type="password" required className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-turquoise/50 focus:ring-1 focus:ring-brand-turquoise/50 transition-all text-sm text-white placeholder-gray-600" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-linear-to-r from-brand-turquoise to-brand-purple text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-brand-turquoise/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4">
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? 'Procesando...' : isLogin ? 'Ingresar al Portal' : 'Crear Cuenta Gratis'}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative bg-[#1a1a1a] px-3 text-xs text-brand-text-secondary uppercase">o continúa con</div>
          </div>

          <button onClick={handleGoogleLogin} disabled={loading} type="button" className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 shadow-lg">
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.591,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <button onClick={() => window.location.href = 'https://www.growthbuddies.cl/'} className="mt-8 mx-auto text-center text-sm text-brand-text-secondary/60 hover:text-brand-turquoise transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={14} />
            <span>Volver a Growth Buddies</span>
        </button>
      </div>
    </div>
  );
}
