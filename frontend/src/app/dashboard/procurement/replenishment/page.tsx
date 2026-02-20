import { RecommendationList } from "@/components/features/replenishment/recommendation-list"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export const metadata = {
  title: "AI Replenishment - StationeryChain",
  description: "Autonomous inventory replenishment recommendations",
}

export default function ReplenishmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Autonomous Replenishment"
        description="AI-driven inventory recommendations and demand forecasting."
        actions={
          <Button>
            <Sparkles className="mr-2 h-4 w-4" /> Run Analysis
          </Button>
        }
      />
      
      <RecommendationList />
    </div>
  )
}
