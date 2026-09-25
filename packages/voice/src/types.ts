export interface AudioInput {
  mimeType: string;
  data: Uint8Array;
  sampleRate?: number;
  channels?: number;
}

export interface TranscriptionRequest {
  audio: AudioInput;
  language?: string;
  signal?: AbortSignal;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
}

export interface SpeechRequest {
  text: string;
  voice?: string;
  signal?: AbortSignal;
}

export interface SpeechResponse {
  audio: Uint8Array;
  mimeType: string;
}

export interface SpeechToTextProvider {
  readonly provider: string;
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse>;
}

export interface TextToSpeechProvider {
  readonly provider: string;
  synthesize(request: SpeechRequest): Promise<SpeechResponse>;
}
