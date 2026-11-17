'use client';
import React, { useState, useEffect, useRef } from 'react';
import './styles/globals.css';
import LoginPage, { prepareStudentSession } from './pages/LoginPage';
import { useSession } from './context/SessionContext';
import { homeFor } from './utils/roleRouting';
import WelcomePage from './pages/WelcomePage';
import QuestionnairePage from './pages/QuestionnairePage';
import AcademicUploadPage from './components/academic-upload/AcademicUploadPage';
import { useRouter } from 'next/navigation';
import { StudentProfile } from './types';
import { updateInfoService } from './services/updateInfo.service';
import  PageLoader  from '../src/components/loaders/PageLoader';
import { getSavedReturnUrl, clearSavedReturnUrl } from './utils/auth-redirect';
// Definimos los estados de las pantallas de forma estricta
const SCREENS = {
  LOGIN: 'login' as const,
  WELCOME: 'welcome' as const,
  QUESTIONNAIRE: 'questionnaire' as const,
  ACADEMIC: 'academic' as const,
  DONE: 'done' as const,
  CHAT: 'chat' as const,
};

type ScreenType = typeof SCREENS[keyof typeof SCREENS];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(SCREENS.LOGIN); // Renombrado para evitar conflictos con 'Screen' global
  const [user, setUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();
  const [fullProfile, setFullProfile] = useState<StudentProfile | null>(null);

  // 1. COMPROBACIÓN DE SESIÓN AL CARGAR LA PÁGINA (una sola vez, con la sesión única)
  // Los logins que ocurren en esta pantalla los maneja LoginPage → handleLogin.
  const session = useSession();
  const checkedRef = useRef(false);
  useEffect(() => {
    if (session.status === 'loading' || checkedRef.current) return;
    checkedRef.current = true;

    const checkActiveSession = async () => {
      await Promise.resolve(); // el estado se actualiza fuera del cuerpo síncrono del efecto

      if (session.status !== 'authenticated' || !session.user) {
        // Sin sesión: portada con el login de Google.
        localStorage.removeItem('userData');
        setCurrentScreen(SCREENS.LOGIN);
        setIsCheckingSession(false);
        return;
      }

      // "/" es el portal del alumno. Si la cuenta no es de alumno, va a su portal (o a elegir).
      if (!session.user.roles.includes('STUDENT')) {
        router.replace(homeFor(session.user.roles));
        return;
      }

      try {
        const rawData = localStorage.getItem('userData');
        const cached = rawData ? JSON.parse(rawData) : null;
        const parsedUser =
          cached && cached.email === session.user.email
            ? cached
            : await prepareStudentSession(session.user);
        setUser(parsedUser);

        // ────────────────────────────────────────────────────────────────
        // EL FILTRO MAESTRO: Validamos el token en tiempo real contra el Back.
        // Si el token expiró, el servicio arrojará un error e irá directo al CATCH.
        const profile = await updateInfoService.getProfileSummary();

        if (profile?.currentSemester) {
          parsedUser.semestre = `${profile.currentSemester}° semestre`;
          parsedUser.currentSemester = profile.currentSemester;
          localStorage.setItem('userData', JSON.stringify(parsedUser));
        }

        // Si existe una URL de retorno pendiente y la sesión es válida, redirigir directo
        const returnUrl = getSavedReturnUrl();
        if (returnUrl) {
          clearSavedReturnUrl();
          router.push(returnUrl);
          return;
        }

        // Si el backend responde bien, usamos el dato fresco del perfil
        const hasCompleted = profile?.hasCompletedQuiz || parsedUser?.hasCompletedQuiz;

        if (hasCompleted === true) {
          router.push('/home');
        } else {
          setCurrentScreen(SCREENS.WELCOME);
        }
        // ────────────────────────────────────────────────────────────────

      } catch (e) {
        console.warn('La sesión expiró o es inválida; se cierra.', e);
        localStorage.removeItem('userData');
        await session.logout();
        setUser(null);
        setCurrentScreen(SCREENS.LOGIN);
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkActiveSession();
  }, [session, router]);

  // 2. LOGIC PARA PROCESAR EL INICIO DE SESIÓN
  // page.tsx - Función handleLogin Ultra-Defensiva
  const handleLogin = (userData: any) => {
    // 1. LOG CRÍTICO: Imprime en la consola del navegador exactamente qué está llegando del backend
    console.log("=== DATOS RECIBIDOS EN HANDLE_LOGIN ===", userData);

    // 2. Si llega un valor nulo, falso o undefined, detenemos el flujo antes de que intente leer propiedades
    if (!userData) {
      console.error("Error: 'userData' llegó completamente vacío (undefined o null) a handleLogin.");
      alert("Error al iniciar sesión: Los datos del servidor no son válidos.");
      return;
    }

    try {
      // 3. Guardamos de forma segura en el disco
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);

      // 4. Extracción ultra-segura paso a paso
      let hasCompleted = false;

      if (typeof userData === 'object') {
        // Busca la bandera ya sea en la raíz o dentro del objeto anidado 'user'
        hasCompleted = userData.hasCompletedQuiz || userData.user?.hasCompletedQuiz || false;
      }

      console.log("¿El alumno ya completó el cuestionario según el Back?:", hasCompleted);

      // 5. La redirección por rol ya la hizo el login de Google (utils/roleRouting.ts):
      //    si llegamos aquí, la persona eligió o solo tiene el portal del alumno.

      // Redirección prioritaria a URL original de asistencia si existe
      const returnUrl = getSavedReturnUrl();
      if (returnUrl) {
        clearSavedReturnUrl();
        router.push(returnUrl);
        return;
      }

      if (hasCompleted === true) {
        router.push('/home');
      } else {
        setCurrentScreen(SCREENS.WELCOME);
      }

    } catch (error) {
      console.error("Ocurrió un error inesperado al procesar el objeto de usuario:", error);
      // Fallback por seguridad: lo mandamos a la pantalla de bienvenida si no podemos leer el dato
      setCurrentScreen(SCREENS.WELCOME);
    }
  };

  const handleBegin = (profileData: StudentProfile) => {
    setFullProfile(profileData);
    localStorage.setItem('student_profile', JSON.stringify(profileData));
    setCurrentScreen(SCREENS.QUESTIONNAIRE);
  };

  const handleFinish = (answers: any) => {
    console.log('Respuestas del cuestionario:', answers);
    localStorage.setItem('quiz_answers', JSON.stringify(answers));
    setCurrentScreen(SCREENS.ACADEMIC);
  };

  // Loader inicial para evitar parpadeos visuales
  if (isCheckingSession) {
    return <PageLoader message="Verificando sesión..." />;
  }

  // --- MANEJADOR DE RENDERIZADO DE PANTALLAS ---
  if (currentScreen === SCREENS.LOGIN) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentScreen === SCREENS.WELCOME) {
    if (!user) { setCurrentScreen(SCREENS.LOGIN); return null; }
    return <WelcomePage user={user} onBegin={handleBegin} />;
  }

  if (currentScreen === SCREENS.QUESTIONNAIRE) {
    if (!user) { setCurrentScreen(SCREENS.LOGIN); return null; }
    return <QuestionnairePage user={user} profile={fullProfile} onFinish={handleFinish} />;
  }

  if (currentScreen === SCREENS.ACADEMIC) {
    if (!user) { setCurrentScreen(SCREENS.LOGIN); return null; }
    // Cambiamos setCurrentScreen(SCREENS.DONE) por la redirección directa al Home
    return <AcademicUploadPage user={user} onContinue={() => router.push('/home')} />;
  }

  if (currentScreen === SCREENS.DONE) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', background: '#060d1f', color: 'white',
        fontFamily: 'Sora, sans-serif', gap: 16, textAlign: 'center', padding: 40,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
          Tus respuestas fueron guardadas. La IA está procesando tu perfil.
        </p>
        <button
          onClick={() => router.push('/home')} // Te manda directo al home listo
          style={{
            marginTop: 24, padding: '14px 40px', background: '#0f2d6b',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100,
            color: 'white', fontSize: 16, cursor: 'pointer',
            fontFamily: 'Sora, sans-serif', fontWeight: 600,
          }}
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  return null;
}