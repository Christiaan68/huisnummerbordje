export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        <p>
          &copy; Emaille Huisnummers is een onderdeel van{" "}
          <a
            href="https://www.langcat.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Langcat Emaille
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
