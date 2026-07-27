export function EnamelPlateSignature() {
  return (
    <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
      <svg
        viewBox="0 0 320 320"
        className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]"
        style={{ transform: "rotate(-2deg)" }}
        role="img"
        aria-label="Voorbeeld van een emaille huisnummerbordje met het nummer 12"
      >
        {/* Koperen rand */}
        <rect
          x="4"
          y="4"
          width="312"
          height="312"
          rx="18"
          className="fill-primary"
        />
        {/* Emaille plaquette */}
        <rect
          x="18"
          y="18"
          width="284"
          height="284"
          rx="10"
          className="fill-plate"
        />
        {/* Bevestigingsgaten */}
        <circle cx="42" cy="42" r="6" className="fill-primary/70" />
        <circle cx="278" cy="42" r="6" className="fill-primary/70" />
        <circle cx="42" cy="278" r="6" className="fill-primary/70" />
        <circle cx="278" cy="278" r="6" className="fill-primary/70" />

        {/* Huisnummer */}
        <text
          x="160"
          y="205"
          textAnchor="middle"
          className="fill-plate-foreground"
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "150px",
            fontWeight: 500,
          }}
        >
          12
        </text>

        {/* Glansreflectie, diagonaal over het emaille oppervlak */}
        <polygon
          points="18,18 120,18 40,302 18,302"
          className="fill-white/20"
        />
      </svg>
      <p className="mt-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
        Voorbeeldconfiguratie — jouw bordje volledig naar wens
      </p>
    </div>
  );
}
