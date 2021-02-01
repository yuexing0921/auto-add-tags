# 说明
通过读取react、vue源码，获取AST，然后通过一定的规则动态的添加data标签，项目的初衷是为了标识埋点而创建
## 功能
1. 自动对代码进行埋点
2. check是否有重复埋点

## 快速使用

通过命令行的方式
``` bash
## 在项目的根目录下输入aat，默认类型是react代码
aat
## 如果是vue项目
aat -t vue 
```

通过代码的方式方式调用
``` javascript 
const addTags = require("auto-add-tags")
// 默认react代码
addTags.main()
// 如果是vue项目
addTags.main({type: "vue"})
```

如果需要更高级别的定制，可以参考下面的选项
## Reference
###  -d, --dir 
The directory or file to be converted, the default is the current src directory 

[字符串] [必需] [默认值: "src"]

###  -d, --dir 
The directory or file to be converted, the default is the current src directory 

[字符串] [必需] [默认值: "src"]

###  -d, --dir 
The directory or file to be converted, the default is the current src directory 

[字符串] [必需] [默认值: "src"]

###  -t, --type 
The supported type is react by default, and you can also enter vue|react

[字符串] [必需] [默认值: "src"]

###  -d, --dir 
The directory or file to be converted, the default is the current src directory 

[字符串] [必需] [默认值: "src"]
###  --tagName
Automatically insert tags, the default value is data-xt

[字符串] [必需] [默认值: "data-xt"]

###  --min
The starting value of automatically adding tags, the default value is 0

[数字] [必需] [默认值: 0]
###  --max
The maximum value of automatically added tags, the default value is Number.MAX_SAFE_INTEGER

[数字] [必需] [默认值: 9007199254740991]

###   -f, --force
force updates                       

[布尔] [默认值: false]
###  -e, --elementNames
 Which components need to be tracked? not case sensitive，the default value is [link,a,route]  -e link a route 
 
[数组] [默认值: ["a","link","route"]]
###  --eventNames
What events need to be tracked? not case sensitive。 the default value is [onclick,onsubmit]  --eventNames onclick onsubmit 

[数字] [必需] [默认值: 9007199254740991]
###   -c, --check 
Check if there are duplicate tags

[布尔] [默认值: false]
###  -r, --resultFile
Insert point record   
[字符串] [默认值: "tracePoint.json"]
