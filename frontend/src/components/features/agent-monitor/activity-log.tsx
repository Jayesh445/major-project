"use client"

import { AgentActivityCard, AgentActivity } from "@/components/business/agent-activity-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"

const mockActivities: AgentActivity[] = [
  {
    timestamp: "10:42:15",
    agent: "Replenishment Agent",
    action: "Analyzed stock levels for SKU: PEN-001",
    status: "success",
    duration: "120ms",
  },
  {
    timestamp: "10:42:18",
    agent: "Replenishment Agent",
    action: "Forecasted demand: 500 units (Confidence: 92%)",
    status: "success",
    duration: "450ms",
  },
  {
    timestamp: "10:42:20",
    agent: "Supplier Agent",
    action: "Checked availability for supplier: ABC Supplies",
    status: "pending",
  },
  {
    timestamp: "10:30:05",
    agent: "Order Agent",
    action: "Failed to validate PO #12345: Invalid SKU",
    status: "error",
    duration: "50ms",
  },
]

export function ActivityLog() {
  const [activities, setActivities] = useState<AgentActivity[]>(mockActivities)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity: AgentActivity = {
        timestamp: new Date().toLocaleTimeString(),
        agent: "System Monitor",
        action: "Health check completed",
        status: "success",
        duration: "10ms",
      }
      setActivities((prev) => [newActivity, ...prev])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <AgentActivityCard 
            key={index} 
            activity={activity} 
            onClick={() => console.log("View details", activity)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
