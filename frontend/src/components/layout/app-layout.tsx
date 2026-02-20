import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Footer } from "./footer"

interface AppLayoutProps {
  children: React.ReactNode
  role?: string
}

export function AppLayout({ children, role = "admin" }: AppLayoutProps) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar role={role} />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
