import { createContext, useContext, useState, useCallback } from 'react';

export type Locale = 'en' | 'nl' | 'de';

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export interface Translations {
  // Header
  header_tagline: string;
  header_e2e: string;

  // Create page
  create_title: string;
  create_subtitle: string;
  create_secret_label: string;
  create_secret_placeholder: string;
  create_strength_weak: string;
  create_strength_fair: string;
  create_strength_good: string;
  create_strength_strong: string;
  create_generator_toggle: string;
  create_generator_length: string;
  create_generator_upper: string;
  create_generator_lower: string;
  create_generator_numbers: string;
  create_generator_symbols: string;
  create_generator_btn: string;
  create_label_label: string;
  create_label_optional: string;
  create_label_placeholder: string;
  create_expiry_label: string;
  create_expiry_24h: string;
  create_expiry_1w: string;
  create_expiry_2w: string;
  create_expiry_30d: string;
  create_maxviews_label: string;
  create_passphrase_toggle: string;
  create_passphrase_placeholder: string;
  create_error_empty: string;
  create_error_passphrase: string;
  create_error_generic: string;
  create_submit: string;
  create_encrypting: string;
  create_e2e_note: string;

  // Success state
  success_title: string;
  success_subtitle_one: string;
  success_subtitle_many: string;
  success_link_label: string;
  success_copy: string;
  success_copied: string;
  success_expires: string;
  success_max_views: string;
  success_protected: string;
  success_yes: string;
  success_no: string;
  success_another: string;

  // View page
  view_loading: string;
  view_passphrase_title: string;
  view_passphrase_subtitle: string;
  view_passphrase_label: string;
  view_passphrase_placeholder: string;
  view_passphrase_error: string;
  view_passphrase_submit: string;
  view_passphrase_unlocking: string;
  view_confirm_title: string;
  view_confirm_subtitle: string;
  view_confirm_labeled: string;
  view_confirm_views_remaining: string;
  view_confirm_expires: string;
  view_confirm_reveal: string;
  view_confirm_cancel: string;
  view_revealed_title: string;
  view_revealed_last: string;
  view_revealed_remaining: string;
  view_revealed_content_label: string;
  view_copy: string;
  view_copied: string;
  view_close: string;

  // Status screens
  status_not_found_title: string;
  status_not_found_desc: string;
  status_expired_title: string;
  status_expired_desc: string;
  status_consumed_title: string;
  status_consumed_desc: string;
  status_error_title: string;
  status_error_desc: string;
  status_create_new: string;

  // 404
  not_found_title: string;
  not_found_desc: string;
  not_found_home: string;

  // Footer
  footer_tagline: string;
}

