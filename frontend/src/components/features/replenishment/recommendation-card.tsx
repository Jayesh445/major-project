import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

interface Recommendation {
  id: string
  productName: string
  sku: string
  currentStock: number
  recommendedQty: number
  reason: string
  supplierName: string
  estimatedCost: number
  confidence: number
}

interface RecommendationCardProps {
  recommendation: Recommendation
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function RecommendationCard({ recommendation, onApprove, onReject }: RecommendationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">{recommendation.productName}</CardTitle>
          <p className="text-sm text-muted-foreground">{recommendation.sku}</p>
        </div>
        <Badge variant={recommendation.confidence > 80 ? "default" : "secondary"}>
          {recommendation.confidence}% Confidence
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Current Stock</p>
            <p className="font-medium">{recommendation.currentStock}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recommended</p>
            <p className="font-medium text-blue-600">{recommendation.recommendedQty}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Supplier</p>
            <p className="font-medium">{recommendation.supplierName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Est. Cost</p>
            <p className="font-medium">{formatCurrency(recommendation.estimatedCost)}</p>
          </div>
        </div>
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">AI Reason</span>
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
