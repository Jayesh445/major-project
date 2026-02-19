export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">StationeryChain</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Supply Chain Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
