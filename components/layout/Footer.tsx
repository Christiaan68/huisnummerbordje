export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Emaille Huisnummers. Gemaakt om
          jarenlang mee te gaan.
        </p>
      </div>
    </footer>
  );
}
