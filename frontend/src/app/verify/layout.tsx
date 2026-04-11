// Public verification layout — no auth required.
// Used for QR-code dock scans where warehouse staff verify shipments.

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">AutoStock AI — Verification</h1>
          <p className="text-sm text-muted-foreground">Blockchain-backed supply chain audit</p>
        </div>
        {children}
      </div>
    </div>
  )
}
