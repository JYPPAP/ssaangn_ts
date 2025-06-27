/**
 * DOM 관련 유틸리티 함수들
 */

/**
 * 요소가 스크롤 끝까지 내려갔는지 확인
 */
export function isElementScrolledToBottom(element: HTMLElement): boolean {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
}

/**
 * 요소의 상단 위치 구하기
 */
export function getElementPositionTop(element: HTMLElement): number {
  return parseInt(element.getBoundingClientRect().top.toString()) + window.scrollY;
}

/**
 * 요소의 하단 위치 구하기
 */
export function getElementPositionBottom(element: HTMLElement): number {
  return parseInt(element.getBoundingClientRect().bottom.toString()) + window.scrollY;
}

/**
 * 요소의 세로 중앙 위치 구하기
 */
export function getElementPositionCenterY(element: HTMLElement): number {
  return parseInt(((getElementPositionTop(element) + getElementPositionBottom(element)) / 2).toString());
}

/**
 * 요소의 좌측 위치 구하기
 */
export function getElementPositionLeft(element: HTMLElement): number {
  return parseInt(element.getBoundingClientRect().left.toString()) + window.scrollX;
}

/**
 * 요소의 우측 위치 구하기
 */
export function getElementPositionRight(element: HTMLElement): number {
  return parseInt(element.getBoundingClientRect().right.toString()) + window.scrollX;
}

/**
 * 요소의 가로 중앙 위치 구하기
 */
export function getElementPositionCenterX(element: HTMLElement): number {
  return parseInt(((getElementPositionLeft(element) + getElementPositionRight(element)) / 2).toString());
}

/**
 * 요소의 모든 자식 요소 제거
 */
export function removeAllChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.lastChild!);
  }
}

/**
 * 이미지 프리로드
 */
const preloadedImages: HTMLImageElement[] = [];

export function preloadImages(...imagePaths: string[]): void {
  for (const imagePath of imagePaths) {
    const img = new Image();
    img.src = imagePath;
    preloadedImages.push(img);
  }
}