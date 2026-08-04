export function EnamelPlateSignature() {
  return (
    <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
      <div
        className="aspect-square w-full rounded-md bg-cover bg-center shadow-[0_30px_40px_rgba(0,0,0,0.45)]"
        style={{
          backgroundImage: "url(/images/homepage-plate.jpg)",
          transform: "rotate(-2deg)",
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