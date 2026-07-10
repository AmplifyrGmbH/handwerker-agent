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
  inhaber_name: string | null;
  farbe_primary: string | null;
  hat_logo: boolean | null;
  logo_url: string | null;
  firmenprofil: string | null;
  slug: string | null;
  landing_url: string | null;
  outreach_status: string | null;
  email_status: string;
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
  typ: string;
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

export const BRANCHEN = ["Maler", "Elektriker", "Schreiner", "Sanitär", "Dachdecker"];

export const STATUS_LABELS: Record<string, string> = {
  entdeckt: "Entdeckt",
  extrahiert: "Extrahiert",
  landing_generiert: "Landing bereit",
  kontaktiert: "Kontaktiert",
  fehler: "Fehler",
  kein_website: "Kein Website",
};

export const STATUS_COLORS: Record<string, string> = {
  entdeckt: "bg-blue-100 text-blue-800",
  extrahiert: "bg-yellow-100 text-yellow-800",
  landing_generiert: "bg-purple-100 text-purple-800",
  kontaktiert: "bg-green-100 text-green-800",
  fehler: "bg-red-100 text-red-800",
  kein_website: "bg-gray-100 text-gray-600",
};
