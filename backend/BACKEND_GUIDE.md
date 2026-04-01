# Pantheon Platform 閸氬海顏€圭偟骞囬幀鏄忣潔

> 基于 `Go 1.23+` 的模块化后端工程。
> 閺嶇绺鹃幎鈧張顖涚垽閿涙瓪Gin`閵嗕梗GORM`閵嗕梗Casbin`閵嗕梗JWT`閵嗕梗Redis`閵嗕礁顦跨粔鐔稿煕闂呮梻顬囬妴?
閻╃鍙ч弬鍥ㄣ€傞崗銉ュ經閿?
- 閸涜棄鎮曠憴鍕瘱閿涙瓪backend/docs/BACKEND_NAMING_CONVENTIONS.md`
- 閺傚洦銆傜槐銏犵穿閿涙瓪backend/docs/BACKEND_DOCS_INDEX.md`
- 閸欐垵绔锋稉搴ょ讣缁夋槒顕╅弰搴窗`backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md`

---

## 1. 閺嬭埖鐎幀鏄忣潔

閸氬海顏幐澶婃祼鐎规艾鍨庣仦鍌滅矋缂佸浄绱?
```text
HTTP Request
  -> Middleware Chain
  -> Handler Layer
  -> Service Layer
  -> DAO Layer
  -> Model Layer
