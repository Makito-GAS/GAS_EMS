import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Language translations
const translations = {
  en: {
    // Common
    dashboard: 'Dashboard',
    tasks: 'My Tasks',
    schedule: 'Schedule',
    profile: 'Profile',
    settings: 'Settings',
    signOut: 'Sign Out',
    
    // Settings
    customizeExperience: 'Customize your experience',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    notifications: 'Notifications',
    enabled: 'Enabled',
    disabled: 'Disabled',
    language: 'Language',
    selectLanguage: 'Select your preferred language',
    
    // Tasks
    addTask: 'Add Task',
    taskTitle: 'Task Title',
    taskDescription: 'Description',
    dueDate: 'Due Date',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    status: 'Status',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    progress: 'Progress',
    delete: 'Delete',
    
    // Schedule
    today: 'Today',
    upcoming: 'Upcoming',
    noEvents: 'No events scheduled',
    
    // Profile
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    department: 'Department',
    saveChanges: 'Save Changes',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    overview: 'Overview',
    recentActivity: 'Recent Activity',
    taskOverview: 'Task Overview',
    upcomingSchedule: 'Upcoming Schedule',
    totalTasks: 'Total Tasks',
    completedTasks: 'Completed Tasks',
    pendingTasks: 'Pending Tasks',
  },
  es: {
    // Common
    dashboard: 'Panel de Control',
    tasks: 'Mis Tareas',
    schedule: 'Horario',
    profile: 'Perfil',
    settings: 'Configuración',
    signOut: 'Cerrar Sesión',
    
    // Settings
    customizeExperience: 'Personaliza tu experiencia',
    theme: 'Tema',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    notifications: 'Notificaciones',
    enabled: 'Activado',
    disabled: 'Desactivado',
    language: 'Idioma',
    selectLanguage: 'Selecciona tu idioma preferido',
    
    // Tasks
    addTask: 'Agregar Tarea',
    taskTitle: 'Título de la Tarea',
    taskDescription: 'Descripción',
    dueDate: 'Fecha de Vencimiento',
    priority: 'Prioridad',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    status: 'Estado',
    pending: 'Pendiente',
    inProgress: 'En Progreso',
    completed: 'Completada',
    progress: 'Progreso',
    delete: 'Eliminar',
    
    // Schedule
    today: 'Hoy',
    upcoming: 'Próximos',
    noEvents: 'No hay eventos programados',
    
    // Profile
    personalInfo: 'Información Personal',
    name: 'Nombre',
    email: 'Correo Electrónico',
    role: 'Rol',
    department: 'Departamento',
    saveChanges: 'Guardar Cambios',
    
    // Dashboard
    welcomeBack: 'Bienvenido de nuevo',
    overview: 'Resumen',
    recentActivity: 'Actividad Reciente',
    taskOverview: 'Resumen de Tareas',
    upcomingSchedule: 'Horario Próximo',
    totalTasks: 'Total de Tareas',
    completedTasks: 'Tareas Completadas',
    pendingTasks: 'Tareas Pendientes',
  },
  fr: {
    // Common
    dashboard: 'Tableau de Bord',
    tasks: 'Mes Tâches',
    schedule: 'Emploi du Temps',
    profile: 'Profil',
    settings: 'Paramètres',
    signOut: 'Déconnexion',
    
    // Settings
    customizeExperience: 'Personnalisez votre expérience',
    theme: 'Thème',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    notifications: 'Notifications',
    enabled: 'Activé',
    disabled: 'Désactivé',
    language: 'Langue',
    selectLanguage: 'Sélectionnez votre langue préférée',
    
    // Tasks
    addTask: 'Ajouter une Tâche',
    taskTitle: 'Titre de la Tâche',
    taskDescription: 'Description',
    dueDate: 'Date d\'échéance',
    priority: 'Priorité',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
    status: 'Statut',
    pending: 'En Attente',
    inProgress: 'En Cours',
    completed: 'Terminée',
    progress: 'Progression',
    delete: 'Supprimer',
    
    // Schedule
    today: 'Aujourd\'hui',
    upcoming: 'À Venir',
    noEvents: 'Aucun événement prévu',
    
    // Profile
    personalInfo: 'Informations Personnelles',
    name: 'Nom',
    email: 'E-mail',
    role: 'Rôle',
    department: 'Département',
    saveChanges: 'Enregistrer les Modifications',
    
    // Dashboard
    welcomeBack: 'Bon retour',
    overview: 'Aperçu',
    recentActivity: 'Activité Récente',
    taskOverview: 'Aperçu des Tâches',
    upcomingSchedule: 'Emploi du Temps à Venir',
    totalTasks: 'Total des Tâches',
    completedTasks: 'Tâches Terminées',
    pendingTasks: 'Tâches en Attente',
  },
  de: {
    // Common
    dashboard: 'Dashboard',
    tasks: 'Meine Aufgaben',
    schedule: 'Zeitplan',
    profile: 'Profil',
    settings: 'Einstellungen',
    signOut: 'Abmelden',
    
    // Settings
    customizeExperience: 'Passen Sie Ihre Erfahrung an',
    theme: 'Thema',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    notifications: 'Benachrichtigungen',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    language: 'Sprache',
    selectLanguage: 'Wählen Sie Ihre bevorzugte Sprache',
    
    // Tasks
    addTask: 'Aufgabe Hinzufügen',
    taskTitle: 'Aufgabentitel',
    taskDescription: 'Beschreibung',
    dueDate: 'Fälligkeitsdatum',
    priority: 'Priorität',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    status: 'Status',
    pending: 'Ausstehend',
    inProgress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    progress: 'Fortschritt',
    delete: 'Löschen',
    
    // Schedule
    today: 'Heute',
    upcoming: 'Kommende',
    noEvents: 'Keine Termine geplant',
    
    // Profile
    personalInfo: 'Persönliche Informationen',
    name: 'Name',
    email: 'E-Mail',
    role: 'Rolle',
    department: 'Abteilung',
    saveChanges: 'Änderungen Speichern',
    
    // Dashboard
    welcomeBack: 'Willkommen zurück',
    overview: 'Übersicht',
    recentActivity: 'Letzte Aktivität',
    taskOverview: 'Aufgabenübersicht',
    upcomingSchedule: 'Kommender Zeitplan',
    totalTasks: 'Gesamtaufgaben',
    completedTasks: 'Abgeschlossene Aufgaben',
    pendingTasks: 'Ausstehende Aufgaben',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 