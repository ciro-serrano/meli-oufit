const GENDERS = [
  { value: "", label: "Todo" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
];

export default function Filters({ filters, categories, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <section className="filters">
      <div className="chips" role="group" aria-label="Género">
        {GENDERS.map((g) => (
          <button
            key={g.value}
            type="button"
            className={`chip ${filters.gender === g.value ? "active" : ""}`}
            aria-pressed={filters.gender === g.value}
            onClick={() => set("gender", g.value)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="selects">
        <select
          aria-label="Temporada"
          value={filters.season}
          onChange={(e) => set("season", e.target.value)}
        >
          <option value="">Toda temporada</option>
          <option value="verano">Verano</option>
          <option value="invierno">Invierno</option>
        </select>

        <select
          aria-label="Categoría"
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