```

閸氬嫬鐪伴懕宀冪煑閿?
- `middleware`閿涙俺顓荤拠浣碘偓浣侯潳閹撮绮︾€规哎鈧竼asbin 閹哄牊娼堥妴浣哥暔閸忋劌銇旈妴浣规）韫?- `handler`閿涙俺袙閺嬫劕寮弫鑸偓浣哥唨绾偓閺嶏繝鐛欓妴浣虹埠娑撯偓閸濆秴绨?- `service`閿涙矮绗熼崝陇顫夐崚娆嶁偓浣风皑閸斅ょ珶閻ｅ被鈧浇娉曞Ο鈥虫健閸楀繋缍?- `dao`閿涙碍鏆熼幑顔肩氨鐠囪鍟撻妴浣圭叀鐠囥垹鐨濈憗?- `model`閿涙碍瀵旀稊鍛缂佹挻鐎妴浣哄偍瀵洖鎷扮悰銊︽Ё鐏?
---

## 2. 閻╊喖缍嶉懕宀冪煑

- `cmd/server/`閿涙氨鏁撴禍褎婀囬崝鈥冲弳閸?- `cmd/tools/`閿涙俺鐦栭弬顓溾偓浣稿灥婵瀵查妴浣界窡閸斺晛浼愰崗?- `internal/app/`閿涙艾鎯庨崝銊棅闁板秳绗屾笟婵婄濞夈劌鍙?- `internal/modules/`閿涙矮绗熼崝鈩兡侀崸?- `internal/shared/`閿涙艾鍙℃禍顐㈢唨绾偓鐠佺偓鏌?- `api/swagger/`閿涙瓔wagger 閻㈢喐鍨氭禍褏澧?
娑撴艾濮熷Ο鈥虫健姒涙顓婚崶鍝勭暰閺傚洣娆㈤敍?
- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

鐞涖儱鍘栭弬鍥︽缂佺喍绔存担璺ㄦ暏 `<subject>_<kind>.go`閿涘奔绶ユ俊鍌︾窗

- `session_service.go`
- `user_validation.go`
- `database_initializer.go`

---

## 3. 閸氼垰濮╅柧鎹愮熅

閺堝秴濮熼崥顖氬З娑撶粯绁︾粙瀣剁窗

```text
1. 鐠囪褰囬柊宥囩枂
2. 閸掓繂顫愰崠鏍﹀瘜鎼?3. 閹稿鍘ょ純顔藉⒔鐞?AutoMigrate
4. 閸掓繂顫愰崠鏍磧閹貉冪氨
5. 閸掓繂顫愰崠鏍潳閹撮攱鏆熼幑顔肩氨缁狅紕鎮婇崳?6. 閸掓繂顫愰崠?Redis
7. 閸掓繂顫愰崠鏍ㄥ房閺夊啯婀囬崝?8. 瀵洖顕辨妯款吇缁夌喐鍩?/ 姒涙顓荤憴鎺曞 / 姒涙顓荤粻锛勬倞閸?9. migrate-only 濡€崇础閹绘劕澧犻柅鈧崙?10. 濞夈劌鍞界粔鐔稿煕鏉╀胶些閸?11. 閸旂姾娴囧鍙夋箒缁夌喐鍩涢弫鐗堝祦鎼存捁绻涢幒?12. 閸氼垰濮?HTTP 閺堝秴濮?```

`migrate-only` 閻ㄥ嫮婀＄€圭偞澧界悰灞炬煙瀵骏绱?
```powershell
cd backend
$env:PANTHEON_MIGRATE_ONLY = "true"
go run ./cmd/server
Remove-Item Env:PANTHEON_MIGRATE_ONLY
```

---

## 4. 婢舵氨顫ら幋閿嬆侀崹?
韫囧懘銆忛悧銏ｎ唶娑撳鐪伴弫鐗堝祦鏉堝湱鏅敍?
- `Master DB`閿涙艾閽╅崣鎵獓閺佺増宓侀妴浣侯潳閹磋渹瀵岄弫鐗堝祦閵嗕線鈧氨鐓￠妴浣虹倳鐠囨垹鐡?- `Tenant DB`閿涙氨顫ら幋铚傜瑹閸斺剝鏆熼幑顕嗙礉娓氬顩ч悽銊﹀煕閵嗕浇顫楅懝灞傗偓浣藉綅閸楁洏鈧焦妫╄箛妞尖偓浣哥摟閸?- `Redis`閿涙矮绱扮拠婵団偓浣碘偓浣稿煕閺傜増鈧降鈧焦宸块弶鍐閺堫兙鈧焦鎸欓柨鈧幀浣碘偓浣峰閺冨墎濮搁幀?
缁夌喐鍩涢柧鎹愮熅缁撅附娼敍?
- 鐠囬攱鐪版潻娑樺弳閸氬骸鍘涚憴锝嗙€?`tenant_id`
- `tenant middleware` 鐠愮喕鐭楃憗鍛村帳 `tenant_db`
- DAO 閸?Service 韫囧懘銆忔禒搴濈瑐娑撳鏋冪拠璇插絿缁夌喐鍩涢弫鐗堝祦鎼?- 娑撳秷鍏橀崣顏冪贩鐠ф牕澧犵粩顖欑炊閸欏倸鍠呯€规氨顫ら幋?
---

## 5. 鐠併倛鐦夋稉搴㈠房閺?
鐠併倛鐦夐柧鎹愮熅閻㈠彉浜掓稉瀣矋娴犺泛宕楁担婊冪暚閹存劧绱?
- `JWT Access Token`
- `Refresh Token`
- `Redis` 娴兼俺鐦介幀?- `auth_version`
- `revoked_after`
- 閸欘垶鈧?`2FA`
- 閸欘垶鈧?`API Key`

閹哄牊娼堥柧鎹愮熅閻㈠彉浜掓稉瀣劥閸掑棛绮嶉幋鎰剁窗

- `auth middleware`
- `tenant middleware`
- `authorization middleware`
- `Casbin AuthorizationService`

閸忔娊鏁痪锔芥将閿?
- 娑撳秷鍏橀惍鏉戞綎 `JWT + Refresh Token + Redis + revoked/version` 閸楀繋缍斿Ο鈥崇€?- 閺夊啴妾洪妴浣筋潡閼瑰眰鈧浇褰嶉崡鏇炲綁閺囨潙鎮楅棁鈧憰浣稿煕閺傛澘婀痪璺ㄦ暏閹撮攱宸块弶鍐┾偓?- 娴兼俺鐦介煪銏犲毉娑撳孩宸块弶鍐ㄥ煕閺傛媽顩﹂崠鍝勫瀻閿?  - 鏉烆垰鍩涢弬甯窗閹绘劕宕?`auth_version`
  - 绾剙銇戦弫鍫窗閸愭瑥鍙?`revoked_after`

---

## 6. Casbin 娑撳孩鏆熼幑顔芥綀闂?
Casbin 濡€崇€锋担宥勭艾閿涙瓪backend/config/rbac_model.conf`

瑜版挸澧犻弨顖涘瘮娑撱倗琚弶鍐閼宠棄濮忛敍?
- 鐠侯垳鏁辩痪?RBAC
- 閺佺増宓侀懠鍐ㄦ纯鏉╁洦鎶?
閺佺増宓侀懠鍐ㄦ纯閺€顖涘瘮閿?
- `all`
- `self`
- `dept`
- `dept_and_sub`
- `custom`

閼奉亜鐣炬稊澶庮潐閸掓瑥缍嬮崜宥夊櫚閻劌褰堥幒褑顕㈠▔鏇窗

- `dept:dept-a,dept-b`
- `dept_and_sub:dept-root`
- `project:project-a,project-b`
- `custom:field=value`

