export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export interface StoryState {
  imagePreview: string | null;
  generatedStory: string | null;
  audioBuffer: AudioBuffer | null;
  loadingState: LoadingState;
  error?: string;
}

export interface AudioContextRefs {
  context: AudioContext | null;
  source: AudioBufferSourceNode | null;
}
