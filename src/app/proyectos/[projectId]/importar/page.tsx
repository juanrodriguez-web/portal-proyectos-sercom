import { ImportForm } from "@/components/import/import-form";

export default async function ImportarPage({
  params,
}: PageProps<"/proyectos/[projectId]/importar">) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Importar unidades (PDV)</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          CSV con cabecera. Columnas reconocidas (spec sección 21): Código PDV, Nombre,
          Dirección, CP, Ciudad, Provincia, Latitud, Longitud, Contacto, Teléfono, Email,
          Empresa instaladora, Fecha de instalación prevista, Observaciones. Solo{" "}
          <strong>Código</strong> y <strong>Nombre</strong> son obligatorios.
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>
          XLSX no está soportado todavía — la librería estándar en npm para leerlo tiene
          vulnerabilidades de seguridad sin parchear justo en el punto de subir archivos de
          usuario. Exporta a CSV desde Excel/Sheets mientras tanto.
        </p>
      </div>

      <ImportForm projectId={projectId} />
    </div>
  );
}
