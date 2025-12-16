import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isLogin) {
            await login(formData.email, formData.password);
            addToast("¡Bienvenido de vuelta!", "success");
            navigate('/dashboard');
        } else {
            if (formData.password !== formData.confirmPassword) {
                addToast("Las contraseñas no coinciden", "error");
                setLoading(false);
                return;
            }
            await register(formData.email, formData.password, formData.name);
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

  const handlePasswordReset = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Using resetPassword from AuthContext (need to update destructuring below)
          await resetPassword(formData.email);
          addToast("Correo de recuperación enviado", "success");
          setIsLogin(true); // Switch back to login
      } catch (err) {
          console.error("Reset Password Error:", err);
          let msg = "Error al enviar correo.";
          if (err.code === 'auth/user-not-found') msg = "No existe cuenta con este correo.";
          addToast(msg, "error");
      } finally {
          setLoading(false);
      }
  };

  const toggleMode = () => {
      setIsLogin(prev => !prev);
      setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: ''
      });
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-turquoise/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Centered Content Wrapper */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="glass-card w-full max-w-md p-8 md:p-10 rounded-2xl shadow-2xl border-white/10 flex flex-col items-center">
        
        <div className="mb-8 text-center animate-fade-in">
           <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-white/20 backdrop-blur-md">
             <img src="/img/logo.png" alt="Groddy's Lab" className="w-10 h-10 object-contain" />
           </div>
           <h1 className="text-3xl font-bold text-white mb-2">Groddy's Lab</h1>
           <p className="text-brand-text-secondary">Portal de Clientes</p>
        </div>

        {/* Form Container */}
        <div className="w-full space-y-6 animate-slide-in">
            
            {/* Password Recovery Mode Check */}
            {isLogin === 'recovery' ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="text-center mb-2">
                        <h3 className="text-white font-bold text-lg">Recuperar Contraseña</h3>
                        <p className="text-sm text-brand-text-secondary">Ingresa tu correo y te enviaremos un enlace.</p>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Email</label>
                        <input 
                            type="email" 
                            placeholder="ejemplo@empresa.com" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-turquoise text-brand-dark font-bold py-3.5 rounded-lg hover:shadow-lg hover:shadow-brand-turquoise/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        Enviar Enlace
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="w-full text-brand-text-secondary text-sm hover:text-white transition mt-2"
                    >
                        Volver al Inicio de Sesión
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isLogin === false && ( // Only show name field for registration
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Nombre Completo</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Juan Pérez" 
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Email</label>
                        <input 
                            type="email" 
                            placeholder="ejemplo@empresa.com" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Contraseña</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                    
                    {isLogin === true && (
                        <div className="text-right -mt-2">
                             <button 
                                 type="button"
                                 onClick={() => setIsLogin('recovery')}
                                 className="text-xs text-brand-turquoise hover:text-white transition-colors"
                             >
                                 ¿Olvidaste tu contraseña?
                             </button>
                         </div>
                    )}
                    {isLogin === false && ( // Only show confirm password for registration
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-turquoise focus:ring-1 focus:ring-brand-turquoise transition-all"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                required
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-turquoise text-brand-dark font-bold py-3.5 rounded-lg hover:shadow-lg hover:shadow-brand-turquoise/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Ingresar' : 'Registrarse')}
                    </button>
                </form>
            )}

            {/* Google Login Divider (Only show if not recovery) */}
            {isLogin !== 'recovery' && (
                <>
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-brand-card px-2 text-gray-400">O continúa con</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                    
                    {/* Toggle Login/Register */}
                    <div className="text-center pt-2">
                        <button 
                            onClick={toggleMode}
                            className="text-brand-text-secondary text-sm hover:text-white transition"
                        >
                            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>
      
      {/* Back Button */}
      <button onClick={() => window.location.href = 'https://www.growthbuddies.cl/'} className="mt-6 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={14} />
            <span>Volver a Growth Buddies</span>
        </button>
      </div>
    </div>
  );
}