const en: Translations = {
  header_tagline: 'Password Sharing Platform',
  header_e2e: 'End-to-end encrypted',

  create_title: 'New secret link',
  create_subtitle: "Enter a password or any sensitive text. We'll generate a secure one-time link you can share. The secret is encrypted in your browser — we never see the plaintext.",
  create_secret_label: 'Secret',
  create_secret_placeholder: 'Enter a password, API key, or any sensitive text…',
  create_strength_weak: 'Weak',
  create_strength_fair: 'Fair',
  create_strength_good: 'Good',
  create_strength_strong: 'Strong',
  create_generator_toggle: 'Password generator',
  create_generator_length: 'Length',
  create_generator_upper: 'Uppercase',
  create_generator_lower: 'Lowercase',
  create_generator_numbers: 'Numbers',
  create_generator_symbols: 'Symbols',
  create_generator_btn: 'Generate password',
  create_label_label: 'Label',
  create_label_optional: '(optional)',
  create_label_placeholder: 'e.g. Production DB password, WiFi key…',
  create_expiry_label: 'Expires after',
  create_expiry_24h: '24 hours',
  create_expiry_1w: '1 week',
  create_expiry_2w: '2 weeks',
  create_expiry_30d: '30 days',
  create_maxviews_label: 'Max views',
  create_passphrase_toggle: 'Require passphrase to view',
  create_passphrase_placeholder: 'Enter a passphrase the recipient will need…',
  create_error_empty: 'Please enter a secret.',
  create_error_passphrase: 'Please enter a passphrase or disable passphrase protection.',
  create_error_generic: 'Something went wrong.',
  create_submit: 'Generate secure link',
  create_encrypting: 'Encrypting…',
  create_e2e_note: 'End-to-end encrypted. The server never sees your plaintext.',

  success_title: 'Secret link created',
  success_subtitle_one: 'Share this link. It will self-destruct after one view.',
  success_subtitle_many: 'Share this link. It will self-destruct after {n} views.',
  success_link_label: 'Shareable link',
  success_copy: 'Copy link',
  success_copied: 'Copied!',
  success_expires: 'Expires in',
  success_max_views: 'Max views',
  success_protected: 'Protected',
  success_yes: 'Yes',
  success_no: 'No',
  success_another: 'Create another secret',

  view_loading: 'Fetching secret…',
  view_passphrase_title: 'Passphrase required',
  view_passphrase_subtitle: 'This secret is protected. Enter the passphrase to unlock it.',
  view_passphrase_label: 'Passphrase',
  view_passphrase_placeholder: 'Enter the passphrase…',
  view_passphrase_error: 'Incorrect passphrase. Please try again.',
  view_passphrase_submit: 'Unlock secret',
  view_passphrase_unlocking: 'Unlocking…',
  view_confirm_title: 'Ready to reveal',
  view_confirm_subtitle: 'Once you view this secret, this access will be counted. After reaching the maximum number of views, the link will be permanently destroyed.',
  view_confirm_labeled: 'This secret is labeled',
  view_confirm_views_remaining: 'Views remaining',
  view_confirm_expires: 'Expires',
  view_confirm_reveal: 'Reveal secret',
  view_confirm_cancel: 'Cancel',
  view_revealed_title: 'Secret revealed',
  view_revealed_last: 'This was the last view. The link has now been permanently destroyed.',
  view_revealed_remaining: 'Copy this secret. Closing this page does not destroy remaining views.',
  view_revealed_content_label: 'Secret content',
  view_copy: 'Copy to clipboard',
  view_copied: 'Copied to clipboard!',
  view_close: 'Close and leave',

  status_not_found_title: 'Secret not found',
  status_not_found_desc: 'This link does not exist or has an invalid format.',
  status_expired_title: 'Link expired',
  status_expired_desc: 'This secret has passed its expiry date and has been permanently deleted.',
  status_consumed_title: 'Secret already viewed',
  status_consumed_desc: 'This link has already been accessed the maximum number of times and is no longer available.',
  status_error_title: 'Decryption failed',
  status_error_desc: 'The link appears to be corrupted or the encryption key is missing.',
  status_create_new: 'Create a new secret',

  not_found_title: 'Page not found',
  not_found_desc: "The page you're looking for doesn't exist.",
  not_found_home: 'Go home',

  footer_tagline: 'Zero-knowledge encryption',
};

