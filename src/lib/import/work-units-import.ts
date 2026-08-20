import "server-only";
import { parseCsv } from "@/lib/import/csv";

export type ImportedWorkUnit = {
  code: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  installer_company: string | null;
  installation_planned_at: string | null;
  notes: string | null;
};

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Alias -> campo canonico. Cubre los nombres de columna recomendados
// en spec seccion 21 y variantes razonables en español/inglés.
const FIELD_ALIASES: Record<string, keyof ImportedWorkUnit> = {
  "codigo pdv": "code",
  codigo: "code",
  code: "code",
  sfid: "code",
  nombre: "name",
  tienda: "name",
  name: "name",
  direccion: "address",
  address: "address",
  cp: "postal_code",
  "codigo postal": "postal_code",
  postal_code: "postal_code",
  ciudad: "city",
  poblacion: "city",
  city: "city",
  provincia: "province",
  province: "province",
  latitud: "lat",
  lat: "lat",
  longitud: "lng",
  lng: "lng",
  lon: "lng",
  contacto: "contact_name",
  contact_name: "contact_name",
  telefono: "contact_phone",
  phone: "contact_phone",
  email: "contact_email",
  correo: "contact_email",
  "empresa instaladora": "installer_company",
  instalador: "installer_company",
  "fecha de instalacion prevista": "installation_planned_at",
  "fecha instalacion prevista": "installation_planned_at",
  "fecha instalacion": "installation_planned_at",
  observaciones: "notes",
  notas: "notes",
  notes: "notes",
};

function parseDate(value: string): string | null {
  if (!value) return null;
  // dd/mm/yyyy o dd-mm-yyyy
  const m = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // yyyy-mm-dd (ya valido)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

export type ParseResult = {
  rows: ImportedWorkUnit[];
  skipped: { line: number; reason: string }[];
};

export function parseWorkUnitsCsv(text: string): ParseResult {
  const rawRows = parseCsv(text);
  if (rawRows.length === 0) return { rows: [], skipped: [] };

  const rawHeaders = Object.keys(rawRows[0]);
  const headerMap = new Map<string, keyof ImportedWorkUnit>();
  for (const h of rawHeaders) {
    const canonical = FIELD_ALIASES[normalizeHeader(h)];
    if (canonical) headerMap.set(h, canonical);
  }

  const rows: ImportedWorkUnit[] = [];
  const skipped: { line: number; reason: string }[] = [];

  rawRows.forEach((raw, idx) => {
    const mapped: Partial<Record<keyof ImportedWorkUnit, string>> = {};
    for (const [rawHeader, canonical] of headerMap) {
      mapped[canonical] = raw[rawHeader];
    }

    const code = mapped.code?.trim();
    const name = mapped.name?.trim();
    if (!code || !name) {
      skipped.push({ line: idx + 2, reason: "Falta código o nombre" });
      return;
    }

    rows.push({
      code,
      name,
      address: mapped.address?.trim() || null,
      postal_code: mapped.postal_code?.trim() || null,
      city: mapped.city?.trim() || null,
      province: mapped.province?.trim() || null,
      lat: mapped.lat ? Number(mapped.lat.replace(",", ".")) || null : null,
      lng: mapped.lng ? Number(mapped.lng.replace(",", ".")) || null : null,
      contact_name: mapped.contact_name?.trim() || null,
      contact_phone: mapped.contact_phone?.trim() || null,
      contact_email: mapped.contact_email?.trim() || null,
      installer_company: mapped.installer_company?.trim() || null,
      installation_planned_at: mapped.installation_planned_at ? parseDate(mapped.installation_planned_at.trim()) : null,
      notes: mapped.notes?.trim() || null,
    });
  });

  return { rows, skipped };
}
