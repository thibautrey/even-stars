// Speech module public API
export { saveApiKey, loadApiKey, hasApiKey } from './apiKeyStorage';
export {
  startListening,
  stopListening,
  feedAudio,
  getSpeechState,
  resetTranscription,
  type SpeechToTextState,
  type SpeechToTextCallbacks,
} from './speechToText';
export {
  renderFindTargetOverlay,
  FindTargetOverlayState,
  type FindTargetOverlayData,
} from './findTargetOverlay';
export {
  activateFindTargetMode,
  deactivateFindTargetMode,
  handleFindTargetClick,
  handleFindTargetDoubleClick,
  handleFindTargetScroll,
  handleAudioData,
  getFindTargetOverlay,
  isFindTargetActive,
  processManualText,
  type FindTargetModeState,
} from './findTargetMode';
export {
  fetchModels,
  getCachedModels,
  saveSelectedModel,
  getSelectedModel,
  type OpenAIModel,
} from './openaiModels';
export { llmFallbackSearch, getSystemPrompt } from './llmFallback';
export {
  getUserCatalogObjects,
  getUserDescription,
  addLLMObjectToCatalog,
  type LLMCelestialObject,
} from './userCatalog';
export {
  createSession,
  resetSession,
  sessionInfo,
  type ConversationSession,
  type ConversationMessage,
} from './conversationSession';
