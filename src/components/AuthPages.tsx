import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clapperboard, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Play, Sun, Moon, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext.js';
import { Theme } from '../theme.js';

/* Spinner moderne AI — même langage que VideoOutput (conic + halo) */
function AiSpinner({ size = 16 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full conic-spin"
        style={{ background: 'conic-gradient(from 0deg, rgba(230,0,35,0) 0%, #e60023 30%, rgba(230,0,35,0) 55%)' }}
      />
      <span className="absolute inset-[2px] rounded-full bg-zinc-950 dark:bg-zinc-900" />
      <span className="relative w-[60%] h-[60%] rounded-full bg-primary animate-pulse" />
    </span>
  );
}

function VideoBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-950">
      {/* Fallback gradient + animated blobs — always visible if video fails */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute -top-32 -left-32 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-40 -right-40 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-violet-600/15 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[50vh] rounded-[100%] bg-emerald-500/[0.06] blur-[80px]" />
      {/* Video — overlay Netflix : noir partout, moderne */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://images.unsplash.com/photo-1451187580459-43490279c429?w=1200&q=80&auto=format&fit=crop"
        src="https://videos.pexels.com/video-files/18069234/18069234-uhd_1440_1440_24fps.mp4"
        onError={(e) => {
          (e.currentTarget as HTMLVideoElement).style.display = 'none';
        }}
        className="absolute inset-0 h-full w-full object-cover opacity-[0.80] brightness-[0.98] contrast-[1.08] saturate-[1.02]"
      />
      {/* Netflix overlay — noir moderne sur toute la surface */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-black/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.72)_92%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,0,35,0.06),transparent_72%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_220px_rgba(0,0,0,0.88)] pointer-events-none" />
    </div>
  );
}

/* The studio header carries the theme switch, but the auth screen renders before
   any app chrome exists — so it gets its own, in the same language. */
function AuthThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/55 text-on-dark shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:border-primary/60 hover:bg-primary/20 cursor-pointer"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.98 6.98 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  showToggle,
  onToggle,
  error,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  autoComplete?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">
        {label}
      </label>
      <div
        aria-invalid={hasError}
        className={`group relative flex items-center gap-3 rounded-lg border bg-zinc-800 px-4 py-3 transition-colors duration-200 ${
          hasError
            ? 'border-[#ff4d4f] hover:border-[#ff4d4f] focus-within:border-[#ff4d4f] bg-red-500/[0.04]'
            : focused
              ? 'border-primary'
              : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <span className={`shrink-0 transition-colors ${hasError ? 'text-[#ff4d4f]' : focused ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none focus-visible:outline-none"
        />
        {showToggle && (
          <button type="button" onClick={onToggle} className="shrink-0 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer">
            {type === 'password' ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-1.5 text-[12px] leading-none text-[#ff4d4f]"
          >
            <AlertCircle size={12} className="shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LoginPage({ onSwitch, theme, onToggleTheme }: { onSwitch: () => void; theme: Theme; onToggleTheme: () => void }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [shakeKey, setShakeKey] = useState(0);
  const hasError = Object.values(fieldErrors).some(Boolean);

  const triggerShake = () => setShakeKey((k) => k + 1);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = 'Veuillez renseigner votre email.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Veuillez saisir une adresse email valide.';
    if (!password) errs.password = 'Veuillez renseigner votre mot de passe.';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      triggerShake();
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err.message || 'Connexion échouée';
      if (/email/i.test(msg)) setFieldErrors({ email: msg });
      else if (/password|mot de passe/i.test(msg)) setFieldErrors({ password: msg });
      else setFieldErrors({ general: msg });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setFieldErrors({});
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setFieldErrors({ general: err.message || 'Connexion avec Google échouée' });
      triggerShake();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-zinc-950 overflow-hidden">
      <VideoBackdrop />
      <AuthThemeToggle theme={theme} onToggle={onToggleTheme} />
      <motion.div
        key={shakeKey}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={hasError ? { x: [0, -6, 6, -4, 4, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1, x: 0 }}
        transition={hasError ? { duration: 0.4, ease: 'easeInOut' } : { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className={`relative w-full max-w-[480px] rounded-lg border bg-zinc-950 dark:bg-zinc-900 backdrop-blur-xl shadow-2xl overflow-hidden ${hasError ? 'border-transparent shadow-[0_0_28px_rgba(244,63,94,0.28)]' : 'border-zinc-800 shadow-black/15 dark:shadow-black/50'}`}
      >
        {/* Border plein solid + snack animé — une seule bordure */}
        {hasError && <div className="auth-error-snake" aria-hidden />}
        {!hasError && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />}
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shadow-sm">
              <Clapperboard className="w-5 h-5 text-primary" />
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white">Omni Product Studio</h1>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Cinematic AI suite
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-white">Connexion</h2>
            <p className="mt-1 text-xs text-zinc-400">Accédez à vos rendus et transitions — depuis votre Media Library.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field
              id="login-email"
              label="Email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="studio@omni.ai"
              icon={<Mail size={14} />}
              autoComplete="email"
              error={fieldErrors.email}
            />
            <Field
              id="login-password"
              label="Mot de passe"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="••••••••"
              icon={<Lock size={14} />}
              autoComplete="current-password"
              showToggle
              onToggle={() => setShow((s) => !s)}
              error={fieldErrors.password}
            />

            {/* Ant Design-like general error — sans bg card, juste texte */}
            <AnimatePresence>
              {fieldErrors.general && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-[#ff4d4f] text-center"
                >
                  <AlertCircle size={12} className="shrink-0" /> {fieldErrors.general}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-on-primary shadow-lg shadow-primary/25 hover:bg-primary-hover hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <AiSpinner size={16} /> Connexion…
                </>
              ) : (
                <>
                  Se connecter <ArrowRight size={14} className="text-on-primary" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">ou continuer avec</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-[#f3f4f6] active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm dark:border-zinc-300 cursor-pointer disabled:cursor-not-allowed"
          >
            {googleLoading ? <AiSpinner size={16} /> : <GoogleIcon />}
            {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
          </button>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Vous n'avez pas encore de compte ?{' '}
            <button onClick={onSwitch}               className="font-semibold text-white hover:text-primary underline underline-offset-4 decoration-zinc-700 hover:decoration-primary transition-colors whitespace-nowrap cursor-pointer">
              Créer un compte
            </button>
          </p>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <Sparkles size={11} className="text-zinc-600" /> Propulsé par Gemini Omni 1.1
          </div>
        </div>
        <div className="px-7 md:px-8 py-3 border-t border-zinc-800 bg-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Play size={11} /> Preview instantané
          </span>
          <span>© 2026 Omni Studio</span>
        </div>
      </motion.div>
    </div>
  );
}

export function SignupPage({ onSwitch, theme, onToggleTheme }: { onSwitch: () => void; theme: Theme; onToggleTheme: () => void }) {
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [shakeKey, setShakeKey] = useState(0);
  const hasError = Object.values(fieldErrors).some(Boolean);

  const triggerShake = () => setShakeKey((k) => k + 1);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!name) errs.name = 'Veuillez renseigner votre nom.';
    if (!email) errs.email = 'Veuillez renseigner votre email.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Veuillez saisir une adresse email valide.';
    if (!password) errs.password = 'Veuillez renseigner votre mot de passe.';
    else if (password.length < 6) errs.password = 'Votre mot de passe doit contenir au moins 6 caractères.';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      triggerShake();
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await signup(name, email, password);
    } catch (err: any) {
      const msg = err.message || 'Inscription échouée';
      if (/name|nom/i.test(msg)) setFieldErrors({ name: msg });
      else if (/email/i.test(msg)) setFieldErrors({ email: msg });
      else if (/password|mot de passe/i.test(msg)) setFieldErrors({ password: msg });
      else setFieldErrors({ general: msg });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setFieldErrors({});
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setFieldErrors({ general: err.message || 'Connexion avec Google échouée' });
      triggerShake();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-zinc-950 overflow-hidden">
      <VideoBackdrop />
      <AuthThemeToggle theme={theme} onToggle={onToggleTheme} />
      <motion.div
        key={shakeKey}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={hasError ? { x: [0, -6, 6, -4, 4, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1, x: 0 }}
        transition={hasError ? { duration: 0.4, ease: 'easeInOut' } : { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className={`relative w-full max-w-[480px] rounded-lg border bg-zinc-950 dark:bg-zinc-900 backdrop-blur-xl shadow-2xl overflow-hidden ${hasError ? 'border-transparent shadow-[0_0_28px_rgba(244,63,94,0.28)]' : 'border-zinc-800 shadow-black/15 dark:shadow-black/50'}`}
      >
        {hasError && <div className="auth-error-snake" aria-hidden />}
        {!hasError && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />}
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-primary" />
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white">Omni Product Studio</h1>
              <p className="text-xs text-zinc-400">Rejoignez la suite cinématique</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">Inscription</h2>
          <p className="mt-1 mb-6 text-xs text-zinc-400">Créez votre espace — renders et transitions centralisés.</p>

          <form onSubmit={submit} className="space-y-4">
            <Field
              id="signup-name"
              label="Nom complet"
              type="text"
              value={name}
              onChange={(v) => {
                setName(v);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Alex Rivera"
              icon={<User size={14} />}
              autoComplete="name"
              error={fieldErrors.name}
            />
            <Field
              id="signup-email"
              label="Email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="studio@omni.ai"
              icon={<Mail size={14} />}
              autoComplete="email"
              error={fieldErrors.email}
            />
            <Field
              id="signup-password"
              label="Mot de passe"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="••••••••"
              icon={<Lock size={14} />}
              autoComplete="new-password"
              showToggle
              onToggle={() => setShow((s) => !s)}
              error={fieldErrors.password}
            />

            <AnimatePresence>
              {fieldErrors.general && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-[#ff4d4f] text-center"
                >
                  <AlertCircle size={12} className="shrink-0" /> {fieldErrors.general}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-on-primary shadow-lg shadow-primary/25 hover:bg-primary-hover hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <AiSpinner size={16} /> Création…
                </>
              ) : (
                <>
                  Créer mon compte <ArrowRight size={14} className="text-on-primary" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">ou continuer avec</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-[#f3f4f6] active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm dark:border-zinc-300 cursor-pointer disabled:cursor-not-allowed"
          >
            {googleLoading ? <AiSpinner size={16} /> : <GoogleIcon />}
            {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
          </button>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Vous avez déjà un compte ?{' '}
            <button onClick={onSwitch}               className="font-semibold text-white hover:text-primary underline underline-offset-4 decoration-zinc-700 hover:decoration-primary transition-colors whitespace-nowrap cursor-pointer">
              Se connecter
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
