
export interface Prize {
    premio: string;
    vincita: boolean;
    valore: number;
    index?: number; // Added for easier identification
}

export interface GameConfig {
    nomeDellaRuota: string;
    numeroSpicchi: number;
    tema: string;
    numeroVinciteGiornaliere: number;
    numeroGiocate: number;
    premi: Prize[];
    active?: boolean; // Global kill switch
    adminEmail?: string; // Email to notify for new registrations
    winningPercentage?: number; // Probability of winning (0-100)
    emailProvider?: 'emailjs' | 'smtp';
    smtpConfig?: {
        host: string;
        port: number;
        secure: boolean; // true for 465, false for 587
        user: string;
        pass: string;
        fromName: string;
        fromEmail: string;
    };
    emailJsConfig?: {
        serviceId: string;
        templateId: string;
        publicKey: string;
    };
}

export interface GameState {
    dailyPlays: number;
    dailyWins: number;
}


export interface Prize {
    premio: string;
    vincita: boolean;
    valore: number;
    index?: number; // Added for easier identification
}

export interface GameConfig {
    nomeDellaRuota: string;
    numeroSpicchi: number;
    tema: string;
    numeroVinciteGiornaliere: number;
    numeroGiocate: number;
    premi: Prize[];
    active?: boolean; // Global kill switch
    adminEmail?: string; // Email to notify for new registrations
    winningPercentage?: number; // Probability of winning (0-100)
    emailProvider?: 'emailjs' | 'smtp';
    smtpConfig?: {
        host: string;
        port: number;
        secure: boolean; // true for 465, false for 587
        user: string;
        pass: string;
        fromName: string;
        fromEmail: string;
    };
    emailJsConfig?: {
        serviceId: string;
        templateId: string;
        publicKey: string;
    };
}

export interface GameState {
    dailyPlays: number;
    dailyWins: number;
}

export interface PlayRecord {
    data: string; // YYYY-MM-DD
    risultato: string;
    vincita: boolean;
}

export interface User {
    user: string;
    role?: 'admin' | 'user';
    // Password should not be stored in client-side state after login
    // but is needed for the initial data structure.
    password?: string;
    email?: string; // Added for password recovery
    nome?: string;
    cognome?: string;
    telefono?: string;
    citta?: string;
    gdprConsent?: boolean;
    gdprConsentDate?: string;
    history: PlayRecord[];
}

export interface PlayLog {
    user: string;
    data: string; // YYYY-MM-DD
    ora: string; // HH:MM:SS
    risultato: string;
    vincita: boolean;
    riscosso?: boolean; // true if prize has been claimed (only for winning plays)
    winCode?: string; // Unique code for winning plays
}

export interface UserRequest {
    id?: string;
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
    citta: string;
    creato: boolean;
    dataRichiesta: string; // ISO date-time string
    username?: string; // Username if created
    gdprConsent?: boolean;
    gdprConsentDate?: string;
}
