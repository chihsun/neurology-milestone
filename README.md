# 神經學里程碑評估 2.0 — GitHub Pages + Firebase 版

## 功能
- 21 項核心能力皆必填。
- 每項為下拉式單選：Level 1 / 1.5 / 2 / 2.5 / 3 / 3.5 / 4 / 4.5 / 5，以及三種免評／不適用。
- 下拉選項直接顯示 Level + 原始說明；選定後下方顯示完整說明與舉例。
- 評估日期預設今天、評估者欄位、總評語。
- Firebase Email/Password 登入。
- Firestore 雲端儲存，可跨電腦瀏覽歷次結果。
- 六大核心能力平均趨勢圖。
- 21 項單項趨勢圖與初次/最近變化表。
- Light / Dark / 跟隨系統。
- JSON 匯出與單筆刪除。

## A. Firebase 設定
1. 到 Firebase Console 建立 Project。
2. Project Overview → Add app → Web，建立 Web App。
3. 將 Firebase 提供的 `firebaseConfig` 貼到 `firebase-config.js`。
4. Authentication → Sign-in method → 啟用 **Email/Password**。
5. Authentication → Users → 建立教師帳號。
6. Firestore Database → 建立 database。
7. 將 `firestore.rules` 的內容貼到 Firestore → Rules 並 Publish。
8. 在 Authentication → Users 複製該教師帳號的 **UID**。
9. Firestore → Data → 建立 collection：`authorizedUsers`，再建立 document：
   - Document ID：剛剛複製的 UID
   - 可放欄位：`email` = 教師 email（欄位內容只是方便管理，規則主要看 document 是否存在）

只有同時「能登入」且其 UID 存在 `authorizedUsers/{uid}` 的帳號，才能讀寫評估資料。

## B. GitHub Pages 部署
1. 建立一個 public GitHub repository，例如 `neurology-milestone`。
2. 把這個資料夾內的所有檔案上傳到 repository 根目錄。
3. GitHub repository → **Settings → Pages**。
4. Build and deployment → Source 選 **Deploy from a branch**。
5. Branch 選 `main`，Folder 選 `/(root)`，按 Save。
6. GitHub 會提供網址，例如：
   `https://YOUR-ACCOUNT.github.io/neurology-milestone/`
7. Firebase Console → Authentication → Settings → Authorized domains，確認 GitHub Pages 網域可使用；若登入被阻擋，加入 `YOUR-ACCOUNT.github.io`。

## C. 趨勢圖計算規則
- `Level 1` → 1、`Level 1.5` → 1.5 … `Level 5` → 5。
- 三種免評／不適用不轉成 0，而是從平均與趨勢計算中排除。
- 六大核心能力圖：同一次評估中，將該類別內可數值化項目取平均。
- 單項圖：顯示該項歷次可數值 Level；免評紀錄為空點，不錯誤拉低分數。

## D. 安全提醒
- 不要把住院醫師評估結果存進 GitHub repository。
- `firebase-config.js` 本身不是資料庫密碼；資料存取必須依靠 Authentication 與 Firestore Security Rules。
- `authorizedUsers` 不允許前端自行寫入，避免任何登入者自行授權自己。

## 本機測試
由於網站使用 ES modules，直接雙擊 `index.html` 可能被瀏覽器限制。建議在此資料夾執行：

```bash
python -m http.server 8000
```

然後開啟：`http://localhost:8000/login.html`
