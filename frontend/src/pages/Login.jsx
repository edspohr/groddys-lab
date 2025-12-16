import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        if (isLogin) {
            await login(email, password);
            navigate('/');
        } else {
            if (password !== confirmPassword) {
                return setError("Passwords do not match");
            }
            await register(email, password, name);
            setMessage("Account created! Logging in...");
            navigate('/');
        }
    } catch (err) {
        console.error(err);
        switch(err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                setError('Invalid email or password.');
                break;
            case 'auth/email-already-in-use':
                setError('Email already in use.');
                break;
            case 'auth/weak-password':
                setError('Password should be at least 6 characters.');
                break;
            default:
                setError('Failed to ' + (isLogin ? 'log in' : 'register') + '.');
        }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
      try {
          setError('');
          setLoading(true);
          await loginWithGoogle();
          navigate('/');
      } catch (err) {
          setError('Failed to login with Google.');
          console.error(err);
      }
      setLoading(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden p-4 text-brand-text-primary">
      {/* Video Background */}
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src="/vid/login.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-1"></div>

      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8">
          <img src="/img/logo.png" alt="Groddy's Lab" className="w-16 h-16" />
          <h1 className="text-3xl font-bold text-white mt-4">Groddy's Lab</h1>
          <p className="text-brand-text-secondary">Process Academy + Workspace</p>
        </div>

        <div className="bg-brand-card/80 backdrop-blur-sm p-8 rounded-lg border border-brand-border">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-brand-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${isLogin ? 'text-white border-b-2 border-brand-turquoise' : 'text-brand-text-secondary border-b-2 border-transparent'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${!isLogin ? 'text-white border-b-2 border-brand-turquoise' : 'text-brand-text-secondary border-b-2 border-transparent'}`}
            >
              Registrarse
            </button>
          </div>

          {error && <div className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
          {message && <div className="bg-green-900/50 text-green-300 text-sm p-3 rounded-lg mb-4 text-center">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nombre Completo</label>
                    <input type="text" required className="w-full bg-gray-800 border border-brand-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-turquoise transition text-sm text-white" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            )}
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Correo Electrónico</label>
              <input type="email" required className="w-full bg-gray-800 border border-brand-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-turquoise transition text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Contraseña</label>
              <input type="password" required className="w-full bg-gray-800 border border-brand-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-turquoise transition text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-1">Confirmar Contraseña</label>
                  <input type="password" required className="w-full bg-gray-800 border border-brand-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-turquoise transition text-sm text-white" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-brand-turquoise text-black font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Crear Cuenta Gratis'}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border"></div>
            </div>
            <div className="relative bg-brand-card px-2 text-sm text-brand-text-secondary">o continúa con</div>
          </div>

          <button onClick={handleGoogleLogin} type="button" className="w-full bg-transparent border border-brand-border hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.591,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            <span>Google</span>
          </button>
        </div>

        <button onClick={() => window.location.href = 'https://www.growthbuddies.cl/'} className="mt-8 mx-auto text-center text-sm text-brand-text-secondary hover:text-white transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            <span>Volver a Growth Buddies</span>
        </button>
      </div>
    </div>
  );
}
