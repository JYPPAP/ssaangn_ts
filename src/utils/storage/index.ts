/**
 * 로컬 스토리지 관련 유틸리티 함수들
 */

// 저장 데이터 타입
export enum SDTypes {
  BOOL = 0,
  INT = 1,
  STRING = 2,
}

// 저장 데이터 형식: [value, type, name]
export type StoredData<T> = [T, SDTypes, string];

/**
 * 저장된 데이터 값 가져오기
 */
export function getStoredDataValue<T>(sd: StoredData<T>): void {
  const value = getFromStorage(sd[2], sd[1]);
  if (value !== undefined) {
    (sd as any)[0] = value;
  }
}

/**
 * 데이터 값 저장하기
 */
export function setStoredDataValue<T>(sd: StoredData<T>): void {
  setStorage(sd[2], sd[0], sd[1]);
}

/**
 * 로컬 스토리지에서 타입별로 데이터 가져오기
 */
export function getFromStorage(key: string, type: SDTypes): any {
  const value = localStorage.getItem(key);
  if (value === null) {
    return undefined;
  }
  
  switch (type) {
    case SDTypes.BOOL:
      return parseInt(value) !== 0;
    case SDTypes.INT:
      return parseInt(value);
    case SDTypes.STRING:
      return value;
    default:
      return undefined;
  }
}

/**
 * 로컬 스토리지에 타입별로 데이터 저장하기
 */
export function setStorage(key: string, value: any, type: SDTypes): void {
  switch (type) {
    case SDTypes.BOOL:
      localStorage.setItem(key, value === true ? "1" : "0");
      break;
    case SDTypes.INT:
      localStorage.setItem(key, value.toString());
      break;
    case SDTypes.STRING:
      localStorage.setItem(key, value);
      break;
  }
}

/**
 * 현대적인 타입 안전 스토리지 함수들
 */

/**
 * 제네릭 스토리지 get 함수
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * 제네릭 스토리지 set 함수
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error);
  }
}

/**
 * 스토리지 아이템 제거
 */
export function removeStorageItem(key: string): void {
  localStorage.removeItem(key);
}

/**
 * 스토리지 초기화
 */
export function clearStorage(): void {
  localStorage.clear();
}