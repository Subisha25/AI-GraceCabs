import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faPhone, faKey, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/AlertBox';
import SimpleHeader from '../../components/Homepage/simpleheader';
import Footer from '../../components/Homepage/Footer';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  // Password auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP auth state
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.name);
        localStorage.setItem('companyId', user.organization_id || '');

        const userObject = {
          userId: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
          companyId: user.organization_id || '',
          token: token
        };
        localStorage.setItem('user', JSON.stringify(userObject));

        login();
        showToast('Welcome back, ' + user.name + '!', 'success');
        
        // Scoped redirects
        if (user.role === 'customer') {
          navigate('/customer/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        showToast('Login failed. Please try again.', 'error');
      }
    } catch (err: any) {
      if (!err.response) {
        showToast("Unable to connect to the server. Please make sure the application server is running.", "error");
      } else {
        showToast(err.response.data?.message || 'Invalid credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) {
      showToast('Please enter your mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/send-otp', { mobile, purpose: 'login' });
      setOtpSent(true);
      showToast('Verification OTP code sent to ' + mobile, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Mobile number not registered.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      showToast('Please enter the OTP code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/verify-otp', { mobile, otp: otpCode, purpose: 'login' });
      const { token, user } = res.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role || 'customer');
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.name);
        localStorage.setItem('companyId', user.organization_id || '');

        const userObject = {
          userId: user.id,
          username: user.name,
          email: user.email || '',
          role: user.role || 'customer',
          companyId: user.organization_id || '',
          token: token
        };
        localStorage.setItem('user', JSON.stringify(userObject));

        login();
        showToast('Login successful!', 'success');
        
        if (user.role === 'customer') {
          navigate('/customer/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        showToast('Login failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <SimpleHeader />
      <div className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-[#275981]">Customer Login</h1>
            <p className="text-sm text-gray-500">Sign in to book and manage your rides</p>
          </div>

          {/* Toggle Login Method */}
          <div className="flex justify-center gap-4 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setLoginMethod('password'); setOtpSent(false); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'password' ? 'bg-[#275981] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Password Login
            </button>
            <button
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'otp' ? 'bg-[#275981] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Mobile OTP Login
            </button>
          </div>

          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="john@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#275981] hover:bg-[#1c4362] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                {loading && <FontAwesomeIcon icon={faSpinner} spin />}
                <span>Login</span>
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              {!otpSent ? (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mobile Number</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                    <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required
                      placeholder="9999999999"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">OTP Code</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faKey} className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                    <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required
                      maxLength={6} placeholder="123456"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 tracking-widest text-center font-bold text-lg" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#275981] hover:bg-[#1c4362] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                {loading && <FontAwesomeIcon icon={faSpinner} spin />}
                <span>{otpSent ? 'Verify OTP & Login' : 'Send Verification OTP'}</span>
              </button>

              {otpSent && (
                <div className="text-center text-xs">
                  <button type="button" onClick={() => setOtpSent(false)} className="text-blue-600 hover:underline">
                    Change Mobile Number
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="text-center text-sm text-gray-500 border-t border-gray-100 pt-4">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline font-semibold">
              Register
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
