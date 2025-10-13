/**
 * HTML의 클래스 기반 스타일을 인라인 스타일로 변환하는 유틸리티
 * 외부 CSS 없이도 스타일이 유지되도록 합니다
 */

export function inlineStyles(html: string): string {
  if (typeof window === 'undefined') {
    // 서버사이드에서는 변환하지 않음
    return html;
  }

  try {
    // 임시 DOM 생성
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;

    // 스타일 숨기기 (화면에 표시되지 않도록)
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    // 모든 요소 순회
    const allElements = tempContainer.getElementsByTagName('*');

    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i] as HTMLElement;

      // computed style 가져오기
      const computedStyle = window.getComputedStyle(element);

      // 중요한 스타일 속성들만 추출
      const importantStyles = [
        'color',
        'background-color',
        'background',
        'font-size',
        'font-weight',
        'font-family',
        'font-style',
        'text-align',
        'text-decoration',
        'line-height',
        'letter-spacing',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'border',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'border-radius',
        'border-color',
        'border-style',
        'border-width',
        'width',
        'height',
        'max-width',
        'max-height',
        'min-width',
        'min-height',
        'display',
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'z-index',
        'opacity',
        'box-shadow',
        'text-shadow',
        'vertical-align',
        'white-space',
        'word-wrap',
        'overflow',
        'transform'
      ];

      const inlineStyleObj: Record<string, string> = {};

      // 기존 인라인 스타일 보존
      const existingStyle = element.getAttribute('style');
      if (existingStyle) {
        existingStyle.split(';').forEach(rule => {
          const [prop, value] = rule.split(':').map(s => s.trim());
          if (prop && value) {
            inlineStyleObj[prop] = value;
          }
        });
      }

      // computed style에서 중요한 스타일만 추가
      importantStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);

        // 기본값이 아닌 경우에만 추가
        if (value &&
            value !== 'none' &&
            value !== 'auto' &&
            value !== 'normal' &&
            value !== 'initial' &&
            value !== 'inherit' &&
            value !== 'rgba(0, 0, 0, 0)' &&
            value !== 'transparent' &&
            !value.includes('initial')) {

          // 이미 인라인 스타일에 있으면 덮어쓰지 않음 (우선순위 유지)
          if (!inlineStyleObj[prop]) {
            inlineStyleObj[prop] = value;
          }
        }
      });

      // 스타일 문자열로 변환
      const styleString = Object.entries(inlineStyleObj)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');

      if (styleString) {
        element.setAttribute('style', styleString);
      }
    }

    // 결과 HTML 가져오기
    const result = tempContainer.innerHTML;

    // 임시 요소 제거
    document.body.removeChild(tempContainer);

    return result;
  } catch (error) {
    console.error('스타일 인라인화 실패:', error);
    return html; // 실패 시 원본 반환
  }
}

/**
 * 특정 클래스들의 스타일만 인라인으로 변환 (선택적 사용)
 */
export function inlineStylesForClasses(html: string, classNames: string[]): string {
  if (typeof window === 'undefined') {
    return html;
  }

  try {
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;

    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    classNames.forEach(className => {
      const elements = tempContainer.querySelectorAll(`.${className}`);

      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlElement);

        const styles: string[] = [];
        for (let i = 0; i < computedStyle.length; i++) {
          const prop = computedStyle[i];
          const value = computedStyle.getPropertyValue(prop);

          if (value && value !== 'none' && value !== 'auto') {
            styles.push(`${prop}: ${value}`);
          }
        }

        const existingStyle = htmlElement.getAttribute('style') || '';
        htmlElement.setAttribute('style', existingStyle + '; ' + styles.join('; '));
      });
    });

    const result = tempContainer.innerHTML;
    document.body.removeChild(tempContainer);

    return result;
  } catch (error) {
    console.error('클래스 스타일 인라인화 실패:', error);
    return html;
  }
}
