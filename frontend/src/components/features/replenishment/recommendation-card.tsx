import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, TrendingUp, ArrowRight } from "lucide-react"

interface Recommendation {
  id: string
  productName: string
  sku: string
  recommendedQty: number
  reason: string
  fromWarehouse: string
  toWarehouse: string
  estimatedSaving: number
}

interface RecommendationCardProps {
  recommendation: Recommendation
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export function RecommendationCard({ recommendation, onApprove, onReject }: RecommendationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">{recommendation.productName}</CardTitle>
          <p className="text-sm text-muted-foreground">{recommendation.sku}</p>
        </div>
        <Badge variant="outline">{recommendation.recommendedQty} units</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Transfer:</span>
            <span className="font-medium">{recommendation.fromWarehouse}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{recommendation.toWarehouse}</span>
          </div>
          {recommendation.estimatedSaving > 0 && (
            <div>
              <span className="text-muted-foreground">Est. Saving: </span>
              <span className="font-medium text-green-600">{formatCurrency(recommendation.estimatedSaving)}</span>
            </div>
          )}
        </div>
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">AI Reasoning</span>
          </div>
          <p className="text-muted-foreground">{recommendation.reason}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onReject(recommendation.id)}>
          <X className="mr-2 h-4 w-4" /> Reject
        </Button>
        <Button size="sm" onClick={() => onApprove(recommendation.id)}>
          <Check className="mr-2 h-4 w-4" /> Approve
        </Button>
      </CardFooter>
    </Card>
  )
}
