'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTraderAuth } from '../../contexts/TraderAuthContext';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Hash, Check, X, Loader2 } from 'lucide-react';
import AvatarSelect, { AVATARS } from '../../components/AvatarSelect';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface FieldStatusProps {
  isLoading?: boolean;
  isValid?: boolean;
  error?: string;
}

function FieldStatus({ isLoading, isValid, error }: FieldStatusProps) {
  if (isLoading) return <Loader2 size={16} className="animate-spin text-slate-400" />;
  if (error) return <X size={16} className="text-red-500" />;
  if (isValid) return <Check size={16} className="text-green-500" />;
  return null;
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setTrader } = useTraderAuth();
  const register = useMutation(api.traders.register);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATARS[0].url);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debounced values for API checks
  const debouncedName = useDebounce(name.trim(), 500);
  const debouncedFriendCode = useDebounce(friendCode.trim(), 500);
  const debouncedEmail = useDebounce(email.trim(), 500);

  // Check unique name
  const nameExists = useQuery(
    api.traders.checkNameExists,
    debouncedName.length >= 2 ? { name: debouncedName } : 'skip'
  );

  // Check unique friend code
  const friendCodeExists = useQuery(
    api.traders.checkFriendCodeExists,
    debouncedFriendCode.length >= 10 ? { friendCode: debouncedFriendCode } : 'skip'
  );

  // Check unique email
  const emailExists = useQuery(
    api.traders.getByEmail,
    debouncedEmail.includes('@') ? { email: debouncedEmail } : 'skip'
  );

  // Validation states
  const nameValidation = useMemo(() => {
    if (!name.trim()) return { error: undefined, isValid: false };
    if (name.trim().length < 2) return { error: 'Tên phải có ít nhất 2 ký tự', isValid: false };
    if (name.trim().length > 30) return { error: 'Tên không quá 30 ký tự', isValid: false };
    if (debouncedName !== name.trim()) return { error: undefined, isValid: false, isLoading: true };
    if (nameExists === undefined) return { error: undefined, isValid: false, isLoading: true };
    if (nameExists) return { error: 'Tên này đã được sử dụng', isValid: false };
    return { error: undefined, isValid: true };
  }, [name, debouncedName, nameExists]);

  const friendCodeValidation = useMemo(() => {
    if (!friendCode.trim()) return { error: 'Vui lòng nhập Friend Code', isValid: false };
    const cleaned = friendCode.replace(/[^0-9]/g, '');
    if (cleaned.length < 16) return { error: 'Friend Code phải có 16 số (VD: 1234-5678-9012-3456)', isValid: false };
    if (cleaned.length > 16) return { error: 'Friend Code chỉ có 16 số', isValid: false };
    if (debouncedFriendCode !== friendCode.trim()) return { error: undefined, isValid: false, isLoading: true };
    if (friendCodeExists === undefined) return { error: undefined, isValid: false, isLoading: true };
    if (friendCodeExists) return { error: 'Friend Code này đã được sử dụng', isValid: false };
    return { error: undefined, isValid: true };
  }, [friendCode, debouncedFriendCode, friendCodeExists]);

  const emailValidation = useMemo(() => {
    if (!email.trim()) return { error: undefined, isValid: false };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return { error: 'Email không hợp lệ', isValid: false };
    if (debouncedEmail !== email.trim()) return { error: undefined, isValid: false, isLoading: true };
    if (emailExists === undefined) return { error: undefined, isValid: false, isLoading: true };
    if (emailExists) return { error: 'Email này đã được sử dụng', isValid: false };
    return { error: undefined, isValid: true };
  }, [email, debouncedEmail, emailExists]);

  const passwordValidation = useMemo(() => {
    if (!password) return { error: undefined, isValid: false, rules: [] };
    const rules = [
      { label: 'Ít nhất 6 ký tự', valid: password.length >= 6 },
      { label: 'Có chữ hoa (A-Z)', valid: /[A-Z]/.test(password) },
      { label: 'Có chữ thường (a-z)', valid: /[a-z]/.test(password) },
      { label: 'Có số (0-9)', valid: /[0-9]/.test(password) },
    ];
    const allValid = rules.every(r => r.valid);
    return { error: undefined, isValid: allValid, rules };
  }, [password]);

  const confirmPasswordValidation = useMemo(() => {
    if (!confirmPassword) return { error: undefined, isValid: false };
    if (confirmPassword !== password) return { error: 'Mật khẩu xác nhận không khớp', isValid: false };
    return { error: undefined, isValid: true };
  }, [confirmPassword, password]);

  const canSubmit = 
    nameValidation.isValid && 
    friendCodeValidation.isValid && 
    emailValidation.isValid && 
    passwordValidation.isValid && 
    confirmPasswordValidation.isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setIsLoading(true);

    try {
      const trader = await register({ 
        name: name.trim(), 
        email: email.trim(), 
        password, 
        avatarUrl,
        friendCode: friendCode.trim(),
      });
      setTrader(trader);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Đăng ký</h1>
            <p className="text-slate-500 mt-2">Tham gia cộng đồng Pocket Trade</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chọn Avatar
              </label>
              <AvatarSelect value={avatarUrl} onChange={setAvatarUrl} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none ${
                    nameValidation.error ? 'border-red-300' : nameValidation.isValid ? 'border-green-300' : 'border-slate-200'
                  }`}
                  placeholder="Trainer Name"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldStatus isLoading={nameValidation.isLoading} isValid={nameValidation.isValid} error={nameValidation.error} />
                </div>
              </div>
              <FieldError error={nameValidation.error} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Friend Code (Mã kết bạn) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none ${
                    friendCodeValidation.error ? 'border-red-300' : friendCodeValidation.isValid && friendCode ? 'border-green-300' : 'border-slate-200'
                  }`}
                  placeholder="1234-5678-9012-3456"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {friendCode && <FieldStatus isLoading={friendCodeValidation.isLoading} isValid={friendCodeValidation.isValid} error={friendCodeValidation.error} />}
                </div>
              </div>
              <FieldError error={friendCodeValidation.error} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none ${
                    emailValidation.error ? 'border-red-300' : emailValidation.isValid ? 'border-green-300' : 'border-slate-200'
                  }`}
                  placeholder="your@email.com"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldStatus isLoading={emailValidation.isLoading} isValid={emailValidation.isValid} error={emailValidation.error} />
                </div>
              </div>
              <FieldError error={emailValidation.error} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none ${
                    password && !passwordValidation.isValid ? 'border-red-300' : passwordValidation.isValid ? 'border-green-300' : 'border-slate-200'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password && passwordValidation.rules && (
                <div className="mt-2 space-y-1">
                  {passwordValidation.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {rule.valid ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <X size={12} className="text-red-400" />
                      )}
                      <span className={rule.valid ? 'text-green-600' : 'text-slate-500'}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none ${
                    confirmPasswordValidation.error ? 'border-red-300' : confirmPasswordValidation.isValid ? 'border-green-300' : 'border-slate-200'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldStatus isValid={confirmPasswordValidation.isValid} error={confirmPasswordValidation.error} />
                </div>
              </div>
              <FieldError error={confirmPasswordValidation.error} />
            </div>

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={20} className="animate-spin" />}
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center mt-6 text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-slate-900 font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
