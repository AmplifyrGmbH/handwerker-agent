export interface Job {
  id: number;
  typ: string;
  status: "laufend" | "abgeschlossen" | "fehler";
  total: number | null;
  verarbeitet: number;
  fehler: number;
  log: string | null;
  gestartet_am: string | null;
  abgeschlossen_am: string | null;
}

export interface Betrieb {
  place_id: string;
  name: string;
  name_anzeige: string | null;
  adresse: string | null;
  plz: string | null;
  ort: string | null;
  kanton: string | null;
  telefon: string | null;
  email: string | null;
  website_url: string | null;
  website_domain: string | null;
  keine_website: boolean;
  google_rating: number | null;
  google_anzahl: number | null;
  branche: string | null;
  status: string;
  lead_status: string;
  inhaber_name: string | null;
  farbe_primary: string | null;
  hat_logo: boolean | null;
  logo_url: string | null;
  firmenprofil: string | null;
  slug: string | null;
  landing_url: string | null;
  agent: string | null;
  letzte_notiz: string | null;
  letzte_notiz_am: string | null;
  optout: boolean;
  fehler_log: string | null;
  entdeckt_am: string | null;
  extrahiert_am: string | null;
  landing_generiert_am: string | null;
  letzter_kontakt_am: string | null;
  kontaktversuche?: Kontaktversuch[];
}

export interface Kontaktversuch {
  id: number;
  typ: string; // "anruf" | "email_demo"
  notizen: string | null;
  callback_datum: string | null;
  email_adresse: string | null;
  email_subject: string | null;
  gesendet_am: string | null;
}

export interface BetriebeListe {
  total: number;
  offset: number;
  limit: number;
  items: Betrieb[];
}

export const BRANCHEN = [
  "Sanitär Heizung Lüftung",
  "Elektriker",
  "Maler",
  "Gipser",
  "Schreiner",
  "Metallbau",
  "Bodenleger",
  "Plattenleger",
  "Dachdecker",
  "Gärtner",
  "Solarinstallateur",
  "Reinigung",
];

export const AGENTS = ["Timo", "David", "Sinan"] as const;
export type Agent = typeof AGENTS[number];

// Pipeline-Status
export const STATUS_LABELS: Record<string, string> = {
  entdeckt: "Entdeckt",
  extrahiert: "Extrahiert",
  landing_generiert: "Demo bereit",
  fehler: "Fehler",
  kein_website: "Kein Website",
};

export const STATUS_COLORS: Record<string, string> = {
  entdeckt: "bg-blue-100 text-blue-800",
  extrahiert: "bg-yellow-100 text-yellow-800",
  landing_generiert: "bg-purple-100 text-purple-800",
  fehler: "bg-red-100 text-red-800",
  kein_website: "bg-gray-100 text-gray-600",
};

// CRM Lead-Status
export const LEAD_STATUS_LABELS: Record<string, string> = {
  nicht_angerufen: "Nicht angerufen",
  nicht_erreicht: "Nicht erreicht",
  callback: "Callback",
  demo_gewuenscht: "Demo gewünscht",
  kein_interesse: "Kein Interesse",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  nicht_angerufen: "bg-gray-100 text-gray-600",
  nicht_erreicht: "bg-orange-100 text-orange-700",
  callback: "bg-yellow-100 text-yellow-700",
  demo_gewuenscht: "bg-blue-100 text-blue-800",
  kein_interesse: "bg-red-100 text-red-700",
};

export const ALL_LEAD_STATUSES = [
  "nicht_angerufen",
  "nicht_erreicht",
  "callback",
  "demo_gewuenscht",
  "kein_interesse",
] as const;
