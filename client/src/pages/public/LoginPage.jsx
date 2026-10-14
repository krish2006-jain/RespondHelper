import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { DEMO_ACCOUNTS } from '../../utils/constants';
import { getRoleDashboardPath } from '../../routes/RoleRoute';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectPath = new URLSearchParams(location.search).get('redirect');
  const fromPath = location.state?.from?.pathname;

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
        navigate(fromPath, { replace: true });
      } else {
        navigate(getRoleDashboardPath(user.role), { replace: true });
      }
    }
  }, [user, navigate, fromPath]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login({ email, password });
      if (redirectPath === 'sos') {
        navigate('/survivor/request/new', { replace: true });
      } else if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
        navigate(fromPath, { replace: true });
      } else {
        // Navigate to role-specific dashboard
        const rolePath = getRoleDashboardPath(loggedUser.role);
        navigate(rolePath, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
        {/* Left Form Panel */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-modal space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-text tracking-tight">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Sign in to access your response dashboard or track active emergencies.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-danger-light border border-danger/30 text-danger text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm bg-slate-50/50"
                />
              </div>

            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-bold mt-2"
              isLoading={loading}
            >
              Sign In to Relief Network
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Join the Network
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="bg-primary-subtle/50 p-6 rounded-2xl border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Instant 1-Click Demo Accounts</span>
            </div>
            <p className="text-xs text-text-muted">
              Select a role to fill its demo email and password, then press Sign In.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleDemoLogin(demo.email, demo.pass)}
                  className="flex flex-col text-left p-3 rounded-xl bg-white border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-text group-hover:text-primary">{demo.badge}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      1-Click
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted mt-0.5 truncate">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
