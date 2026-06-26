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
    loginToShop: 'Please sign in to browse and purchase items in the shop.',
    loginRequiredMessage:
      'Join the Girify community! Create a profile to track your progress, earn badges, and collect Giuros.',
    displayName: 'Display Name',
    email: 'Email address',
    password: 'Password',
    alreadyHaveAccount: 'Already have an account? Sign In',
    noAccount: "Don't have an account? Sign Up",
    pleaseWait: 'Please wait...',
    createAccountToTrack: 'Create an account to track stats',
    signInToContinue: 'Sign in to continue',
    orWithEmail: 'Or with email',
    oneLastStep: 'One Last Step!',
    chooseDistrictToComplete: 'Please choose your district to complete your registration.',
    completeRegistration: 'Complete Registration',
    finalizing: 'Finalizing...',
    firstName: 'First Name',
    lastName: 'Last Name',
    fillAllFields: 'Please enter all fields including district',
    sent: 'Sent!',
    passwordMinLength: 'Minimum 6 characters',
    verificationSent: 'Verification email sent! Please check your inbox.',
    verifyEmail: 'Please verify your email before signing in.',

    // Quiz
    question: 'Question',
    whichStreet: 'Which street is highlighted?',
    of: 'of',
    hints: 'HINTS',
    revealHint: 'Reveal Hint',
    nextQuestion: 'Next Question',
    finishQuiz: 'See Results',

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
    rightsReserved: '© 2026 Girify. All rights reserved.',
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

    // Profile / Edit modal
    profile: 'Profile',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    chooseAvatar: 'Choose Avatar',
    chooseFrame: 'Choose Frame',
    getMoreAvatarsInShop: 'Get more avatars in the Shop →',
    defaultAvatar: 'Default',
    noFrame: 'None',
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
    avatars: 'Avatars',
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
    okay: 'Got it',
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
    proveLocal: 'Prove you are a local',
    cityCuriosity: 'City Curiosity',
    didYouKnow: 'Did you know?',
    todaysChallenge: "Today's Challenge",
    pts: 'pts',
    shareAndEarn: 'Share & Earn',
    masterSelectedStreets: 'Master Selected Streets!',
    district: 'District',
    selectDistrict: 'Select District',
    clansTitle: 'District Clans',
    joinClan: 'Join a District Clan',
    clanLeaderboard: 'District Rankings',
    joining: 'Joining...',
    confirmJoinTeam: 'Confirm & Join Team',
    districtUpdateError: 'Failed to update district. Please try again.',
    joinATeam: 'Join a Team!',
    teamRequiredDetails:
      'Pick your Barcelona district and compete with your team in the global leaderboard!',
    districtTeams: 'District Teams',
    refreshData: 'Refresh Data',
    loadingTeamStats: 'Loading team statistics...',
    members: 'Members',
    totalScore: 'Total Score',
    avgScore: 'Avg Score',

    team: 'Team',

    // Quests
    noActiveQuests: 'No active quests',
    completed: 'Completed',
    claimed: 'Claimed',
    claim: 'Claim',
    inProgress: 'Active',
    quests: 'Quests',

    // Post-game summary
    greetingExcellent: '🏆 Unstoppable! The streets know your name!',
    greetingGood: '🔥 Great job! You really know this city!',
    greetingFair: '👍 Not bad! Keep exploring!',
    greetingDefault: '🗺️ Keep wandering! Every street has a story.',
    copied: 'Copied!',
    backToMenu: 'Back to Menu',

    // News headlines (Mayor Jaume)
    newsHeadline1: 'BREAKING: Local man finds parking in Gràcia on first try.',
    newsHeadline2: "ALERT: Guiri asks for 'Sangria' at classic Bodega.",
    newsHeadline3: 'UPDATE: Rent prices drop by 0.00% this month.',
    newsHeadline4: 'SCANDAL: Pigeon steals whole croissant from tourist.',

    // Landing page extras
    landingHeroTitle: 'Become the Ultimate Local',
    landingHeroSubtitle: 'Show you know the real Barcelona... street by street',
    landingSubtitle:
      'Navigate the city without a map. Earn Giuros, climb the rankings, and celebrate your neighborhood.',
    signUpToPlay: 'Sign Up to Play',
    featureRankingsLabel: 'Rankings',
    featureRankingsDesc: 'Compete with friends and neighbors for the top spot.',
    featureFriendshipLabel: 'Friendship',
    featureFriendshipDesc: 'Challenge your friends and track their progress.',
    featureRewardsLabel: 'Rewards',
    featureRewardsDesc: 'Earn Giuros to customize your profile and unlock badges.',
    chooseYourAllegiance: 'Choose Your Allegiance',
    mayorLabel: 'MAYOR',
    mayorReports: '🎙️ Mayor Jaume Reports',
    newsWord: 'NEWS',
    privacyLink: 'Privacy',
    termsLink: 'Terms',

    // Onboarding
    onboardingStep1Title: 'Welcome to the Neighborhood!',
    onboardingStep1Content:
      "Hi! I am Mayor Jaume. I run this district, and I'm looking for someone who knows these streets.",
    onboardingStep2Title: 'The Challenge',
    onboardingStep2Content:
      "I'll highlight a street on the map. You need to identify it. Zoom, pan, do whatever... just don't get lost.",
    onboardingStep3Title: 'Prove Yourself',
    onboardingStep3Content:
      'Select the correct street name. Be quick! Tourists are slow. Locals are fast.',
    onboardingStep4Title: 'Earn Respect (and Giuros)',
    onboardingStep4Content:
      'Score points to earn Giuros. Use them to buy fancy titles and look important, like me!',
    onboardingStep5Title: 'Pick Your District',
    onboardingStep5Content:
      'Every neighborhood has its team. Join a Barcelona district and compete collectively. Where do your loyalties lie?',
    onboardingStep6Title: 'Climb the Rankings',
    onboardingStep6Content:
      'Daily, weekly, all-time — the leaderboard never sleeps. Show the whole city who knows these streets best.',
    onboardingStep7Title: 'Visit the Shop',
    onboardingStep7Content:
      "Spend your Giuros on exclusive avatars, frames, and titles. First coins are on me. Don't waste them!",
    districtManager: 'District Manager',
    startPlaying: 'Start Playing!',

    // Score tiers & summary extras
    scoreTierExpert: 'Street Expert',
    scoreTierLocal: 'City Local',
    scoreTierKnowledge: 'Local Knowledge',
    scoreTierWander: 'Keep Wandering',
    scoreLabel: 'Score',
    shareCuriosity: 'Share this curiosity',
    shareTextQuestion: 'Do I know Barcelona?',
    shareStreakDays: 'days',
    justNow: 'Just now',
    today: 'Today',
    yesterday: 'Yesterday',
    minuteSuffix: 'm ago',
    hourSuffix: 'h ago',
    daySuffix: 'd ago',
    daysAgo: 'days ago',
    weeksAgo: 'weeks ago',
    scorePendingWarning:
      "Score couldn't be saved right now — it'll be submitted automatically next time you open the app.",

    practiceMode: 'Practice Mode',
    keepPlaying: 'Keep Playing',
    exitPractice: 'Exit',

    // 404
    notFoundTitle: 'This street does not exist',
    notFoundMessage:
      'Even the locals get lost sometimes. The page you were looking for has moved or never existed.',

    // Nav labels (distinct from page titles)
    privacy: 'Privacy',
    terms: 'Terms',

    // Legal
    backToHome: '← Back to Home',
    termsTitle: 'Terms of Service',
    termsSection1Title: '1. Acceptance of Terms',
    termsSection1Content:
      'By accessing and using Girify, you agree to be bound by these Terms of Service.',
    termsSection2Title: '2. User Conduct',
    termsSection2Intro: 'You agree not to:',
    termsSection2Item1: 'Use the service for any illegal purpose.',
    termsSection2Item2: 'Attempt to cheat, exploit, or manipulate game mechanics or leaderboards.',
    termsSection2Item3: 'Harass or harm other users.',
    termsSection3Title: '3. Disclaimer',
    termsSection3Content:
      'The game is provided "as is" without warranties of any kind. We are not responsible for any errors in map data or service interruptions.',
    termsSection4Title: '4. Changes to Terms',
    termsSection4Content:
      'We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of new terms.',
    legalLastUpdated: 'Last updated: January 2026',
    privacyTitle: 'Privacy Policy',
    privacySection1Title: '1. Information We Collect',
    privacySection1Intro: 'We collect minimal information to provide the Girify experience:',
    privacySection1Item1: 'Authentication data (via Google or Email) to secure your account.',
    privacySection1Item2: 'Game progress, scores, and shop purchases.',
    privacySection1Item3: 'Basic analytics to understand how the app is used.',
    privacySection2Title: '2. How We Use Information',
    privacySection2Intro: 'Your data is used solely to:',
    privacySection2Item1: 'Maintain your profile and game history.',
    privacySection2Item2: 'Display leaderboards and rankings.',
    privacySection2Item3: 'Improve game mechanics and content.',
    privacySection3Title: '3. Data Security',
    privacySection3Content:
      'We use Supabase to securely store your data. We do not sell your personal data to third parties.',
    privacySection4Title: '4. Contact',
    privacySection4Content:
      'If you have any questions about this policy, please contact us at support@girify.app.',
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
    createAccountToTrack: 'Crea una cuenta para guardar tus estadísticas',
    signInToContinue: 'Inicia sesión para continuar',
    orWithEmail: 'O con email',
    oneLastStep: '¡Un último paso!',
    chooseDistrictToComplete: 'Por favor elige tu distrito para completar el registro.',
    completeRegistration: 'Completar Registro',
    finalizing: 'Finalizando...',
    firstName: 'Nombre',
    lastName: 'Apellido',
    fillAllFields: 'Por favor completa todos los campos incluyendo distrito',
    sent: '¡Enviado!',
    passwordMinLength: 'Mínimo 6 caracteres',
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
    rightsReserved: '© 2026 Girify. Todos los derechos reservados.',
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

    // Profile / Edit modal
    profile: 'Perfil',
    editProfile: 'Editar Perfil',
    saveChanges: 'Guardar Cambios',
    chooseAvatar: 'Elegir Avatar',
    chooseFrame: 'Elegir Marco',
    getMoreAvatarsInShop: 'Obtener más avatares en la Tienda →',
    defaultAvatar: 'Por defecto',
    noFrame: 'Ninguno',
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
    avatars: 'Avatares',
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
    loginToShop: 'Inicia sesión para acceder a la tienda y gastar tus Giuros.',

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
    exitGameWarning: '¿Salir del juego? Tu progreso no se perderá, ¡vuelve cuando quieras!',
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
    howItWorks: 'Cómo Funciona',
    explore: 'Explora',
    exploreDesc:
      'Resaltamos una calle aleatoria de Barcelona en el mapa. Haz zoom, desplázate e investiga.',
    guess: 'Adivina',
    guessDesc: 'Elige el nombre correcto entre 4 opciones. Conocimiento local puro.',
    rankUp: 'Sube de Rango',
    rankUpDesc:
      'Gana Giuros, compra mejoras y sube en la clasificación diaria. Conviértete en leyenda.',
    dailyChallengeTitle: 'Reto Diario',
    dailyChallengeDesc:
      'Cada día, 5 calles nuevas. Compite con toda la ciudad por el primer puesto. ¿Puedes conseguir 5/5?',
    buildStreaks: 'Mantén Rachas',
    buildStreaksDesc:
      'La constancia es clave. Juega cada día para mantener tu racha y ganar el doble de Giuros.',
    rankUpTitle: 'Sube de Rango',
    rankUpFeatureDesc: 'Sube en la clasificación local. Compara tu nivel con el de tus vecinos.',
    earnAndCustomize: 'Gana y Personaliza',
    earnAndCustomizeDesc:
      'Consigue Giuros para desbloquear insignias, marcos y títulos exclusivos. Muestra tu expertise con estilo.',
    joinPlayers: 'Únete a',
    playersMastering: 'jugadores dominando la ciudad',

    // New additions
    proveLocal: 'Demuestra que eres local',
    cityCuriosity: 'Curiosidad de la Ciudad',
    didYouKnow: '¿Sabías que...?',
    todaysChallenge: 'Reto de Hoy',
    pts: 'pts',
    shareAndEarn: 'Compartir y Ganar',
    masterSelectedStreets: '¡Domina las Calles Seleccionadas!',
    district: 'Distrito',
    selectDistrict: 'Selecciona Distrito',
    clansTitle: 'Clanes de Distrito',
    joinClan: 'Únete a un Clan',
    clanLeaderboard: 'Ranking de Distritos',
    joining: 'Uniéndose...',
    confirmJoinTeam: 'Confirmar y Unirse',
    districtUpdateError: 'Error al actualizar distrito. Inténtalo de nuevo.',
    joinATeam: '¡Únete a un Equipo!',
    teamRequiredDetails:
      '¡Elige tu distrito de Barcelona y compite con tu equipo en la clasificación mundial!',
    districtTeams: 'Equipos de Distrito',
    refreshData: 'Actualizar Datos',
    loadingTeamStats: 'Cargando estadísticas...',
    members: 'Miembros',
    totalScore: 'Puntuación Total',
    avgScore: 'Puntuación media',

    team: 'Equipo',

    // Quests
    noActiveQuests: 'No hay retos activos',
    completed: 'Completado',
    claimed: 'Reclamado',
    claim: 'Reclamar',
    inProgress: 'En Progreso',
    quests: 'Retos',

    // Post-game summary
    greetingExcellent: '🏆 ¡Imparable! ¡Las calles conocen tu nombre!',
    greetingGood: '🔥 ¡Buen trabajo! ¡Conoces bien esta ciudad!',
    greetingFair: '👍 ¡Nada mal! ¡Sigue explorando!',
    greetingDefault: '🗺️ ¡Sigue paseando! Cada calle tiene su historia.',
    copied: '¡Copiado!',
    backToMenu: 'Volver al menú',

    // News headlines (Mayor Jaume)
    newsHeadline1: 'ÚLTIMA HORA: Un vecino encuentra aparcamiento en Gràcia al primer intento.',
    newsHeadline2: "ALERTA: Un guiri pide 'Sangría' en una bodega tradicional.",
    newsHeadline3: 'ACTUALIZACIÓN: Los alquileres bajan un 0,00% este mes.',
    newsHeadline4: 'ESCÁNDALO: Una paloma roba un croissant entero a un turista.',

    // Landing page extras
    landingHeroTitle: 'Conviértete en el Local Definitivo',
    landingHeroSubtitle: 'Demuestra que conoces la verdadera Barcelona... calle a calle',
    landingSubtitle:
      'Navega la ciudad sin mapa. Gana Giuros, sube en la clasificación y celebra tu barrio.',
    signUpToPlay: 'Regístrate para Jugar',
    featureRankingsLabel: 'Clasificación',
    featureRankingsDesc: 'Compite con amigos y vecinos por el primer puesto.',
    featureFriendshipLabel: 'Amistad',
    featureFriendshipDesc: 'Reta a tus amigos y sigue su progreso.',
    featureRewardsLabel: 'Recompensas',
    featureRewardsDesc: 'Gana Giuros para personalizar tu perfil y desbloquear insignias.',
    chooseYourAllegiance: 'Elige tu Distrito',
    mayorLabel: 'ALCALDE',
    mayorReports: '🎙️ El Alcalde Jaume Informa',
    newsWord: 'NOTICIAS',
    privacyLink: 'Privacidad',
    termsLink: 'Términos',

    // Onboarding
    onboardingStep1Title: '¡Bienvenido al Barrio!',
    onboardingStep1Content:
      '¡Hola! Soy el Alcalde Jaume. Dirijo este distrito y busco a alguien que conozca estas calles.',
    onboardingStep2Title: 'El Reto',
    onboardingStep2Content:
      'Resaltaré una calle en el mapa. Tienes que identificarla. Haz zoom, muévete... no te pierdas.',
    onboardingStep3Title: 'Demuéstrate',
    onboardingStep3Content:
      'Selecciona el nombre correcto de la calle. ¡Rápido! Los turistas son lentos. Los locales son rápidos.',
    onboardingStep4Title: 'Gana Respeto (y Giuros)',
    onboardingStep4Content:
      '¡Anota puntos para ganar Giuros. Úsalos para comprar títulos elegantes y parecer importante, como yo!',
    onboardingStep5Title: 'Elige tu Distrito',
    onboardingStep5Content:
      'Cada barrio tiene su equipo. Únete a un distrito de Barcelona y compite colectivamente. ¿Cuál es el tuyo?',
    onboardingStep6Title: 'Sube en el Ranking',
    onboardingStep6Content:
      'Diario, semanal, histórico... el marcador no descansa. Demuestra quién conoce mejor estas calles.',
    onboardingStep7Title: 'Visita la Tienda',
    onboardingStep7Content:
      'Gasta tus Giuros en avatares, marcos y títulos exclusivos. Las primeras monedas las pongo yo. ¡No las malgastes!',
    districtManager: 'Gestor del Distrito',
    startPlaying: '¡Empezar a Jugar!',

    // Score tiers & summary extras
    scoreTierExpert: 'Experto Callejero',
    scoreTierLocal: 'Local de la Ciudad',
    scoreTierKnowledge: 'Conocedor Local',
    scoreTierWander: 'Sigue Explorando',
    scoreLabel: 'Puntuación',
    shareCuriosity: 'Compartir esta curiosidad',
    shareTextQuestion: '¿Conozco Barcelona?',
    shareStreakDays: 'días',
    justNow: 'Ahora mismo',
    today: 'Hoy',
    yesterday: 'Ayer',
    minuteSuffix: 'm atrás',
    hourSuffix: 'h atrás',
    daySuffix: 'd atrás',
    daysAgo: 'días atrás',
    weeksAgo: 'semanas atrás',
    scorePendingWarning:
      'La puntuación no se pudo guardar ahora — se enviará automáticamente la próxima vez que abras la app.',

    practiceMode: 'Modo práctica',
    keepPlaying: 'Seguir jugando',
    exitPractice: 'Salir',

    // 404
    notFoundTitle: 'Esta calle no existe',
    notFoundMessage:
      'Hasta los locales se pierden a veces. La página que buscabas se ha movido o nunca existió.',

    // Nav labels
    privacy: 'Privacidad',
    terms: 'Términos',

    // Legal
    backToHome: '← Volver al inicio',
    termsTitle: 'Términos de Servicio',
    termsSection1Title: '1. Aceptación de los Términos',
    termsSection1Content:
      'Al acceder y usar Girify, aceptas estar sujeto a estos Términos de Servicio.',
    termsSection2Title: '2. Conducta del Usuario',
    termsSection2Intro: 'Aceptas no:',
    termsSection2Item1: 'Usar el servicio para ningún propósito ilegal.',
    termsSection2Item2:
      'Intentar hacer trampa, explotar o manipular la mecánica del juego o las clasificaciones.',
    termsSection2Item3: 'Acosar o dañar a otros usuarios.',
    termsSection3Title: '3. Descargo de Responsabilidad',
    termsSection3Content:
      'El juego se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de errores en datos de mapas o interrupciones del servicio.',
    termsSection4Title: '4. Cambios en los Términos',
    termsSection4Content:
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado del servicio constituye la aceptación de los nuevos términos.',
    legalLastUpdated: 'Última actualización: enero de 2026',
    privacyTitle: 'Política de Privacidad',
    privacySection1Title: '1. Información que Recopilamos',
    privacySection1Intro: 'Recopilamos información mínima para ofrecer la experiencia Girify:',
    privacySection1Item1: 'Datos de autenticación (vía Google o Email) para proteger tu cuenta.',
    privacySection1Item2: 'Progreso del juego, puntuaciones y compras en la tienda.',
    privacySection1Item3: 'Análisis básicos para entender cómo se usa la aplicación.',
    privacySection2Title: '2. Cómo Usamos la Información',
    privacySection2Intro: 'Tus datos se usan únicamente para:',
    privacySection2Item1: 'Mantener tu perfil e historial de juego.',
    privacySection2Item2: 'Mostrar clasificaciones y rankings.',
    privacySection2Item3: 'Mejorar la mecánica y el contenido del juego.',
    privacySection3Title: '3. Seguridad de Datos',
    privacySection3Content:
      'Usamos Supabase para almacenar tus datos de forma segura. No vendemos tus datos personales a terceros.',
    privacySection4Title: '4. Contacto',
    privacySection4Content:
      'Si tienes preguntas sobre esta política, contáctanos en support@girify.app.',
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
    createAccountToTrack: 'Crea un compte per guardar les teves estadístiques',
    signInToContinue: 'Inicia sessió per continuar',
    orWithEmail: 'O amb email',
    oneLastStep: 'Un últim pas!',
    chooseDistrictToComplete: 'Si us plau tria el teu districte per completar el registre.',
    completeRegistration: 'Completar Registre',
    finalizing: 'Finalitzant...',
    firstName: 'Nom',
    lastName: 'Cognom',
    fillAllFields: 'Si us plau completa tots els camps incloent districte',
    sent: 'Enviat!',
    passwordMinLength: 'Mínim 6 caràcters',
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

    // Profile / Edit modal
    profile: 'Perfil',
    editProfile: 'Editar Perfil',
    saveChanges: 'Desar Canvis',
    chooseAvatar: 'Triar Avatar',
    chooseFrame: 'Triar Marc',
    getMoreAvatarsInShop: 'Aconsegueix més avatars a la Botiga →',
    defaultAvatar: 'Per defecte',
    noFrame: 'Cap',
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
    avatars: 'Avatars',
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
    imReady: 'ESTIC A PUNT!',
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
    rightsReserved: '© 2026 Girify. Tots els drets reservats.',
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
    loginToShop: 'Inicia sessió per accedir a la botiga i gastar els teus Giuros.',

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
    shapeTheFuture: 'MODELA EL FUTUR',
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
    howItWorks: 'Com Funciona',
    explore: 'Explora',
    exploreDesc:
      "Ressaltem un carrer aleatori de Barcelona al mapa. Fes zoom, desplaça't i investiga.",
    guess: 'Endevina',
    guessDesc: 'Tria el nom correcte entre 4 opcions. Coneixement local pur.',
    rankUp: 'Puja de Rang',
    rankUpDesc:
      'Guanya Giuros, compra millores i puja a la classificació diària. Converteix-te en llegenda.',
    dailyChallengeTitle: 'Repte Diari',
    dailyChallengeDesc:
      'Cada dia, 5 carrers nous. Competeix amb tota la ciutat pel primer lloc. Pots aconseguir 5/5?',
    buildStreaks: 'Manté Ratxes',
    buildStreaksDesc:
      'La constància és clau. Juga cada dia per mantenir la teva ratxa i guanyar el doble de Giuros.',
    rankUpTitle: 'Puja de Rang',
    rankUpFeatureDesc:
      'Puja a la classificació local. Compara el teu nivell amb el dels teus veïns.',
    earnAndCustomize: 'Guanya i Personalitza',
    earnAndCustomizeDesc:
      'Aconsegueix Giuros per desbloquejar insígnies, marcs i títols exclusius. Mostra la teva experiència amb estil.',
    joinPlayers: 'Uneix-te a',
    playersMastering: 'jugadors dominant la ciutat',

    // New additions
    proveLocal: 'Demostra que ets local',
    cityCuriosity: 'Curiositat de la Ciutat',
    didYouKnow: 'Sabies que...?',
    todaysChallenge: "Repte d'Avui",
    pts: 'pts',
    shareAndEarn: 'Compartir i Guanyar',
    masterSelectedStreets: 'Domina els Carrers Seleccionats!',
    district: 'Districte',
    selectDistrict: 'Selecciona Districte',
    clansTitle: 'Clans de Districte',
    joinClan: 'Uneix-te a un Clan',
    clanLeaderboard: 'Rànquing de Districtes',
    joining: 'Unint-se...',
    confirmJoinTeam: 'Confirmar i Unir-se',
    districtUpdateError: 'Error en actualitzar districte. Torna-ho a provar.',
    joinATeam: 'Uneix-te a un Equip!',
    teamRequiredDetails:
      'Tria el teu districte de Barcelona i competeix amb el teu equip a la classificació mundial!',
    districtTeams: 'Equips de Districte',
    refreshData: 'Actualitzar Dades',
    loadingTeamStats: 'Carregant estadístiques...',
    members: 'Membres',
    totalScore: 'Puntuació Total',
    avgScore: 'Puntuació mitjana',

    team: 'Equip',

    // Quests
    noActiveQuests: 'No hi ha reptes actius',
    completed: 'Completat',
    claimed: 'Reclamat',
    claim: 'Reclamar',
    inProgress: 'En Progrés',
    quests: 'Reptes',

    // Post-game summary
    greetingExcellent: '🏆 Imparable! Els carrers coneixen el teu nom!',
    greetingGood: '🔥 Molt bé! Coneixes bé aquesta ciutat!',
    greetingFair: '👍 No està malament! Segueix explorant!',
    greetingDefault: '🗺️ Segueix passejant! Cada carrer té la seva història.',
    copied: 'Copiat!',
    backToMenu: 'Tornar al menú',

    // News headlines (Mayor Jaume)
    newsHeadline1: 'ÚLTIMA HORA: Un veí troba aparcament a Gràcia al primer intent.',
    newsHeadline2: "ALERTA: Un guiri demana 'Sangria' en una bodega tradicional.",
    newsHeadline3: 'ACTUALITZACIÓ: Els lloguers baixen un 0,00% aquest mes.',
    newsHeadline4: 'ESCÀNDOL: Un colom roba un croissant sencer a un turista.',

    // Landing page extras
    landingHeroTitle: 'Converteix-te en el Local Definitiu',
    landingHeroSubtitle: 'Demostra que coneixes la veritable Barcelona... carrer a carrer',
    landingSubtitle:
      'Navega la ciutat sense mapa. Guanya Giuros, puja a la classificació i celebra el teu barri.',
    signUpToPlay: "Registra't per Jugar",
    featureRankingsLabel: 'Rànquings',
    featureRankingsDesc: 'Competeix amb amics i veïns pel primer lloc.',
    featureFriendshipLabel: 'Amistat',
    featureFriendshipDesc: 'Repte els teus amics i segueix el seu progrés.',
    featureRewardsLabel: 'Recompenses',
    featureRewardsDesc: 'Guanya Giuros per personalitzar el teu perfil i desbloquejar insígnies.',
    chooseYourAllegiance: 'Tria el teu Districte',
    mayorLabel: 'ALCALDE',
    mayorReports: "🎙️ L'Alcalde Jaume Informa",
    newsWord: 'NOTÍCIES',
    privacyLink: 'Privacitat',
    termsLink: 'Condicions',

    // Onboarding
    onboardingStep1Title: 'Benvingut al Barri!',
    onboardingStep1Content:
      "Hola! Soc l'Alcalde Jaume. Dirigeixo aquest districte i busco algú que conegui aquests carrers.",
    onboardingStep2Title: 'El Repte',
    onboardingStep2Content:
      "Ressaltaré un carrer al mapa. Has d'identificar-lo. Fes zoom, mou-te... no et perdis.",
    onboardingStep3Title: 'Demostra el que Vals',
    onboardingStep3Content:
      'Selecciona el nom correcte del carrer. Ràpid! Els turistes són lents. Els locals són ràpids.',
    onboardingStep4Title: 'Guanya Respecte (i Giuros)',
    onboardingStep4Content:
      "Puntua per guanyar Giuros. Usa'ls per comprar títols elegants i semblar important, com jo!",
    onboardingStep5Title: 'Tria el teu Districte',
    onboardingStep5Content:
      'Cada barri té el seu equip. Uneix-te a un districte de Barcelona i competeix col·lectivament. On són les teves lleialitats?',
    onboardingStep6Title: 'Puja al Rànquing',
    onboardingStep6Content:
      'Diari, setmanal, històric... el marcador no dorm. Demostra qui coneix millor aquests carrers.',
    onboardingStep7Title: 'Visita la Botiga',
    onboardingStep7Content:
      'Gasta els teus Giuros en avatars, marcs i títols exclusius. Les primeres monedes les poso jo. No les malbaratis!',
    districtManager: 'Gestor del Districte',
    startPlaying: 'Comença a Jugar!',

    // Score tiers & summary extras
    scoreTierExpert: 'Expert dels Carrers',
    scoreTierLocal: 'Local de la Ciutat',
    scoreTierKnowledge: 'Coneixedor Local',
    scoreTierWander: 'Segueix Explorant',
    scoreLabel: 'Puntuació',
    shareCuriosity: 'Compartir aquesta curiositat',
    shareTextQuestion: 'Conec Barcelona?',
    shareStreakDays: 'dies',
    justNow: 'Ara mateix',
    today: 'Avui',
    yesterday: 'Ahir',
    minuteSuffix: 'm fa',
    hourSuffix: 'h fa',
    daySuffix: 'd fa',
    daysAgo: 'dies fa',
    weeksAgo: 'setmanes fa',
    scorePendingWarning:
      "La puntuació no s'ha pogut guardar ara — s'enviarà automàticament la propera vegada que obris l'app.",

    practiceMode: 'Mode pràctica',
    keepPlaying: 'Continuar jugant',
    exitPractice: 'Sortir',

    // 404
    notFoundTitle: 'Aquest carrer no existeix',
    notFoundMessage:
      "Fins els locals es perden de vegades. La pàgina que buscaves s'ha mogut o mai va existir.",

    // Nav labels
    privacy: 'Privadesa',
    terms: 'Termes',

    // Legal
    backToHome: "← Tornar a l'inici",
    termsTitle: 'Condicions de Servei',
    termsSection1Title: '1. Acceptació de les Condicions',
    termsSection1Content:
      'En accedir i usar Girify, acceptes estar subjecte a aquestes Condicions de Servei.',
    termsSection2Title: "2. Conducta de l'Usuari",
    termsSection2Intro: 'Acceptes no:',
    termsSection2Item1: 'Usar el servei per a cap propòsit il·legal.',
    termsSection2Item2:
      'Intentar fer trampa, explotar o manipular la mecànica del joc o les classificacions.',
    termsSection2Item3: 'Assetjar o perjudicar altres usuaris.',
    termsSection3Title: '3. Exempció de Responsabilitat',
    termsSection3Content:
      'El joc es proporciona "tal qual" sense garanties de cap tipus. No som responsables d\'errors en dades de mapes o interrupcions del servei.',
    termsSection4Title: '4. Canvis a les Condicions',
    termsSection4Content:
      "Ens reservem el dret de modificar aquestes condicions en qualsevol moment. L'ús continuat del servei constitueix l'acceptació de les noves condicions.",
    legalLastUpdated: 'Última actualització: gener de 2026',
    privacyTitle: 'Política de Privacitat',
    privacySection1Title: '1. Informació que Recollim',
    privacySection1Intro: "Recollim informació mínima per oferir l'experiència Girify:",
    privacySection1Item1: "Dades d'autenticació (via Google o Email) per protegir el teu compte.",
    privacySection1Item2: 'Progrés del joc, puntuacions i compres a la botiga.',
    privacySection1Item3: "Anàlisis bàsiques per entendre com s'usa l'aplicació.",
    privacySection2Title: '2. Com Usem la Informació',
    privacySection2Intro: "Les teves dades s'usen únicament per:",
    privacySection2Item1: 'Mantenir el teu perfil i historial de joc.',
    privacySection2Item2: 'Mostrar classificacions i rànquings.',
    privacySection2Item3: 'Millorar la mecànica i el contingut del joc.',
    privacySection3Title: '3. Seguretat de Dades',
    privacySection3Content:
      'Usem Supabase per emmagatzemar les teves dades de forma segura. No venem les teves dades personals a tercers.',
    privacySection4Title: '4. Contacte',
    privacySection4Content:
      "Si tens preguntes sobre aquesta política, contacta'ns a support@girify.app.",
  },
};

export const getTranslation = (lang: string, key: string): string => {
  return translations[lang]?.[key] || translations?.['en']?.[key] || key;
};

export default translations;
