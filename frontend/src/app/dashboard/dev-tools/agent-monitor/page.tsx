import { ActivityLog } from "@/components/features/agent-monitor/activity-log"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export const metadata = {
  title: "Agent Monitor - StationeryChain",
  description: "Real-time monitoring of AI agent activities",
}

export default function AgentMonitorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Activity Monitor"
        description="Live view of autonomous agent operations and decisions."
        actions={
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Log
          </Button>
        }
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ActivityLog />
        </div>
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Agent Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Replenishment Agent</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Supplier Agent</span>
                <span className="text-yellow-500">Busy</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Order Agent</span>
                <span className="text-green-500">Idle</span>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Performance</h3>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Success Rate (Last 24h)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
