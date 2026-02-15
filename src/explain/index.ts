// Explain Mode - Public API
// Auto-identify + banner + auto-scrolling sidebar + click-to-lock

export {
  ExplainModeManager,
  ExplainState,
  getExplainManager,
  resetExplainManager,
  disposeExplainManager,
  updateExplainMode,
  handleExplainClick,
  type ExplainDisplay,
  type ExplainBanner,
  type ExplainSidebar,
  type ExplainModeConfig,
  DEFAULT_EXPLAIN_CONFIG,
} from './explainMode';

export {
  renderExplainOverlay,
} from './explainRenderer';
