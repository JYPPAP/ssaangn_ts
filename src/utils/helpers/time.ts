/**
 * 시간 관련 유틸리티 함수들
 */

// 시간 상수
export const TIME_IN_A_SECOND = 1000;
export const TIME_IN_A_MINUTE = TIME_IN_A_SECOND * 60;
export const TIME_IN_AN_HOUR = TIME_IN_A_MINUTE * 60;
export const TIME_IN_A_DAY = TIME_IN_AN_HOUR * 24;

/**
 * 주어진 시작 날짜부터 현재까지의 일수 계산 (로컬 시간)
 */
export function getLocalDayNumberStartingWithYMD(
  utcDate: Date, 
  startYear: number, 
  startMonth: number, 
  startDay: number
): number {
  const firstDate = new Date(startYear, startMonth, startDay);
  return Math.floor((getLocalTime(utcDate) - getLocalTime(firstDate)) / TIME_IN_A_DAY) + 1;
}

/**
 * 주어진 시작 날짜부터 현재까지의 일수 계산 (한국 시간)
 */
export function getKoreanDayNumberStartingWithYMD(
  utcDate: Date, 
  startYear: number, 
  startMonth: number, 
  startDay: number
): number {
  const firstDate = new Date(startYear, startMonth, startDay);
  return Math.floor((getKoreanTime(utcDate) - getLocalTime(firstDate)) / TIME_IN_A_DAY) + 1;
}

/**
 * 한국 시간으로 변환
 */
function getKoreanTime(utcDate: Date): number {
  return getZoneTime(utcDate, -9 * 60);
}

/**
 * 로컬 시간으로 변환
 */
function getLocalTime(utcDate: Date): number {
  return getZoneTime(utcDate, utcDate.getTimezoneOffset());
}

/**
 * 특정 시간대로 변환
 */
function getZoneTime(utcDate: Date, timezoneOffset: number): number {
  return utcDate.getTime() - timezoneOffset * TIME_IN_A_MINUTE;
}

/**
 * 서버 시간 가져오기 (현재는 클라이언트 시간 반환)
 * 원본에서는 XMLHttpRequest를 사용했지만, 현대적인 방식으로 수정
 */
export function getServerTime(): Date {
  // 원래는 서버에서 시간을 가져왔지만, 단순화하여 현재 시간 반환
  return new Date();
}