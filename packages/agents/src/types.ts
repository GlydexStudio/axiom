import type { ChatMessage, ChatModel } from "@glydexstudio/axiom-core";
import type { ToolPermission, ToolRegistry } from "@glydexstudio/axiom-tools";

export interface AgentGoal { description: string; }

export interface AgentPlanStep { id: string; description: string; toolName?: string; input?: unknown; }

export interface AgentPlan { goal: AgentGoal; steps: AgentPlanStep[]; }

export interface AgentOptions {
  model: ChatModel;
  tools: ToolRegistry;
  permissions?: ReadonlySet<ToolPermission>;
  maxSteps?: number;
  systemPrompt?: string;
}

export interface AgentResult {
  text: string;
  steps: AgentPlanStep[];
  observations: ChatMessage[];
}
