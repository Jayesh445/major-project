"use client"

import { RecommendationCard } from "./recommendation-card"
import { useToast } from "@/hooks/use-toast"

// Mock data for now
const mockRecommendations = [
  {
    id: "1",
    productName: "Blue Ball Pen",
    sku: "PEN-001",
    currentStock: 15,
    recommendedQty: 500,
    reason: "Stock predicted to run out in 3 days based on increased demand from School Term start.",
    supplierName: "ABC Supplies",
    estimatedCost: 5000,
    confidence: 92,
  },
  {
    id: "2",
    productName: "A4 Paper Ream",
    sku: "PPR-A4",
    currentStock: 40,
    recommendedQty: 200,
    reason: "Regular reorder point reached. Consumption rate stable.",
    supplierName: "PaperCo Ltd",
    estimatedCost: 32000,
    confidence: 85,
  },
  {
    id: "3",
    productName: "Stapler Medium",
    sku: "STP-MD",
    currentStock: 5,
    recommendedQty: 50,
    reason: "Urgent: Stock critical. 3 backorders pending.",
    supplierName: "Office Essentials",
    estimatedCost: 7500,
    confidence: 98,
  },
]

export function RecommendationList() {
  const { toast } = useToast()

  const handleApprove = (id: string) => {
    toast({
      title: "Recommendation Approved",
      description: "Purchase Order has been drafted.",
    })
  }

  const handleReject = (id: string) => {
    toast({
      title: "Recommendation Rejected",
      description: "AI model feedback recorded.",
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {mockRecommendations.map((rec) => (
        <RecommendationCard 
          key={rec.id} 
          recommendation={rec} 
          onApprove={handleApprove} 
          onReject={handleReject} 
        />
      ))}
    </div>
  )
}
