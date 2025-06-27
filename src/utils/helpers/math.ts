/**
 * 수학 관련 유틸리티 함수들
 */

/**
 * 값을 주어진 범위로 제한
 */
export function clamp(num: number, low: number, high: number): number {
  if (num < low) return low;
  if (num > high) return high;
  return num;
}

/**
 * 값을 한 범위에서 다른 범위로 매핑
 */
export function remap(num: number, a: number, b: number, c: number, d: number): number {
  return c + (d - c) * (num - a) / (b - a);
}

/**
 * 각도를 라디안으로 변환
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180.0);
}

/**
 * 각도에 따른 경계 좌표 계산
 */
export function degreeToEdgeXY(deg: number): [number, number] {
  if (deg <= 45.0) {
    const c = 1.0 / Math.cos(degToRad(deg));
    const a = Math.sqrt(c * c - 1.0);
    return [-1, -a];
  }
  else if (deg <= 90.0) {
    const c = 1.0 / Math.cos(degToRad(90.0 - deg));
    const a = Math.sqrt(c * c - 1.0);
    return [-a, -1];
  }
  else if (deg <= 135.0) {
    const c = 1.0 / Math.cos(degToRad(deg - 90.0));
    const a = Math.sqrt(c * c - 1.0);
    return [a, -1];
  }
  else if (deg <= 180.0) {
    const c = 1.0 / Math.cos(degToRad(180.0 - deg));
    const a = Math.sqrt(c * c - 1.0);
    return [1, -a];
  }
  else if (deg <= 225.0) {
    const c = 1.0 / Math.cos(degToRad(deg - 180.0));
    const a = Math.sqrt(c * c - 1.0);
    return [1, a];
  }
  else if (deg <= 270.0) {
    const c = 1.0 / Math.cos(degToRad(270.0 - deg));
    const a = Math.sqrt(c * c - 1.0);
    return [a, 1];
  }
  else if (deg <= 315.0) {
    const c = 1.0 / Math.cos(degToRad(deg - 270.0));
    const a = Math.sqrt(c * c - 1.0);
    return [-a, 1];
  }
  else {
    const c = 1.0 / Math.cos(degToRad(360.0 - deg));
    const a = Math.sqrt(c * c - 1.0);
    return [-1, a];
  }
}

/**
 * Mulberry32 의사 랜덤 생성기
 */
export function mulberry32(a: number): number {
  let t = a += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * 랜덤 퍼센트 리스트 생성
 */
export function generateRandomPercentageList(num: number): number[] {
  const list: number[] = [];
  let total = 0;
  
  for (let i = 0; i < num; i++) {
    list[i] = Math.random() * (i + 1) * 10 + (i + 1) * 10;
    total += list[i];
  }
  
  for (let i = 0; i < num; i++) {
    list[i] /= total;
  }
  
  return list;
}

/**
 * 이진 탐색
 */
export function binarySearch<T>(array: T[], value: T): number {
  let min = 0;
  let max = array.length - 1;
  
  while (min <= max) {
    const current = Math.floor((max + min) / 2);
    
    if (value === array[current]) {
      return current;
    }
    
    if (value < array[current]) {
      max = current - 1;
    } else {
      min = current + 1;
    }
  }
  
  return -1;
}

/**
 * 이진 탐색으로 포함 여부 확인
 */
export function binarySearchIncludes<T>(array: T[], value: T): boolean {
  return binarySearch(array, value) !== -1;
}