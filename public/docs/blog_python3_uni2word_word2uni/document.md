#blog#python3#uni2word#word2uni
2022/07/01
# Python3 文字與unicode互轉
### word2unicode
文字轉unicode較為簡單，用ord(x)即可
```python
import re
def word2unicode(x):
    uni = hex(ord(x))
    uni = re.sub("^0x", "", uni).upper()
    return uni
word2unicode("字") # 5B57
```

### uni2word
我們在python shell中輸入unicode；python會直接幫我們進行轉換
```shell
>>> '\u5B57' # 字
```
但是若想使用變數組合將文字型態的unicode轉換為文字，如`'\u' + var`的方式 

```shell
>>> uni_str = '5B57'
>>> word = '\u' + uni_str
File "<stdin>", line 1
    word = '\u' + uni_str
                ^
SyntaxError: (unicode error) 'unicodeescape' codec can't decode bytes in position 0-1: truncated \uXXXX escape
```

#### 解法
先用跳脫字元跳脫`\u`接著轉換成bytes，並解在解選時選用`unicode_escape`
```python
def uni2word(uni):
    word = bytes(f"\\u{uni}",'utf-8').decode(encoding='unicode_escape')
    return word
uni2word('5B57') # 字
```

    