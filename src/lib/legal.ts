/** Реквизиты для юридических страниц. Заполняются через окружение, чтобы не править код. */
export const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Агентство";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.kz";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/** Дата последней редакции документов — Meta смотрит, что политика живая. */
export const LEGAL_UPDATED = "2026-08-30";