const nl: Translations = {
  header_tagline: 'Wachtwoord Deelplatform',
  header_e2e: 'End-to-end versleuteld',

  create_title: 'Nieuwe geheime link',
  create_subtitle: 'Voer een wachtwoord of gevoelige tekst in. We genereren een beveiligde eenmalige link die je kunt delen. Het geheim wordt versleuteld in je browser — wij zien nooit de originele tekst.',
  create_secret_label: 'Geheim',
  create_secret_placeholder: 'Voer een wachtwoord, API-sleutel of gevoelige tekst in…',
  create_strength_weak: 'Zwak',
  create_strength_fair: 'Matig',
  create_strength_good: 'Goed',
  create_strength_strong: 'Sterk',
  create_generator_toggle: 'Wachtwoordgenerator',
  create_generator_length: 'Lengte',
  create_generator_upper: 'Hoofdletters',
  create_generator_lower: 'Kleine letters',
  create_generator_numbers: 'Cijfers',
  create_generator_symbols: 'Symbolen',
  create_generator_btn: 'Genereer wachtwoord',
  create_label_label: 'Label',
  create_label_optional: '(optioneel)',
  create_label_placeholder: 'bijv. Productie DB wachtwoord, WiFi-sleutel…',
  create_expiry_label: 'Verloopt na',
  create_expiry_24h: '24 uur',
  create_expiry_1w: '1 week',
  create_expiry_2w: '2 weken',
  create_expiry_30d: '30 dagen',
  create_maxviews_label: 'Max. weergaven',
  create_passphrase_toggle: 'Wachtwoordzin vereisen om te bekijken',
  create_passphrase_placeholder: 'Voer een wachtwoordzin in die de ontvanger nodig heeft…',
  create_error_empty: 'Voer een geheim in.',
  create_error_passphrase: 'Voer een wachtwoordzin in of schakel de beveiliging uit.',
  create_error_generic: 'Er is iets misgegaan.',
  create_submit: 'Beveiligde link genereren',
  create_encrypting: 'Versleutelen…',
  create_e2e_note: 'End-to-end versleuteld. De server ziet nooit je originele tekst.',

  success_title: 'Geheime link aangemaakt',
  success_subtitle_one: 'Deel deze link. Hij vernietigt zichzelf na één weergave.',
  success_subtitle_many: 'Deel deze link. Hij vernietigt zichzelf na {n} weergaven.',
  success_link_label: 'Deelbare link',
  success_copy: 'Link kopiëren',
  success_copied: 'Gekopieerd!',
  success_expires: 'Verloopt over',
  success_max_views: 'Max. weergaven',
  success_protected: 'Beveiligd',
  success_yes: 'Ja',
  success_no: 'Nee',
  success_another: 'Nieuw geheim aanmaken',

  view_loading: 'Geheim ophalen…',
  view_passphrase_title: 'Wachtwoordzin vereist',
  view_passphrase_subtitle: 'Dit geheim is beveiligd. Voer de wachtwoordzin in om het te ontgrendelen.',
  view_passphrase_label: 'Wachtwoordzin',
  view_passphrase_placeholder: 'Voer de wachtwoordzin in…',
  view_passphrase_error: 'Onjuiste wachtwoordzin. Probeer het opnieuw.',
  view_passphrase_submit: 'Geheim ontgrendelen',
  view_passphrase_unlocking: 'Ontgrendelen…',
  view_confirm_title: 'Klaar om te onthullen',
  view_confirm_subtitle: 'Zodra je dit geheim bekijkt, wordt deze toegang geteld. Na het bereiken van het maximale aantal weergaven wordt de link permanent vernietigd.',
  view_confirm_labeled: 'Dit geheim heeft het label',
  view_confirm_views_remaining: 'Weergaven resterend',
  view_confirm_expires: 'Verloopt',
  view_confirm_reveal: 'Geheim onthullen',
  view_confirm_cancel: 'Annuleren',
  view_revealed_title: 'Geheim onthuld',
  view_revealed_last: 'Dit was de laatste weergave. De link is nu permanent vernietigd.',
  view_revealed_remaining: 'Kopieer dit geheim. Het sluiten van deze pagina vernietigt resterende weergaven niet.',
  view_revealed_content_label: 'Geheime inhoud',
  view_copy: 'Naar klembord kopiëren',
  view_copied: 'Naar klembord gekopieerd!',
  view_close: 'Sluiten en verlaten',

  status_not_found_title: 'Geheim niet gevonden',
  status_not_found_desc: 'Deze link bestaat niet of heeft een ongeldig formaat.',
  status_expired_title: 'Link verlopen',
  status_expired_desc: 'Dit geheim is verlopen en permanent verwijderd.',
  status_consumed_title: 'Geheim al bekeken',
  status_consumed_desc: 'Deze link is al het maximale aantal keren bekeken en is niet meer beschikbaar.',
  status_error_title: 'Ontsleuteling mislukt',
  status_error_desc: 'De link lijkt beschadigd of de versleutelingssleutel ontbreekt.',
  status_create_new: 'Nieuw geheim aanmaken',

  not_found_title: 'Pagina niet gevonden',
  not_found_desc: 'De pagina die je zoekt bestaat niet.',
  not_found_home: 'Naar startpagina',

  footer_tagline: 'Zero-knowledge versleuteling',
};

