
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';

// Existing agents
import { forecastAgent } from './agents/forecast-agent';
import { warehouseOptimizationAgent } from './agents/warehouse-optimization-agent';

// New agents
import { negotiationAgent } from './agents/negotiation-agent';
import { supplierSimulatorAgent } from './agents/supplier-simulator-agent';
import { procurementOrchestratorAgent } from './agents/procurement-orchestrator-agent';
import { supplierEvaluationAgent } from './agents/supplier-evaluation-agent';
import { anomalyDetectionAgent } from './agents/anomaly-detection-agent';
import { smartReorderAgent } from './agents/smart-reorder-agent';
import { qualityControlAgent } from './agents/quality-control-agent';

// Existing workflows
import { forecastWorkflow } from './workflows/forecast-workflow';
import { warehouseOptimizationWorkflow } from './workflows/warehouse-optimization-workflow';

// New workflows
import { negotiationWorkflow } from './workflows/negotiation-workflow';
import { procurementWorkflow } from './workflows/procurement-workflow';
import { supplierEvaluationWorkflow } from './workflows/supplier-evaluation-workflow';
import { anomalyDetectionWorkflow } from './workflows/anomaly-detection-workflow';
import { smartReorderWorkflow } from './workflows/smart-reorder-workflow';
import { qualityControlWorkflow } from './workflows/quality-control-workflow';

// Scorers
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';

export const mastra = new Mastra({
  workflows: {
    forecastWorkflow,
    warehouseOptimizationWorkflow,
    negotiationWorkflow,
    procurementWorkflow,
    supplierEvaluationWorkflow,
    anomalyDetectionWorkflow,
    smartReorderWorkflow,
    qualityControlWorkflow,
  },
  agents: {
    forecastAgent,
    warehouseOptimizationAgent,
    negotiationAgent,
    supplierSimulatorAgent,
    procurementOrchestratorAgent,
    supplierEvaluationAgent,
    anomalyDetectionAgent,
    smartReorderAgent,
    qualityControlAgent,
  },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});
