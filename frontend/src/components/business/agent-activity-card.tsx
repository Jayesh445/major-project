import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface AgentActivity {
  timestamp: string
  agent: string
  action: string
  status: "success" | "error" | "pending"
  duration?: string
}

interface AgentActivityCardProps {
  activity: AgentActivity
  onClick?: () => void
}

export function AgentActivityCard({ activity, onClick }: AgentActivityCardProps) {
  const statusColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    pending: "bg-yellow-500",
  }

  return (
    <Card 
      className="hover:bg-accent cursor-pointer transition-colors" 
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {activity.agent}
          </CardTitle>
          <Badge className={statusColors[activity.status]}>
            {activity.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          {activity.action}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{activity.timestamp}</span>
          {activity.duration && <span>{activity.duration}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