`custom:` 閸欘亜鍘戠拋鍝ユ閸氬秴宕熺€涙顔岄敍灞借嫙閺€顖涘瘮閸楃姳缍呯粭锔肩窗

- `@user_id`
- `@department_id`
- `@department_and_sub_ids`
- `@tenant_id`

---

## 7. 閺佺増宓佹惔鎾圭讣缁夊鍣搁悙?
閺堫剝鐤嗛柌宥囧仯鏉╀胶些閸栧懏瀚敍?
- `system_dict_types`
  - 娴犲骸鍙忕仦鈧崬顖欑閺€閫涜礋缁夌喐鍩涢崘鍛暜娑撯偓
- `system_roles`
  - 娴犲骸鍙忕仦鈧崬顖欑閺€閫涜礋缁夌喐鍩涢崘鍛暜娑撯偓
  - `data_scope` 闂€鍨閹绘劕宕岄崚?`255`

娑撳﹦鍤庨幍褑顢戠拠椋庣埠娑撯偓閸欏倽鈧喛绱?
- `backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md`

---

## 8. 閹恒儱褰涙稉搴℃惙鎼存梻瀹抽弶?
閹恒儱褰涢柆闈涙儕 REST 妞嬪孩鐗搁敍宀€绮烘稉鈧幐鍌氭躬 `/api/v1`

缂佺喍绔撮崫宥呯安鐟欏嫬鍨敍?
- 閹存劕濮涢敍姝歳esponse.Success` / `response.Created`
- 鐎广垺鍩涚粩顖炴晩鐠囶垽绱癭response.BadRequest`
- 閺堫亣顓荤拠渚婄窗`response.Unauthorized`
- 閺冪姵娼堥梽鎰剁窗`response.Forbidden`
- 閺堝秴濮熺粩顖炴晩鐠囶垽绱癭response.InternalError`

闁挎瑨顕ゅ☉鍫熶紖姒涙顓绘潻鏂挎礀缁嬪啿鐣?key 閹存牜菙鐎规岸鏁婄拠顖滅垳閿涘奔绗夐惄瀛樺复閺侊綀鎯ょ涵顒傜椽閻椒绗熼崝鈩冩瀮濡楀牄鈧?
---

## 9. 瀹搞儳鈻肩痪锔芥将

閸氬海顏弬鏉款杻閹存牔鎱ㄩ弨閫涘敩閻焦妞傞敍灞肩喘閸忓牓浼掔€瑰牞绱?
- 閸忓牊鐓￠弬鍥ㄣ€傞敍灞藉晙閺€閫涘敩閻?- 閸忓牅鎱ㄩ弽鐟版礈閿涘奔绗夐崑姘炽€冮棃銏Ｋ夋稉?- 娑撳秷顩︾紒鏇炵磻缁夌喐鍩涙稉濠佺瑓閺?- 娑撳秷顩﹂弬浼粹偓鐘殿儑娴滃苯顨滈弶鍐娴ｆ挾閮?- 娑撳秷顩﹂幎濠佺瑹閸旓繝鈧槒绶崼鍡氱箻 `main.go` 閹?`app.Start()`
- 娑撳秷顩﹂幎濠佺皑閸斅ょ珶閻ｅ奔绗呭▽澶婂煂 handler

---

## 10. 瀵偓閸欐垳绗屾宀冪槈

鐢摜鏁ら崨鎴掓姢閿?
```bash
# 閸涜棄鎮曞Λ鈧弻?go run ./cmd/tools/check-backend-naming

# 閸忋劑鍣哄ù瀣槸
go test ./...

# 娴犲懓绺肩粔?PANTHEON_MIGRATE_ONLY=true go run ./cmd/server
```

婵″倹鐏夋担璺ㄦ暏 Makefile閿?
```bash
make -f backend/Makefile naming
make -f backend/Makefile test
make -f backend/Makefile verify
make -f backend/Makefile migrate-only
```

---

## 11. 瑜版挸澧犳稉鑽ゅ殠濡€虫健

瑜版挸澧犻獮鍐插酱閺嶇绺炬稉鑽ゅ殠閸欘亝婀佹稉澶婃健閿?
- `auth`
- `tenant`
- `system`

閸氬海鐢婚弬鏉款杻濡€虫健閺冭绱濇导妯哄帥娣囨繃瀵旈敍?
- 閸忋儱褰涘〒鍛珰
- 閸掑棗鐪伴弰搴ｂ€?- 閺夊啴妾洪幒銉ュ弳娑撯偓閼?- 缁夌喐鍩涙潏鍦櫕閺勫海鈥?- 閺傚洦銆傞崥灞绢劄閺囧瓨鏌?
