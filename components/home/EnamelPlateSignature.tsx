export function EnamelPlateSignature() {
  return (
    <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
      <div
        className="aspect-square w-full bg-cover bg-center"
        style={{
          backgroundImage: "url(/images/homepage-plate.jpg)",
          transform: "rotate(-2deg)",
          maskImage:
            "radial-gradient(circle, black 40%, rgba(0,0,0,0.5) 60%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(circle, black 40%, rgba(0,0,0,0.5) 60%, transparent 78%)",
        }}
        role="img"
        aria-label="Echt geëmailleerd huisnummerbordje, nummer 4, aan een gevel"
      />
      <p className="mt-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
        Echt emaille — gemaakt om jarenlang mee te gaan
      </p>
    </div>
  );
}