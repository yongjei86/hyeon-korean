혜온이 한글 따라쓰기 PWA

구성 파일
- index.html
- manifest.webmanifest
- sw.js
- icons/

사용 방법
1. 이 폴더 전체를 HTTPS 웹호스팅에 올립니다.
2. 안드로이드 태블릿의 Chrome에서 index.html 주소를 엽니다.
3. Chrome 메뉴 → 홈 화면에 추가 또는 앱 설치를 선택합니다.
4. 한 번 실행한 뒤에는 오프라인에서도 사용할 수 있습니다.

주의
- PWA 설치 및 Service Worker는 일반적으로 HTTPS 주소에서 동작합니다.
- 로컬 파일(file://)을 직접 열면 PWA 설치 기능이 정상 동작하지 않습니다.
