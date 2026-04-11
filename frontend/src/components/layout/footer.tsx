export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-4 text-center text-sm text-muted-foreground">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p>
          &copy; {new Date().getFullYear()} AutoStock AI. All rights reserved.
        </p>
        <p>v1.0.0</p>
      </div>
    </footer>
  )
}