const de: Translations = {
  header_tagline: 'Passwort-Sharing-Plattform',
  header_e2e: 'Ende-zu-Ende-verschlüsselt',

  create_title: 'Neuer geheimer Link',
  create_subtitle: 'Gib ein Passwort oder sensiblen Text ein. Wir generieren einen sicheren Einmal-Link zum Teilen. Das Geheimnis wird in deinem Browser verschlüsselt — wir sehen niemals den Klartext.',
  create_secret_label: 'Geheimnis',
  create_secret_placeholder: 'Passwort, API-Schlüssel oder sensiblen Text eingeben…',
  create_strength_weak: 'Schwach',
  create_strength_fair: 'Mäßig',
  create_strength_good: 'Gut',
  create_strength_strong: 'Stark',
  create_generator_toggle: 'Passwort-Generator',
  create_generator_length: 'Länge',
  create_generator_upper: 'Großbuchstaben',
  create_generator_lower: 'Kleinbuchstaben',
  create_generator_numbers: 'Zahlen',
  create_generator_symbols: 'Sonderzeichen',
  create_generator_btn: 'Passwort generieren',
  create_label_label: 'Bezeichnung',
  create_label_optional: '(optional)',
  create_label_placeholder: 'z. B. Produktions-DB-Passwort, WLAN-Schlüssel…',
  create_expiry_label: 'Läuft ab nach',
  create_expiry_24h: '24 Stunden',
  create_expiry_1w: '1 Woche',
  create_expiry_2w: '2 Wochen',
  create_expiry_30d: '30 Tage',
  create_maxviews_label: 'Max. Aufrufe',
  create_passphrase_toggle: 'Passphrase zum Anzeigen erforderlich',
  create_passphrase_placeholder: 'Passphrase eingeben, die der Empfänger benötigt…',
  create_error_empty: 'Bitte ein Geheimnis eingeben.',
  create_error_passphrase: 'Bitte eine Passphrase eingeben oder den Schutz deaktivieren.',
  create_error_generic: 'Etwas ist schiefgelaufen.',
  create_submit: 'Sicheren Link generieren',
  create_encrypting: 'Verschlüsseln…',
  create_e2e_note: 'Ende-zu-Ende-verschlüsselt. Der Server sieht niemals deinen Klartext.',

  success_title: 'Geheimer Link erstellt',
  success_subtitle_one: 'Teile diesen Link. Er zerstört sich nach einer Ansicht selbst.',
  success_subtitle_many: 'Teile diesen Link. Er zerstört sich nach {n} Ansichten selbst.',
  success_link_label: 'Teilbarer Link',
  success_copy: 'Link kopieren',
  success_copied: 'Kopiert!',
  success_expires: 'Läuft ab in',
  success_max_views: 'Max. Aufrufe',
  success_protected: 'Geschützt',
  success_yes: 'Ja',
  success_no: 'Nein',
  success_another: 'Neues Geheimnis erstellen',

  view_loading: 'Geheimnis wird geladen…',
  view_passphrase_title: 'Passphrase erforderlich',
  view_passphrase_subtitle: 'Dieses Geheimnis ist geschützt. Gib die Passphrase ein, um es zu entsperren.',
  view_passphrase_label: 'Passphrase',
  view_passphrase_placeholder: 'Passphrase eingeben…',
  view_passphrase_error: 'Falsche Passphrase. Bitte erneut versuchen.',
  view_passphrase_submit: 'Geheimnis entsperren',
  view_passphrase_unlocking: 'Entsperren…',
  view_confirm_title: 'Bereit zur Enthüllung',
  view_confirm_subtitle: 'Sobald du dieses Geheimnis ansiehst, wird dieser Zugriff gezählt. Nach Erreichen der maximalen Anzahl von Aufrufen wird der Link dauerhaft zerstört.',
  view_confirm_labeled: 'Dieses Geheimnis ist beschriftet mit',
  view_confirm_views_remaining: 'Verbleibende Aufrufe',
  view_confirm_expires: 'Läuft ab',
  view_confirm_reveal: 'Geheimnis enthüllen',
  view_confirm_cancel: 'Abbrechen',
  view_revealed_title: 'Geheimnis enthüllt',
  view_revealed_last: 'Das war der letzte Aufruf. Der Link wurde jetzt dauerhaft zerstört.',
  view_revealed_remaining: 'Kopiere dieses Geheimnis. Das Schließen dieser Seite zerstört keine verbleibenden Aufrufe.',
  view_revealed_content_label: 'Geheimer Inhalt',
  view_copy: 'In Zwischenablage kopieren',
  view_copied: 'In Zwischenablage kopiert!',
  view_close: 'Schließen und verlassen',

  status_not_found_title: 'Geheimnis nicht gefunden',
  status_not_found_desc: 'Dieser Link existiert nicht oder hat ein ungültiges Format.',
  status_expired_title: 'Link abgelaufen',
  status_expired_desc: 'Dieses Geheimnis hat sein Ablaufdatum überschritten und wurde dauerhaft gelöscht.',
  status_consumed_title: 'Geheimnis bereits angesehen',
  status_consumed_desc: 'Dieser Link wurde bereits die maximale Anzahl von Malen aufgerufen und ist nicht mehr verfügbar.',
  status_error_title: 'Entschlüsselung fehlgeschlagen',
  status_error_desc: 'Der Link scheint beschädigt zu sein oder der Verschlüsselungsschlüssel fehlt.',
  status_create_new: 'Neues Geheimnis erstellen',

  not_found_title: 'Seite nicht gefunden',
  not_found_desc: 'Die gesuchte Seite existiert nicht.',
  not_found_home: 'Zur Startseite',

  footer_tagline: 'Zero-Knowledge-Verschlüsselung',
};

