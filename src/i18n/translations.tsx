import { ReactNode } from 'react';
import CatalanFlag from '../components/icons/CatalanFlag';
import SpanishFlag from '../components/icons/SpanishFlag';
import UKFlag from '../components/icons/UKFlag';

export interface Language {
  code: string;
  name: string;
  flag: ReactNode;
}

export const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    flag: <UKFlag className="w-5 h-3.5 inline-block shadow-sm rounded-sm" />,
  },
  {
    code: 'es',
    name: 'Español',
    flag: <SpanishFlag className="w-5 h-3.5 inline-block shadow-sm rounded-sm" />,
  },
  {
    code: 'ca',
    name: 'Català',
    flag: <CatalanFlag className="w-5 h-3.5 inline-block shadow-sm rounded-sm" />,
  },
];

export interface TranslationSet {
  [key: string]: string;
}

export interface Translations {
  [lang: string]: TranslationSet;
}

const translations: Translations = {
  en: {
    // General
    appName: 'Girify',
    loading: 'Loading...',

    // Auth
    welcomeBack: 'Welcome Back',
    joinGirify: 'Join Girify',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    continueWithGoogle: 'Continue with Google',
    loginRequired: 'Login Required',
    loginRequiredMessage:
      'Join the Girify community! Create a profile to track your progress, earn badges, and collect Giuros.',
    displayName: 'Display Name',
    email: 'Email address',
    password: 'Password',
    alreadyHaveAccount: 'Already have an account? Sign In',
    noAccount: "Don't have an account? Sign Up",
    pleaseWait: 'Please wait...',
    verificationSent: 'Verification email sent! Please check your inbox.',
    verifyEmail: 'Please verify your email before signing in.',

    // Quiz
    question: 'Question',
    whichStreet: 'Which street is highlighted?',
    of: 'of',
    hints: 'HINTS',
    revealHint: 'Reveal Hint',
    nextQuestion: 'Next Question',
    finishQuiz: 'Finish Quiz',

    // Instructions
    howToPlay: 'How to Play',
    instructionsPoint1: 'A street will be highlighted in Blue on the map.',
    instructionsPoint2: 'Guess the correct name from 4 options.',
    instructionsPoint3: 'Need help? Reveal hints to help you find it.',
    instructionsPoint4: 'Speed matters! Higher score for faster answers.',
    imReady: "I'M READY!",
    next: 'NEXT',
    startQuiz: 'PLAY',
    replayChallenge: 'REPLAY CHALLENGE',
    scoreNotSaved: 'Score will not be saved',
    tapStreet: 'Tap the highlighted street',
    clickStreet: 'Click the highlighted street',

    // About
    aboutGirify: 'About Girify',
    aboutDescription:
      'Girify is a fun, interactive way to learn the streets of Barcelona. Whether you are a local trying to master your neighborhood or a visitor exploring the city, our quiz helps you build a mental map of the city.',
    aboutCredits: 'Credits',
    aboutFooter:
      'Designed and built with ❤️ for Barcelona. Map data provided by OpenStreetMap contributors.',
    rightsReserved: '© 2025 Girify. All rights reserved.',
    aboutPoint1: 'A street is highlighted in blue on the map.',
    aboutPoint2: 'You have 4 options to choose from.',
    aboutPoint3: 'The faster you answer, the more points you get!',
    aboutPoint4: 'Use hints if you get stuck (but try not to!).',
    aboutPoint5: 'Get a perfect score to unlock special city curiosities.',

    // Summary
    dailyChallengeComplete: 'Daily Challenge Complete',
    questionBreakdown: 'Question Breakdown',
    cityCuriosityUnlocked: '🎁 City Curiosity Unlocked!',
    shareToReveal: 'Share your results to reveal a secret about Barcelona.',
    shareAndReveal: 'Share & Reveal',
    congratsOutstanding: 'Outstanding! 🌟',
    congratsExcellent: 'Excellent work! 🎉',
    congratsGreat: 'Great job! 👏',
    congratsGood: 'Good effort! 💪',
    congratsKeepPracticing: 'Keep practicing! 📚',
    greatJob: 'Great Job!',
    shareAndEarnGiuros: 'Share & Earn Giuros',
    inviteFriendsEarnRewards: 'Invite friends and earn rewards when they play!',

    // Results
    dailyChallenge: 'Daily Challenge',
    yourScore: 'Your Score',
    avgTime: 'Avg Time',
    correct: 'Correct',
    rankings: 'Rankings',
    share: 'Share',
    playAgain: 'Play Again',

    // Profile
    profile: 'Profile',
    playerSince: 'Player since',
    streak: 'Streak',
    friends: 'Friends',
    games: 'Games',
    best: 'Best',
    avg: 'Avg',
    recentActivity: 'Recent Activity',
    noGamesYet: 'No games played yet.',

    // Leaderboard
    leaderboard: 'Leaderboard',
    allTime: 'All Time',
    monthly: 'Monthly',
    weekly: 'Weekly',
    daily: 'Daily',
    loadingRankings: 'Loading rankings...',
    noRecords: 'No records found',
    beFirst: 'Be the first to set a record!',

    // Settings
    settings: 'Settings',
    language: 'Language',
    autoAdvance: 'Auto-advance',
    autoAdvanceDesc: 'Automatically move to next question',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    logout: 'Logout',

    // Menu
    menu: 'Menu',
    home: 'Home',
    myProfile: 'My Profile',
    about: 'About',

    // Social
    addFriend: 'Add Friend',
    requestPending: 'Request Pending',
    friendsLabel: 'Friends',
    blockUser: 'Block User',
    blocked: 'Blocked',

    // Shop
    shop: 'Shop',
    giuros: 'Giuros',
    frames: 'Frames',
    badges: 'Badges',
    titles: 'Titles',
    special: 'Special',
    buy: 'Buy',
    equip: 'Equip',
    equipped: 'Equipped',
    owned: 'Owned',
    notEnoughGiuros: 'Not enough giuros!',
    alreadyOwned: 'Already owned!',
    purchased: 'Purchased',
    back: 'Back',

    // Errors
    usernameRequired: 'Username is required',
    usernameTooLong: 'Username must be 20 characters or less',
    usernameTooShort: 'Username must be at least 3 characters',
    usernameInvalid: 'Username can only contain letters, numbers, and underscores',
    usernameNotAllowed: 'This username is not allowed',
    googleLoginFailed: 'Google login failed',
    enterEmailAndPassword: 'Please enter email and password',
    enterYourName: 'Please enter your name',

    // Giuros Explainer
    giurosExplainerTitle: 'What are Giuros?',
    giurosExplainerText:
      'Earn Giuros by playing daily, maintaining streaks, and completing challenges. Spend them on cosmetics!',
    goToShop: 'Go to Shop',

    // Achievements
    achievements: 'Achievements',
    badgeEarned: 'earned a badge',
    changedNameTo: 'changed name to',
    nextAchievement: 'Next Achievement',
    progress: 'Progress',

    // Activity Feed
    scored: 'scored',
    points: 'points',

    // Feedback
    feedbackTitle: 'We value your feedback!',
    feedbackSubtitle: 'Tell us what you think about Girify. Helpful feedback helps us improve!',
    feedbackPlaceholder: 'What would you like to see improved?',
    submitFeedback: 'Submit Feedback',
    feedbackPending: "Your feedback is under review. You'll be notified when approved!",
    cancel: 'Cancel',
    skip: 'Skip',
    shapeTheFuture: 'SHAPE THE FUTURE',
    whatFeaturesTitle: 'What features do you want?',
    earnForFeedback: 'Earn Giuros for useful ideas!',
    feedbackPlaceholderFeatures: 'I wish the game had...',

    // News
    news: 'News',
    latestUpdates: 'Latest updates and announcements',
    noNews: 'No announcements yet',
    checkBackLater: 'Check back later for updates!',
    gotIt: 'Got it!',
    feedback: 'Feedback',
    unlockedCosmetic: 'unlocked',

    // Game flow
    exitGameWarning: "Leave game? Your progress won't be lost—come back anytime!",
    haveFeedback: 'Have feedback? Share your ideas',
    play: 'Play',
    replay: 'Replay',
    new: 'NEW',
    achievementUnlocked: 'Achievement Unlocked!',
    okay: 'Okay',
    daysStreak: 'Days',

    // Landing Page
    landingTitle: 'Play Barcelona Streets Quiz',
    landingDescription:
      "Test your knowledge of Barcelona's streets. Compete in daily challenges, earn badges, and climb the leaderboard.",
    landingHeadline: 'Master the Streets of Barcelona',
    landingSubheadline:
      'Join thousands of locals and explorers in the ultimate daily street trivia challenge.',
    login: 'Login',
    howItWorks: 'How it Works',
    explore: 'Explore',
    exploreDesc:
      'We highlight a random street in Barcelona on the map. Zoom, pan, and investigate.',
    guess: 'Guess',
    guessDesc: 'Type the street name. No multiple choice. Pure local knowledge (or good research).',
    rankUp: 'Rank Up',
    rankUpDesc: 'Earn Giuros, buy upgrades, and climb the daily leaderboard. Become a legend.',
    dailyChallengeTitle: 'Daily Challenge',
    dailyChallengeDesc:
      'Every day, 5 new streets. Compete with the whole city for the top spot. Can you get 5/5?',
    buildStreaks: 'Build Streaks',
    buildStreaksDesc: 'Consistency is key. Play daily to keep your flame alive and earn 2x Giuros.',
    rankUpTitle: 'Rank Up',
    rankUpFeatureDesc: 'Climb the local leaderboards. See how you compare to neighbors.',
    earnAndCustomize: 'Earn & Customize',
    earnAndCustomizeDesc:
      'Win Giuros to unlock exclusive badges, frames, and titles. Show off your expertise with style.',
    joinPlayers: 'Join',
    playersMastering: 'players mastering the city',

    // New additions
    proveLocal: 'PROVE YOU ARE A LOCAL',
    cityCuriosity: 'City Curiosity',
    didYouKnow: 'Did you know?',
    todaysChallenge: "Today's Challenge",
    pts: 'pts',
    shareAndEarn: 'Share & Earn',
  },

  es: {
    // General
    appName: 'Girify',
    loading: 'Cargando...',

    // Auth
    welcomeBack: 'Bienvenido de nuevo',
    joinGirify: 'Únete a Girify',
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    createAccount: 'Crear cuenta',
    continueWithGoogle: 'Continuar con Google',
    loginRequired: 'Login Requerido',
    loginRequiredMessage:
      '¡Únete a la comunidad Girify! Crea un perfil para seguir tu progreso, ganar insignias y coleccionar Giuros.',
    displayName: 'Nombre de usuario',
    email: 'Correo electrónico',
    password: 'Contraseña',
    alreadyHaveAccount: '¿Ya tienes cuenta? Iniciar sesión',
    noAccount: '¿No tienes cuenta? Regístrate',
    pleaseWait: 'Por favor espera...',
    verificationSent: '¡Email de verificación enviado! Revisa tu bandeja de entrada.',
    verifyEmail: 'Por favor verifica tu email antes de iniciar sesión.',

    // Quiz
    question: 'Pregunta',
    whichStreet: '¿Qué calle está resaltada?',
    of: 'de',
    hints: 'PISTAS',
    revealHint: 'Revelar pista',
    nextQuestion: 'Siguiente pregunta',
    finishQuiz: 'Terminar quiz',

    // Instructions
    howToPlay: 'Cómo Jugar',
    instructionsPoint1: 'Una calle aparecerá resaltada en Azul en el mapa.',
    instructionsPoint2: 'Adivina el nombre correcto entre 4 opciones.',
    instructionsPoint3: '¿Necesitas ayuda? Revela pistas para encontrarla.',
    instructionsPoint4: '¡La velocidad importa! Más puntos por responder rápido.',
    imReady: '¡ESTOY LISTO!',
    next: 'SIGUIENTE',
    startQuiz: 'JUGAR',
    replayChallenge: 'REPETIR RETO',
    scoreNotSaved: 'La puntuación no se guardará',
    tapStreet: 'Toca la calle resaltada',
    clickStreet: 'Haz clic en la calle resaltada',

    // About
    aboutGirify: 'Sobre Girify',
    aboutDescription:
      'Girify es una forma divertida e interactiva de aprender las calles de Barcelona. Ya seas un local intentando dominar tu barrio o un visitante explorando, nuestro quiz te ayuda a construir un mapa mental de la ciudad.',
    aboutCredits: 'Créditos',
    aboutFooter:
      'Diseñado y construido con ❤️ para Barcelona. Datos del mapa proporcionados por OpenStreetMap.',
    rightsReserved: '© 2025 Girify. Todos los derechos reservados.',
    aboutPoint1: 'Una calle se resalta en azul en el mapa.',
    aboutPoint2: 'Tienes 4 opciones para elegir.',
    aboutPoint3: '¡Cuanto más rápido respondas, más puntos obtienes!',
    aboutPoint4: 'Usa pistas si te atascas (¡pero intenta no hacerlo!).',
    aboutPoint5: 'Consigue una puntuación perfecta para desbloquear curiosidades especiales.',

    // Summary
    dailyChallengeComplete: 'Reto Diario Completado',
    questionBreakdown: 'Desglose de Preguntas',
    cityCuriosityUnlocked: '🎁 ¡Curiosidad Desbloqueada!',
    shareToReveal: 'Comparte tus resultados para revelar un secreto sobre Barcelona.',
    shareAndReveal: 'Compartir y Revelar',
    congratsOutstanding: '¡Sobresaliente! 🌟',
    congratsExcellent: '¡Excelente trabajo! 🎉',
    congratsGreat: '¡Gran trabajo! 👏',
    congratsGood: '¡Buen esfuerzo! 💪',
    congratsKeepPracticing: '¡Sigue practicando! 📚',
    greatJob: '¡Gran Trabajo!',
    shareAndEarnGiuros: 'Compartir y Ganar Giuros',
    inviteFriendsEarnRewards: '¡Invita amigos y gana recompensas cuando jueguen!',

    // Results
    dailyChallenge: 'Reto diario',
    yourScore: 'Tu puntuación',
    avgTime: 'Tiempo medio',
    correct: 'Correctas',
    rankings: 'Clasificación',
    share: 'Compartir',
    playAgain: 'Jugar de nuevo',

    // Profile
    profile: 'Perfil',
    playerSince: 'Jugador desde',
    streak: 'Racha',
    friends: 'Amigos',
    games: 'Partidas',
    best: 'Mejor',
    avg: 'Media',
    recentActivity: 'Actividad reciente',
    noGamesYet: 'Aún no has jugado ninguna partida.',

    // Leaderboard
    leaderboard: 'Clasificación',
    allTime: 'Histórico',
    monthly: 'Mensual',
    weekly: 'Semanal',
    daily: 'Diario',
    loadingRankings: 'Cargando clasificación...',
    noRecords: 'No hay registros',
    beFirst: '¡Sé el primero en establecer un récord!',

    // Settings
    settings: 'Ajustes',
    language: 'Idioma',
    autoAdvance: 'Avance automático',
    autoAdvanceDesc: 'Pasar automáticamente a la siguiente pregunta',
    theme: 'Tema',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    logout: 'Cerrar sesión',

    // Menu
    menu: 'Menú',
    home: 'Inicio',
    myProfile: 'Mi perfil',
    about: 'Acerca de',

    // Social
    addFriend: 'Añadir amigo',
    requestPending: 'Solicitud pendiente',
    friendsLabel: 'Amigos',
    blockUser: 'Bloquear usuario',
    blocked: 'Bloqueado',

    // Shop
    shop: 'Tienda',
    giuros: 'Giuros',
    frames: 'Marcos',
    badges: 'Insignias',
    titles: 'Títulos',
    special: 'Especial',
    buy: 'Comprar',
    equip: 'Equipar',
    equipped: 'Equipado',
    owned: 'Obtenido',
    notEnoughGiuros: '¡No tienes suficientes giuros!',
    alreadyOwned: '¡Ya lo tienes!',
    purchased: 'Comprado',
    back: 'Volver',

    // Errors
    usernameRequired: 'El nombre de usuario es obligatorio',
    usernameTooLong: 'El nombre debe tener 20 caracteres o menos',
    usernameTooShort: 'El nombre debe tener al menos 3 caracteres',
    usernameInvalid: 'Solo puede contener letras, números y guiones bajos',
    usernameNotAllowed: 'Este nombre de usuario no está permitido',
    googleLoginFailed: 'Error al iniciar sesión con Google',
    enterEmailAndPassword: 'Por favor ingresa email y contraseña',
    enterYourName: 'Por favor ingresa tu nombre',

    // Giuros Explainer
    giurosExplainerTitle: '¿Qué son los Giuros?',
    giurosExplainerText:
      'Gana Giuros jugando a diario, manteniendo rachas y completando retos. ¡Gástalos en cosméticos!',
    goToShop: 'Ir a la tienda',

    // Achievements
    achievements: 'Logros',
    badgeEarned: 'ha ganado una insignia',
    changedNameTo: 'cambió su nombre a',
    nextAchievement: 'Siguiente logro',
    progress: 'Progreso',

    // Activity Feed
    scored: 'puntuó',
    points: 'puntos',

    // Feedback
    feedbackTitle: '¡Valoramos tu opinión!',
    feedbackSubtitle: 'Dinos qué piensas sobre Girify. ¡Tu opinión nos ayuda a mejorar!',
    feedbackPlaceholder: '¿Qué te gustaría que mejoráramos?',
    submitFeedback: 'Enviar Opinión',
    feedbackPending: '¡Tu opinión está siendo revisada. Te notificaremos cuando sea aprobada!',
    cancel: 'Cancelar',
    skip: 'Saltar',
    shapeTheFuture: 'MOLDEA EL FUTURO',
    whatFeaturesTitle: '¿Qué funciones quieres?',
    earnForFeedback: '¡Gana Giuros por tus ideas útiles!',
    feedbackPlaceholderFeatures: 'Me gustaría que el juego tuviera...',

    // News
    news: 'Noticias',
    latestUpdates: 'Últimas actualizaciones y anuncios',
    noNews: 'No hay anuncios todavía',
    checkBackLater: '¡Vuelve más tarde para ver actualizaciones!',
    gotIt: '¡Entendido!',
    feedback: 'Opinión',
    unlockedCosmetic: 'desbloqueó',

    // Game flow
    exitGameWarning: '¿Salir del juego? Tu progreso no se perderá,¡vuelve cuando quieras!',
    haveFeedback: '¿Tienes sugerencias? Comparte tus ideas',
    play: 'Jugar',
    replay: 'Repetir',
    new: 'NUEVO',
    achievementUnlocked: '¡Logro Desbloqueado!',
    okay: 'Vale',
    daysStreak: 'Días',

    // Landing Page
    landingTitle: 'Juega al Quiz de Calles de Barcelona',
    landingDescription:
      'Pon a prueba tu conocimiento de las calles de Barcelona. Compite en retos diarios, gana insignias y sube en la clasificación.',
    landingHeadline: 'Domina las Calles de Barcelona',
    landingSubheadline:
      'Únete a miles de locales y exploradores en el reto diario definitivo de trivia callejera.',
    login: 'Iniciar sesión',

    // New additions
    proveLocal: 'DEMUESTRA QUE ERES LOCAL',
    cityCuriosity: 'Curiosidad de la Ciudad',
    didYouKnow: '¿Sabías que...?',
    todaysChallenge: 'Reto de Hoy',
    pts: 'pts',
    shareAndEarn: 'Compartir y Ganar',
  },

  ca: {
    // General
    appName: 'Girify',
    loading: 'Carregant...',

    // Auth
    welcomeBack: 'Benvingut de nou',
    joinGirify: 'Uneix-te a Girify',
    signIn: 'Iniciar sessió',
    signUp: 'Registrar-se',
    createAccount: 'Crear compte',
    continueWithGoogle: 'Continuar amb Google',
    loginRequired: 'Login Requerit',
    loginRequiredMessage:
      'Uneix-te a la comunitat Girify! Crea un perfil per seguir el teu progrés, guanyar insígnies i col·leccionar Giuros.',
    displayName: "Nom d'usuari",
    email: 'Correu electrònic',
    password: 'Contrasenya',
    alreadyHaveAccount: 'Ja tens compte? Inicia sessió',
    noAccount: "No tens compte? Registra't",
    pleaseWait: 'Si us plau espera...',
    verificationSent: "Email de verificació enviat! Revisa la safata d'entrada.",
    verifyEmail: "Si us plau verifica el teu email abans d'iniciar sessió.",

    // Quiz
    question: 'Pregunta',
    whichStreet: 'Quin carrer està ressaltat?',
    of: 'de',
    hints: 'PISTES',
    revealHint: 'Revelar pista',
    nextQuestion: 'Següent pregunta',
    finishQuiz: 'Acabar quiz',

    // Results
    dailyChallenge: 'Repte diari',
    yourScore: 'La teva puntuació',
    avgTime: 'Temps mitjà',
    correct: 'Correctes',
    rankings: 'Classificació',
    share: 'Compartir',
    playAgain: 'Tornar a jugar',

    // Profile
    profile: 'Perfil',
    playerSince: 'Jugador des de',
    streak: 'Ratxa',
    friends: 'Amics',
    games: 'Partides',
    best: 'Millor',
    avg: 'Mitjana',
    recentActivity: 'Activitat recent',
    noGamesYet: 'Encara no has jugat cap partida.',

    // Leaderboard
    leaderboard: 'Classificació',
    allTime: 'Històric',
    monthly: 'Mensual',
    weekly: 'Setmanal',
    daily: 'Diari',
    loadingRankings: 'Carregant classificació...',
    noRecords: 'No hi ha registres',
    beFirst: 'Sigues el primer a establir un rècord!',

    // Settings
    settings: 'Configuració',
    language: 'Idioma',
    autoAdvance: 'Avanç automàtic',
    autoAdvanceDesc: 'Passar automàticament a la següent pregunta',
    theme: 'Tema',
    darkMode: 'Mode fosc',
    lightMode: 'Mode clar',
    logout: 'Tancar sessió',

    // Menu
    menu: 'Menú',
    home: 'Inici',
    myProfile: 'El meu perfil',
    about: 'Quant a',

    // Social
    addFriend: 'Afegir amic',
    requestPending: 'Sol·licitud pendent',
    friendsLabel: 'Amics',
    blockUser: 'Bloquejar usuari',
    blocked: 'Bloquejat',

    // Shop
    shop: 'Botiga',
    giuros: 'Giuros',
    frames: 'Marcs',
    badges: 'Insígnies',
    titles: 'Títols',
    special: 'Especial',
    buy: 'Comprar',
    equip: 'Equipar',
    equipped: 'Equipat',
    owned: 'Obtingut',
    notEnoughGiuros: 'No tens prou giuros!',
    alreadyOwned: 'Ja el tens!',
    purchased: 'Comprat',
    back: 'Tornar',

    // Errors
    usernameRequired: "El nom d'usuari és obligatori",
    usernameTooLong: 'El nom ha de tenir 20 caràcters o menys',
    usernameTooShort: 'El nom ha de tenir almenys 3 caràcters',
    usernameInvalid: 'Només pot contenir lletres, números i guions baixos',
    usernameNotAllowed: "Aquest nom d'usuari no està permès",
    googleLoginFailed: 'Error en iniciar sessió amb Google',
    enterEmailAndPassword: 'Si us plau introdueix email i contrasenya',
    enterYourName: 'Si us plau introdueix el teu nom',

    // Instructions
    howToPlay: 'Com Jugar',
    instructionsPoint1: 'Un carrer apareixerà ressaltat en Blau al mapa.',
    instructionsPoint2: 'Endevina el nom correcte entre 4 opcions.',
    instructionsPoint3: 'Necessites ajuda? Revela pistes per trobar-lo.',
    instructionsPoint4: 'La velocitat compta! Més punts per respondre ràpid.',
    imReady: 'ESTIC APUNT!',
    next: 'SEGÜENT',
    startQuiz: 'JUGAR',
    replayChallenge: 'REPETIR REPTE',
    scoreNotSaved: 'La puntuació no es guardarà',
    tapStreet: 'Toca el carrer ressaltat',
    clickStreet: 'Fes clic al carrer ressaltat',

    // Summary
    dailyChallengeComplete: 'Repte Diari Completat',
    questionBreakdown: 'Detall de Preguntes',
    cityCuriosityUnlocked: '🎁 Curiositat Desbloquejada!',
    shareToReveal: 'Comparteix els resultats per revelar un secret sobre Barcelona.',
    shareAndReveal: 'Compartir i Revelar',
    congratsOutstanding: 'Excel·lent! 🌟',
    congratsExcellent: 'Molt bona feina! 🎉',
    congratsGreat: 'Bona feina! 👏',
    congratsGood: 'Bon esforç! 💪',
    congratsKeepPracticing: 'Segueix practicant! 📚',
    greatJob: 'Bona Feina!',
    shareAndEarnGiuros: 'Compartir i Guanyar Giuros',
    inviteFriendsEarnRewards: 'Convida amics i guanya recompenses quan juguin!',

    // About
    aboutGirify: 'Quant a Girify',
    aboutDescription:
      "Girify és una forma divertida i interactiva d'aprendre els carrers de Barcelona. Tant si ets un local intentant dominar el teu barri com un visitant explorant, el nostre qüestionari t'ajuda a construir un mapa mental de la ciutat.",
    aboutCredits: 'Crèdits',
    aboutFooter:
      'Dissenyat i construït amb ❤️ per a Barcelona. Dades del mapa proporcionades per OpenStreetMap.',
    rightsReserved: '© 2025 Girify. Tots els drets reservats.',
    aboutPoint1: 'Un carrer es ressaltarà en blau al mapa.',
    aboutPoint2: 'Tens 4 opcions per triar.',
    aboutPoint3: 'Com més ràpid responguis, més punts obtindràs!',
    aboutPoint4: "Utilitza pistes si t'encalles (però intenta no fer-ho!).",
    aboutPoint5: 'Aconsegueix una puntuació perfecta per desbloquejar curiositats especials.',

    // Giuros Explainer
    giurosExplainerTitle: 'Què són els Giuros?',
    giurosExplainerText:
      "Guanya Giuros jugant cada dia, mantenint ratxes i completant reptes. Gasta'ls en cosmètics!",
    goToShop: 'Anar a la botiga',

    // Achievements
    achievements: 'Assoliments',
    badgeEarned: 'ha guanyat una insígnia',
    changedNameTo: 'ha canviat el nom a',
    nextAchievement: 'Proper assoliment',
    progress: 'Progrés',

    // Activity Feed
    scored: 'va puntuar',
    points: 'punts',

    // Feedback
    feedbackTitle: 'Valorem la teva opinió!',
    feedbackSubtitle:
      'Explica\u0027ns què penses sobre Girify. La teva opinió ens ajuda a millorar!',
    feedbackPlaceholder: 'Què t\u0027agradaria que milloréssim?',
    submitFeedback: 'Enviar Opinió',
    feedbackPending: 'La teva opinió està sent revisada. Et notificarem quan sigui aprovada!',
    cancel: 'Cancel·lar',
    skip: 'Salta',
    shapeTheFuture: 'MODELA EL FUTURO',
    whatFeaturesTitle: 'Quines funcions vols?',
    earnForFeedback: 'Guanya Giuros per les teves idees útils!',
    feedbackPlaceholderFeatures: "M'agradaria que el joc tingués...",

    // News
    news: 'Notícies',
    latestUpdates: 'Últimes actualitzacions i anuncis',
    noNews: 'Encara no hi ha anuncis',
    checkBackLater: 'Torna més tard per veure actualitzacions!',
    gotIt: 'Entès!',
    feedback: 'Opinió',
    unlockedCosmetic: 'ha desbloquejat',

    // Game flow
    exitGameWarning: 'Sortir del joc? El teu progrés no es perdrà—torna quan vulguis!',
    haveFeedback: 'Tens suggeriments? Comparteix les teves idees',
    play: 'Jugar',
    replay: 'Repetir',
    new: 'NOU',
    achievementUnlocked: 'Assoliment Desbloquejat!',
    okay: "D'acord",
    daysStreak: 'Dies',

    // Landing Page
    landingTitle: 'Juga al Quiz de Carrers de Barcelona',
    landingDescription:
      'Posa a prova el teu coneixement dels carrers de Barcelona. Competeix en reptes diaris, guanya insígnies i puja a la classificació.',
    landingHeadline: 'Domina els Carrers de Barcelona',
    landingSubheadline:
      'Uneix-te a milers de locals i exploradores en el repte diari definitiu de trivia de carrer.',
    login: 'Iniciar sessió',

    // New additions
    proveLocal: 'DEMOSTRA QUE ETS LOCAL',
    cityCuriosity: 'Curiositat de la Ciutat',
    didYouKnow: 'Sabies que...?',
    todaysChallenge: "Repte d'Avui",
    pts: 'pts',
    shareAndEarn: 'Compartir i Guanyar',
  },
};

export const getTranslation = (lang: string, key: string): string => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

export default translations;
