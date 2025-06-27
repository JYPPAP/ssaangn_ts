/**
 * 헬퍼 유틸리티 메인 익스포트
 */

// 수학 관련
export {
  clamp,
  remap,
  degToRad,
  degreeToEdgeXY,
  mulberry32,
  generateRandomPercentageList,
  binarySearch,
  binarySearchIncludes
} from './math';

// 시간 관련
export {
  TIME_IN_A_SECOND,
  TIME_IN_A_MINUTE,
  TIME_IN_AN_HOUR,
  TIME_IN_A_DAY,
  getLocalDayNumberStartingWithYMD,
  getKoreanDayNumberStartingWithYMD,
  getServerTime
} from './time';

// 배열 관련
export {
  convertListToString
} from './array';

// DOM 관련
export {
  isElementScrolledToBottom,
  getElementPositionTop,
  getElementPositionBottom,
  getElementPositionCenterY,
  getElementPositionLeft,
  getElementPositionRight,
  getElementPositionCenterX,
  removeAllChildren,
  preloadImages
} from './dom';