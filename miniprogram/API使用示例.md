# API使用示例

## 后台返回数据格式

登录成功后台返回：
```json
{
  "code": 200,
  "data": {
    "expiresIn": 100,
    "token": "testToken", 
    "openid": "123456"
  },
  "message": "登录成功"
}
```

## 使用新的请求方法

现在所有API请求都应该使用 `app.request()` 方法，它会自动：
1. 拼接完整的URL
2. 携带token在请求头中
3. 处理token过期自动重新登录
4. 使用Promise简化回调

### 使用示例

```javascript
const app = getApp();

// GET请求
app.request({
  url: '/api/user/profile',
  method: 'GET'
}).then(res => {
  if (res.code === 200) {
    console.log('获取用户信息成功:', res.data);
  }
}).catch(err => {
  console.error('请求失败:', err);
});

// POST请求
app.request({
  url: '/api/order/create',
  method: 'POST',
  data: {
    productId: 1,
    quantity: 2
  }
}).then(res => {
  if (res.code === 200) {
    console.log('订单创建成功:', res.data);
  }
}).catch(err => {
  console.error('创建订单失败:', err);
});
```

## Token自动处理

1. **自动携带**：所有请求会自动在header中添加 `Authorization: Bearer {token}`
2. **自动过期处理**：如果返回code为401，会自动清除token并重新登录
3. **自动重试**：token过期重新登录后，会自动重新发起原请求

## 权限控制

### 获取用户菜单权限
```javascript
const menus = app.getUserMenus();
console.log('当前用户权限:', menus);
```

### 检查页面权限
```javascript
const hasPermission = app.hasPagePermission('/pages/stall/stall');
if (!hasPermission) {
  // 用户无权限，处理逻辑
}
```

## 更新现有页面

所有页面的网络请求都需要从 `wx.request` 改为 `app.request`：

### 修改前：
```javascript
wx.request({
  url: app.globalData.serverConfig.baseUrl + '/api/stats/today',
  method: 'GET',
  data: { openid: openid },
  header: { 'content-type': 'application/json' },
  success: (res) => { /* 处理成功 */ },
  fail: (err) => { /* 处理失败 */ }
});
```

### 修改后：
```javascript
app.request({
  url: '/api/stats/today',
  method: 'GET',
  data: { openid: openid }
}).then(res => {
  // 处理成功
}).catch(err => {
  // 处理失败
});
```

## 需要更新的页面

以下页面需要更新网络请求方法：

1. **pages/home/home.js** - 今日统计数据
2. **pages/stall/stall.js** - 出摊相关数据
3. **pages/inventory/inventory.js** - 库存管理数据
4. **pages/booking/booking.js** - 商品预订数据

建议逐一更新这些页面，确保使用新的 `app.request()` 方法。