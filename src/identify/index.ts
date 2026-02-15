// Object Detection Engine - Public API
// Provides identification of celestial objects based on head orientation

// Core detector functions
export {
  // Main detection functions
  findNearestObject,
  findObjectsInView,
  getCandidateObjects,
  
  // Utility functions
  calculateConfidence,
  formatIdentificationText,
  isConfidentIdentification,
  
  // Types and constants
  type DetectionOptions,
  DEFAULT_DETECTION_OPTIONS,
} from './detector';

// Identify Mode state machine
export {
  // Main manager class
  IdentifyModeManager,
  
  // Global singleton functions
  getIdentifyManager,
  resetIdentifyManager,
  disposeIdentifyManager,
  updateIdentifyMode,
  getIdentifyDisplayText,
  
  // Enums and types
  IdentifyState,
  type IdentifyModeConfig,
  type IdentifyUpdateResult,
  DEFAULT_IDENTIFY_CONFIG,
} from './identifyMode';
