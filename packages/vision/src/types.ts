export interface ImageInput {
  mimeType: string;
  data: Uint8Array | string;
  detail?: "low" | "medium" | "high";
}

export interface VisionRequest {
  prompt: string;
  images: readonly ImageInput[];
  signal?: AbortSignal;
}

export interface VisionResponse {
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface VisionModel {
  readonly provider: string;
  readonly model: string;
  analyze(request: VisionRequest): Promise<VisionResponse>;
}
