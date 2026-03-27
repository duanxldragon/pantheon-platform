# Pantheon Platform

> 闈㈠悜浼佷笟鍐呴儴绯荤粺涓?SaaS 浜у搧鐨勫绉熸埛鍚庡彴绠＄悊骞冲彴搴曞骇銆?
[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-19+-cyan.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 椤圭洰绠€浠?
Pantheon Platform 涓嶆槸鍗曠函鐨勨€滅鐞嗗悗鍙伴〉闈㈤泦鍚堚€濓紝鑰屾槸涓€濂楀彲鎸佺画鎵╁睍鐨勫悗鍙板钩鍙板簳搴э紝鐩爣鏄悓鏃舵敮鎸侊細

- 绉佹湁鍖栧崟绉熸埛浜や粯
- PaaS 骞冲彴鍖栧簳搴у缓璁?- SaaS 澶氱鎴蜂骇鍝佸寲杩愯惀
- 鍚庣画涓氬姟妯″潡鎸夌粺涓€瑙勮寖鎺ュ叆涓庢墿灞?
褰撳墠骞冲彴鍥寸粫涓夋潯涓荤嚎寤鸿锛?
- `auth`锛氱櫥褰曘€侀€€鍑恒€佷細璇濆畨鍏ㄣ€?FA銆丄PI Key
- `tenant`锛氱鎴峰紑閫氥€佸垵濮嬪寲銆侀儴缃叉ā寮忋€佺敓鍛藉懆鏈?- `system`锛氱鎴峰唴绯荤粺绠＄悊鏍稿績鑳藉姏

## 鏍稿績鑳藉姏

### 骞冲彴搴曞骇

- 澶氱鎴蜂笌鍙厤缃儴缃叉ā寮?- 澶氳瑷€鏀寔
- `JWT + Refresh Token` 浼氳瘽浣撶郴
- 鍙厤缃簩娆¤璇侊細`2FA / TOTP / 澶囦唤鐮乣
- 鏉冮檺鍔ㄦ€佸垵濮嬪寲涓庝細璇濆埛鏂扮瓥鐣?- 鍔ㄦ€佽彍鍗曘€佸姩鎬侀〉闈㈡寕杞姐€佸姩鎬佹潈闄愮敓鏁?
### 绯荤粺绠＄悊妯″潡

- 鐢ㄦ埛绠＄悊
- 閮ㄩ棬绠＄悊
- 宀椾綅绠＄悊
- 瑙掕壊绠＄悊
- 鏉冮檺绠＄悊
- 鑿滃崟绠＄悊
- 鏃ュ織绠＄悊
- 绯荤粺璁剧疆
- 绯荤粺鐩戞帶
- 涓汉涓績

## 鎶€鏈爤

### 鍚庣

- `Go 1.23`
- `Gin`
- `GORM`
- `Casbin`
- `Redis`
- `Swagger`

### 鍓嶇

- `React 19`
- `TypeScript`
- `Vite`
- `Zustand`
- `Tailwind CSS`
- `shadcn/ui`
- `i18next`
- `Vitest`
- `Playwright`

## 鏋舵瀯姒傝

```text
Frontend (React + Vite + Zustand)
        |
        v
API Gateway / Gin Middleware
  |- Auth
  |- Tenant Context
  |- Authorization
  |- I18n
  |- Audit / Logging
        |
        v
Backend Modules
  |- auth
  |- tenant
  |- system
  |- notification
  |- i18n
        |
        v
Infrastructure
  |- Master DB
  |- Tenant DB Pool
  |- Redis
```

鍏抽敭璁捐鍘熷垯锛?
- `Master DB` 淇濆瓨骞冲彴绾ч厤缃€佺鎴蜂富鏁版嵁涓庡叕鍏卞厓鏁版嵁
- `Tenant DB` 淇濆瓨绉熸埛渚т笟鍔℃暟鎹紝淇濊瘉闅旂涓庢墿灞?- 鐧诲綍鎴愬姛鍚庢寜绉熸埛涓婁笅鏂囧姩鎬佸垵濮嬪寲鐢ㄦ埛銆佹潈闄愩€佽彍鍗?- 鏂颁笟鍔℃ā鍧椾紭鍏堟寜鈥滆彍鍗?+ 鏉冮檺鐮?+ 鍓嶇瑙嗗浘娉ㄥ唽鈥濇柟寮忔帴鍏?
## 鐩綍缁撴瀯

```text
pantheon-platform/
鈹溾攢 backend/                # 鍚庣鏈嶅姟銆侀厤缃€佽剼鏈€丼wagger銆佸悗绔枃妗?鈹溾攢 frontend/               # 鍓嶇搴旂敤銆佺姸鎬佺鐞嗐€佸墠绔枃妗?鈹溾攢 docs/                   # 骞冲彴绾ц璁℃枃妗?鈹溾攢 .github/workflows/      # CI 閰嶇疆
鈹溾攢 docker-compose.yml      # 鏈湴 / 婕旂ず閮ㄧ讲鍏ュ彛
鈹溾攢 AGENTS.md               # Codex CLI 椤圭洰瑙勫垯
鈹斺攢 README.md               # 椤圭洰鍏ュ彛鏂囨。
```

## 蹇€熷紑濮?
### 鏂瑰紡涓€锛氭湰鍦板紑鍙?
#### 1. 鐜鍑嗗

- Go `1.23+`
- Node.js `18+`
- MySQL `8+`
- Redis `7+`

#### 2. 鍚姩鍚庣

```bash
cd backend
cp config.yaml.example config.yaml
make run
```

甯哥敤鍛戒护锛?
```bash
make test
make lint
make migrate-only
make swagger
```

#### 3. 鍚姩鍓嶇

```bash
cd frontend
npm ci
npm run dev
```

甯哥敤鍛戒护锛?
```bash
npm run type-check
npm run lint
npm run test
npm run build
```

### 鏂瑰紡浜岋細Docker Compose

閫傚悎鏈湴鑱旇皟銆佹紨绀哄拰蹇€熼獙璇侊細

```bash
docker compose up -d
```

濡傛灉鏄鍙戝垵濮嬪寲鍦烘櫙锛屽缓璁厛鎵ц杩佺Щ鎴栦娇鐢ㄨ縼绉绘ā寮忓畬鎴愰粯璁ゆ暟鎹紩瀵笺€?
## 鏂囨。瀵艰埅

### 骞冲彴绾ц璁?
- `docs/DOCS_INDEX.md`
- `docs/system/SYSTEM_MANAGEMENT.md`
- `docs/auth/AUTH_SECURITY.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`
- `docs/governance/GIT_COMMIT_GUIDE.md`
- `docs/governance/GITHUB_REPOSITORY_GUIDE.md`
- `docs/governance/SYSTEM_CHECKLIST.md`
- `docs/deploy/DEPLOYMENT.md`

### 鍚庣瀹炵幇

- `backend/README.md`
- `backend/BACKEND_GUIDE.md`
- `backend/docs/BACKEND_DOCS_INDEX.md`
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
- `backend/docs/system/SYSTEM_BACKEND.md`
- `backend/docs/auth/AUTH_BACKEND.md`
- `backend/docs/tenant/TENANT_BACKEND.md`
- `backend/cmd/tools/README.md`
- `backend/api/swagger/`

### 鍓嶇瀹炵幇

- `frontend/FRONTEND_GUIDE.md`
- `frontend/docs/FRONTEND_DOCS_INDEX.md`
- `frontend/docs/system/SYSTEM_FRONTEND.md`
- `frontend/docs/auth/AUTH_FRONTEND.md`
- `frontend/docs/tenant/TENANT_FRONTEND.md`

## 鎺ㄨ崘闃呰椤哄簭

1. 鍏堣 `README.md`
2. 鍐嶈 `docs/DOCS_INDEX.md`
3. 鍐嶈 `docs/system/SYSTEM_MANAGEMENT.md`
4. 鍐嶈 `docs/auth/AUTH_SECURITY.md` 涓?`docs/auth/AUTH_SESSION_STRATEGY.md`
5. 鍐嶈 `docs/tenant/TENANT_INITIALIZATION.md`
6. 杩涘叆鍚庣鏃跺厛璇?`backend/README.md`銆乣backend/BACKEND_GUIDE.md`
7. 杩涘叆鍓嶇鏃跺厛璇?`frontend/FRONTEND_GUIDE.md`
8. 閮ㄧ讲鍓嶅啀璇?`docs/deploy/DEPLOYMENT.md`

## 鎵╁睍鏂瑰紡

鏂板涓氬姟妯″潡鏃讹紝寤鸿鎸変互涓嬮『搴忔帴鍏ワ細

1. 瀹氫箟鍚庣棰嗗煙妯″潡涓庢帴鍙?2. 澧炲姞鏉冮檺鐮佷笌瑙掕壊鎺堟潈鐐?3. 閰嶇疆鑿滃崟涓庡墠绔鍥炬槧灏?4. 鎺ュ叆绉熸埛涓婁笅鏂囦笌鍒濆鍖栭摼璺?5. 琛ュ厖娴嬭瘯銆佹枃妗ｅ拰閮ㄧ讲璇存槑

杩欐牱鍙互鍦ㄤ笉鐮村潖骞冲彴涓婚鏋剁殑鍓嶆彁涓嬶紝鎶婃柊妯″潡鍔ㄦ€佹帴鍏ョ幇鏈夌郴缁熴€?

