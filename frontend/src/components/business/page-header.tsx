import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  backLink?: string
  actions?: React.ReactNode
}

export function PageHeader({ 
  title, 
  description, 
  backLink, 
  actions 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {backLink && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={backLink}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
