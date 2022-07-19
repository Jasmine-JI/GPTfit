# 多國語系Excel文件轉Json格式檔案

## 轉換流程
### 整理文件並生成"Unicode 文字"格式的txt檔

1. 將整個文件取消隱藏，避免因隱藏欄位影響轉換程式。
2. 複製文件後，將"完整代碼"欄位複製並在原地以值貼上蓋掉表格算式。
3. 點選整個table後，點擊清除格式（可避免儲存格內內容過長，轉檔時產生"###"的情況）。
4. 除了"完整代碼"欄位和語系欄位，其餘欄位全部刪除。
5. 點選另存新檔後，選擇"Unicode 文字"格式後自行命名並存檔。

### 將txt檔轉碼並轉為Json格式檔案
1. 新增py檔並將最下方程式碼依檔案名稱和路經修改後貼上並存檔，在 terminal 執行 `python fileName.py` 即可將所有txt檔轉為Json格式檔案。

2. 檢查生成的json檔有無問題（如有空鍵，回文件將文件內的換行刪除再重頭開始轉換流程。如語系欄位順序變動或新增，則需改寫此程式）。

3. 使用編輯器比較功能，比較舊有同語系Json檔跟新Json檔，是否有變更變數，並調整。

4. 最後將所有Json檔複製貼到專案指定路徑底下即可（./web/src/assets/i18n）。

```python
import os, sys
import json

fileList = [
    'zh-tw',
    'zh-cn',
    'en-us',
    'es-es',
    'de-de',
    'fr-fr',
    'it-it',
    'pt-pt'
]

# 將txt由UTF-16-LE編譯成UTF-8（開發時為了比較好debug將不同格式分開資料夾存放，可自行合併資料夾）
oldPath = './waitConvert/utf16le.txt'
oldFile = open(oldPath, 'r', encoding = 'utf-16-le')
newPath = './converted/utf8.txt'
newFile = open(newPath, 'w', encoding = 'UTF-8', newline='')

oldContent = oldFile.read()
newFile.write(oldContent)

oldFile.close()
newFile.close()

# 將[**str**]轉成{{str}}，最後輸出成json檔。
for i in range(len(fileList)):
    try:
        txtFile = open(newPath, 'r', encoding = 'UTF-8')
        txtContent = txtFile.read()
        strContent = str(txtContent).replace(',', '++') # 將內容逗號先行轉換後，之後轉換json的逗號，內容才不受影響。

        # 利用分行當作拆分列的依據
        arrContent = strContent.split('\r\n')
        arrayContent = arrContent[0].split('\n')
        obj = {}
        for arr in arrayContent:
            try:
                # 利用'tab'當作拆分欄位的依據(arr.split('\t')[0] => 完整代碼, arr.split('\t')[1] => 繁中...，以此類推)
                if len(arr.split('\t')[0]) > 0 and len(arr.split('\t')) >= 2 and arr.split('\t')[1] != '':
                    if len(arr.split('\t')) > 8:

                        if arr.split('\t')[i + 1] != '':
                            obj[arr.split('\t')[0]] = arr.split('\t')[i + 1]
                        
                        elif arr.split('\t')[i + 1] == '':

                            if arr.split('\t')[2] != '':
                                obj[arr.split('\t')[0]] = arr.split('\t')[2]

                            else:
                                obj[arr.split('\t')[0]] = arr.split('\t')[1]

                    # 文件該鍵只翻譯到英文之前
                    elif i == 2:

                        if len(arr.split('\t')) > 3 and arr.split('\t')[3] != '':
                            obj[arr.split('\t')[0]] = arr.split('\t')[3]

                        else:
                            obj[arr.split('\t')[0]] = arr.split('\t')[1]

                    # 文件該鍵只翻譯到簡體之前
                    elif i == 1:

                        if len(arr.split('\t')) > 2 and arr.split('\t')[2] != '':
                            obj[arr.split('\t')[0]] = arr.split('\t')[2]

                        else:
                            obj[arr.split('\t')[0]] = arr.split('\t')[1]

                    # 文件該鍵僅繁體
                    else:
                        obj[arr.split('\t')[0]] = arr.split('\t')[1]
                
            except ValueError as e:
                print ('Split error.', e)

        # 將json檔整理過
        finalContent = json.dumps(obj, ensure_ascii = False)\
            .replace('\u00A0', '')\
            .replace("[**", r"{{")\
            .replace("**]", r"}}")\
            .replace(r"{{break}}", r"<br />")\
            .replace("(縮字)", '')\
            .replace("(缩字)", '')\
            .replace(r'\"', '')\
            .replace(',', ',\n')\
            .replace('++', ',')\
            .replace(r' ":', r'":')

        jsonPath = './json/%s.json' % fileList[i]
        jsonFile = open(jsonPath, 'w', encoding = 'UTF-8', newline='')
        jsonFile.write(finalContent)
        jsonFile.close()
        
        print ('%s is converted' % fileList[i])

    except ValueError as e:
        print ('Edit file error.', e)

```

