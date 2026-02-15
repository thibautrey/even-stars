// Time Module - Public API
// Time offset selection and sky date management

export {
  // State
  getTimeMenuState,
  getEffectiveDate,
  isTimeMenuOpen,
  resetTimeMenu,
  // Menu actions
  openTimeMenu,
  closeTimeMenu,
  timeMenuSelectNext,
  timeMenuSelectPrev,
  timeMenuConfirm,
  // Display
  renderTimeMenuOverlay,
  getTimeMenuDisplayLabel,
  // Types
  type TimePreset,
  type TimeMenuState,
  TIME_PRESETS,
} from './timeMenu';