const translations: Record<Locale, Translations> = { en, nl, de };

function detectLocale(): Locale {
  const stored = localStorage.getItem('psp-locale') as Locale | null;
  if (stored && translations[stored]) return stored;
  const lang = navigator.language.split('-')[0] as Locale;
  return translations[lang] ? lang : 'en';
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
  applyOverrides: (dbSettings: Record<string, string>) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: en,
  applyOverrides: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const [overrides, setOverrides] = useState<Partial<Record<Locale, Partial<Translations>>>>({});

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('psp-locale', l);
  };

  const applyOverrides = useCallback((dbSettings: Record<string, string>) => {
    const parsed: Partial<Record<Locale, Partial<Translations>>> = {};
    Object.entries(dbSettings).forEach(([key, value]) => {
      const dot = key.indexOf('.');
      if (dot === -1) return;
      const loc = key.slice(0, dot) as Locale;
      const k = key.slice(dot + 1) as keyof Translations;
      if (!translations[loc]) return;
      if (!parsed[loc]) parsed[loc] = {};
      (parsed[loc] as Record<string, string>)[k] = value;
    });
    setOverrides(parsed);
  }, []);

  const base = translations[locale];
  const localeOverrides = overrides[locale] ?? {};
  const t = { ...base, ...localeOverrides } as Translations;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, applyOverrides }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
