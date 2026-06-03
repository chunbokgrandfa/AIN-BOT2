# 🔐 Discord 로블록스 인증 봇

길드 이름과 로블록스 닉네임을 입력받아 디스코드 닉네임을 자동 변경해 주는 인증 봇입니다.

## 📋 기능

- `/인증패널` 명령어로 채널에 인증 패널 전송 (서버 관리자 전용)
- **인증하기** 버튼 클릭 → 모달 팝업으로 길드 이름 / 로블록스 이름 입력
- 인증 완료 시 닉네임을 `[길드명] [로블록스명] 기존닉네임` 형식으로 자동 변경
- 재인증 시 기존 태그를 제거하고 새 태그로 교체

## ⚙️ 설치 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env`로 이름을 바꾸고, 봇 토큰을 입력하세요.

```bash
cp .env.example .env
```

`.env` 파일:
```
BOT_TOKEN=여기에_봇_토큰을_입력하세요
```

### 3. Discord Developer Portal 설정

1. [Discord Developer Portal](https://discord.com/developers/applications) 접속
2. 앱 선택 → **Bot** 탭
3. **TOKEN** 복사 → `.env`에 붙여넣기
4. **Privileged Gateway Intents** 에서 아래 항목 활성화:
   - `SERVER MEMBERS INTENT` ✅
   - `MESSAGE CONTENT INTENT` ✅
5. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Nicknames`, `Send Messages`, `Use Slash Commands`
6. 생성된 URL로 봇을 서버에 초대

### 4. 봇 실행

```bash
npm start
```

## 🚀 사용 방법

1. 봇 초대 후 인증을 받을 채널에서 `/인증패널` 입력
2. 인증 패널이 생성되면, 멤버가 **✅ 인증하기** 버튼 클릭
3. 모달 팝업에서 **길드 이름**과 **로블록스 유저명** 입력 후 제출
4. 닉네임이 `[길드명] [로블록스명] 기존닉네임` 형식으로 자동 변경

## ⚠️ 주의 사항

- 봇의 역할(Role)이 닉네임을 변경할 멤버의 역할보다 **위**에 있어야 합니다.
- 서버 소유자의 닉네임은 봇이 변경할 수 없습니다.
- Discord 닉네임 최대 길이는 **32자**입니다. 초과 시 자동으로 잘립니다.
