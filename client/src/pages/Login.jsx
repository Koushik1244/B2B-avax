import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, walletNonce, walletVerify } from '../services/auth';
import { useAuth } from '../context/AuthContext';


const inputCls = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all";

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleWalletLogin = async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Install the extension to log in with a wallet.');
      return;
    }
    setError(''); setWalletLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      const { data: nonceData } = await walletNonce(address);

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonceData.message, address],
      });

      const { data: authData } = await walletVerify(address, signature);

      login({ token: authData.token, ...authData.user });
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 4001) {
        setError('Wallet connection was rejected.');
      } else {
        setError(err.response?.data?.message || 'Wallet login failed.');
      }
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo-dark.png"
            alt="AutoBiz"
            className="block mb-5 h-20 w-auto mx-auto dark:hidden"
          />
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to Smart Invoicing</p>
        </div>

        {/* Demo hint */}
        <div className="bg-indigo-950/40 border border-indigo-900/40 rounded-xl px-4 py-3 mb-6 text-center">
          <p className="text-xs text-indigo-400">Demo: <span className="font-mono">demo@kirana.com / demo1234</span></p>
        </div>

        <div className="bg-[#161616] border border-[#232323] rounded-2xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Enter password" className={inputCls} />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-indigo-500/20 transition-all mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#232323]" />
            <span className="text-xs text-gray-600">or</span>
            <div className="h-px flex-1 bg-[#232323]" />
          </div>

          <button
            type="button"
            onClick={handleWalletLogin}
            disabled={walletLoading}
            className="w-full border border-[#2a2a2a] hover:border-indigo-500/50 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {walletLoading ? 'Connecting…' : '🦊 Sign in with Wallet'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-5">
            No account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
