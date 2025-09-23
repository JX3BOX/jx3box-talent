# 奇穴模拟器

> 讲个笑话，之前写的时候，只有上帝和我知道我写了些什么  
> 现在，只有上帝知道了……  
> 先酱，给一个无限期的承诺，或许有一天我会重构。  

## 测试

```bash
npx vite --port=4000

# 访问：http://localhost:4000/test/index.html
```

**注意**：由于vite支持大多数新版本的特性，但是现有的大多数前端项目依旧使用的webpack搭配旧版本的loader，所以某些新语法可能会爆炸。发版前请先将index.js内容复制到某个前端项目的node_modules内看能不能跑起来~

## 使用空白配置

```javascript
let talent = new JX3_QIXUE()
```

## 使用指定配置

返回一个promise,参数为该talent实例

```javascript
let talent = new JX3_QIXUE({
    "xf":"冰心诀",
    "sq":"1,2,4,1,2,3,1,2,3,4,4,4",
    "editable":true
});
```

## 重载配置/方案

返回一个promise,参数为该talent实例

```javascript
talent.load({
    "xf":"冰心诀",
    "sq":"1,2,4,1,2,3,1,2,3,4,4,4",
    "editable":true
})
```

## 全局事件

任何修改，会触发`JX3_QIXUE_Change`全局事件，传递talent实例作为参数

```javascript
$(document).on("JX3_QIXUE_Change", function(e, ins) {
    let __data = {};
    __data.version = ins.version;
    __data.xf = ins.xf;
    __data.sq = ins.sq.join(",");
    let str = JSON.stringify(__data);
});
```

## 其它属性

![Talent](./talent.png)
