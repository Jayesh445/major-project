"use client"

import { RecommendationList } from "@/components/features/replenishment/recommendation-list"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { useRunSmartReorder } from "@/hooks/queries/use-agents"

export default function ReplenishmentPage() {
  const smartReorder = useRunSmartReorder()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Autonomous Replenishment"
        description="AI-driven inventory recommendations and demand forecasting."
        actions={
          <Button onClick={() => smartReorder.mutate()} disabled={smartReorder.isPending}>
            {smartReorder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {smartReorder.isPending ? "Analyzing..." : "Run Analysis"}
          </Button>
        }
      />

      <RecommendationList />
    </div>
  )
}
