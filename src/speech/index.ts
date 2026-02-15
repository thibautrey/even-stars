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
  handleAudioData,
  getFindTargetOverlay,
  isFindTargetActive,
  type FindTargetModeState,
} from './findTargetMode';
