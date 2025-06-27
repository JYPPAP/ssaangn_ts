/**
 * 배열 관련 유틸리티 함수들
 */

/**
 * 배열을 문자열로 변환
 */
export function convertListToString<T>(list: T[], separator: string = ','): string {
  if (list.length <= 0) {
    return '';
  }
  
  return list.join(separator);
}