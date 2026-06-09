import type { ARAction, ARState } from './arTypes';
import { initialARState } from './arTypes';

/**
 * AR 状态机 reducer。
 * 合法迁移：
 *   idle --ACTIVATE--> initializing
 *   initializing --READY--> scanning | --FAIL--> error | --FALLBACK--> fallback
 *   scanning <--TARGET_FOUND/LOST--> tracking
 *   any --FALLBACK--> fallback | --RESET--> idle
 */
export function arReducer(state: ARState, action: ARAction): ARState {
  switch (action.type) {
    case 'ACTIVATE':
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'initializing', error: null };

    case 'READY':
      return { ...state, phase: 'scanning', cameraParams: action.cameraParams };

    case 'TARGET_FOUND':
      // 仅在追踪管线运行时有效
      if (state.phase !== 'scanning' && state.phase !== 'tracking') return state;
      return { ...state, phase: 'tracking', everFound: true };

    case 'TARGET_LOST':
      if (state.phase !== 'tracking') return state;
      return { ...state, phase: 'scanning' };

    case 'FALLBACK':
      return { ...state, phase: 'fallback' };

    case 'FAIL':
      return { ...state, phase: 'error', error: action.error };

    case 'DEGRADE':
      if (state.degraded) return state;
      return { ...state, degraded: true };

    case 'RESTORE':
      return { ...state, degraded: false };

    case 'RESET':
      return { ...initialARState };

    default:
      return state;
  }
}
