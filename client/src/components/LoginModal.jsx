import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export default function LoginModal({
  isOpen,
  members = [],
  onLoginSuccess,
  theme = 'dark'
}) {
  const [selectedRole, setSelectedRole] = useState('Head'); // 'Head' or 'Coordinator'
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';

  // Filter members by role
  const headMembers = members.filter(m => m.role === 'Head');
  const coordMembers = members.filter(m => m.role === 'Coordinator');

  const currentList = selectedRole === 'Head' ? headMembers : coordMembers;

  // Auto-select first member in list if not selected
  React.useEffect(() => {
    if (currentList.length > 0 && !currentList.some(m => m.id === selectedMemberId)) {
      setSelectedMemberId(currentList[0].id);
    }
  }, [selectedRole, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const targetMember = currentList.find(m => m.id === selectedMemberId);
    if (!targetMember) {
      setErrorMsg(`Please select a ${selectedRole} profile.`);
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your passcode.');
      return;
    }

    setIsLoading(true);

    try {
      const getApiUrl = (endpoint) => {
        const isCloudDeployment = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        return isCloudDeployment ? endpoint : `http://localhost:5000${endpoint}`;
      };

      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          memberId: targetMember.id,
          name: targetMember.name,
          password: password.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Successful login
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify passcode.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all my-8 ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        
        {/* Top Header & Branding */}
        <div className={`px-6 pt-6 pb-4 border-b text-center relative ${
          isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex justify-center mb-3">
            <img 
              src="/logo.png" 
              alt="VCLICK Logo" 
              className="h-12 w-auto object-contain rounded-lg"
            />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">
            VCLICK Management Portal
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Multimedia Production Club • Synchronized Access
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Role Toggle Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Select Your Access Level
            </label>
            <div className={`grid grid-cols-2 p-1 rounded-2xl border ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Head');
                  setErrorMsg('');
                  setPassword('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  selectedRole === 'Head'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>Operating Head</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Coordinator');
                  setErrorMsg('');
                  setPassword('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  selectedRole === 'Coordinator'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Coordinator</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1.5 px-1">
              {selectedRole === 'Head' ? (
                <span>👑 <strong>Full Admin:</strong> Events, Matrix, Team Roster, Grading & System Tools.</span>
              ) : (
                <span>🎯 <strong>Coord Access:</strong> Review Volunteers' photos/videos & give 5-star event grades.</span>
              )}
            </p>
          </div>

          {/* Name / Profile Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Choose Your Name ({selectedRole})
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition focus:outline-none focus:border-red-500 ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                  : 'bg-white border-zinc-300 text-zinc-800'
              }`}
            >
              {currentList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.campus} ({m.work})
                </option>
              ))}
            </select>
          </div>

          {/* Passcode Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Security Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={`Enter ${selectedRole} passcode...`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-mono border transition focus:outline-none focus:border-red-500 ${
                  isDark 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600' 
                    : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400'
                }`}
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Passcode Hint Pill */}
          <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed ${
            isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}>
            <span className="font-bold text-red-500">Default Access Passcodes:</span>
            <div className="mt-1 flex flex-col gap-0.5 font-mono text-[10px]">
              <div>👑 Head Passcode: <strong className="text-zinc-200">head2026</strong></div>
              <div>🎯 Coordinator Passcode: <strong className="text-zinc-200">coord2026</strong></div>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to VCLICK</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
