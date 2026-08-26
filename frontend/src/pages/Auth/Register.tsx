import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faEnvelope, faLock, faKey, faSpinner, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';
import SimpleHeader from '../../components/Homepage/simpleheader';
import Footer from '../../components/Homepage/Footer';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.mobile || !form.password || !form.confirmPassword) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const registerPayload = {
        name: form.username,
        email: form.email || null,
        mobile: form.mobile,
        password: form.password,
        password_confirmation: form.confirmPassword,
      };

      await axiosInstance.post('/auth/register', registerPayload);

      // Trigger send-otp for mobile verification
      try {
        await axiosInstance.post('/auth/send-otp', {
          mobile: form.mobile,
          purpose: 'register'
        });
        setOtpSent(true);
        showToast('Registration successful! OTP sent to your mobile.', 'success');
      } catch (otpErr: any) {
        showToast(otpErr.response?.data?.message || 'Account created but failed to send verification OTP.', 'info');
        navigate('/login');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      showToast('Please enter the OTP code', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await axiosInstance.post('/auth/verify-otp', {
        mobile: form.mobile,
        otp: otpCode,
        purpose: 'register'
      });

      const { token, user } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.name);
        localStorage.setItem('user', JSON.stringify({
          userId: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
          token: token
        }));

        showToast('Mobile number verified successfully!', 'success');
        navigate('/customer/dashboard');
      } else {
        showToast('Verification failed. Redirecting to login.', 'info');
        navigate('/login');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-800" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5ff 50%, #f5f0ff 100%)' }}>
      <SimpleHeader />
      <div className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="w-full max-w-md">

          {!otpSent ? (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header stripe */}
              <div className="h-1.5 bg-gradient-to-r from-[#275981] via-blue-500 to-indigo-500" />

              <div className="p-8 space-y-6">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#275981] to-blue-600 shadow-lg mb-3">
                    <FontAwesomeIcon icon={faUser} className="text-white text-xl" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-800">Create Account</h1>
                  <p className="text-sm text-gray-500">Sign up to book rides instantly</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="tel"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        required
                        placeholder="9999999999"
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Used for booking confirmations and driver contact</p>
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Email Address <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                        <input
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          required
                          placeholder="••••••••"
                          className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Confirm <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="••••••••"
                          className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#275981] to-blue-600 hover:from-[#1c4362] hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {loading && <FontAwesomeIcon icon={faSpinner} spin />}
                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  </button>
                </form>

                <div className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />
              <div className="p-8 space-y-6">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-3">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xl" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-800">Verify Mobile</h1>
                  <p className="text-sm text-gray-500">
                    OTP sent to <span className="font-bold text-gray-700">{form.mobile}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      OTP Code
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faKey} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        maxLength={6}
                        placeholder="1 2 3 4 5 6"
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 tracking-[0.5em] text-center font-bold text-lg transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {verifying && <FontAwesomeIcon icon={faSpinner} spin />}
                    <span>{verifying ? 'Verifying...' : 'Verify & Login'}</span>
                  </button>
                </form>

                <div className="text-center text-sm text-gray-500">
                  Wrong number?{' '}
                  <button
                    onClick={() => setOtpSent(false)}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
