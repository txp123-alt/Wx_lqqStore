// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: "",
      
      // 用户登录状态信息
      userInfo: null,
      openid: null,
      session_key: null,
      loginStatus: false, // 登录状态：false-未登录，true-已登录
      loginRetryCount: 0, // 登录重试计数器
      
      // 后台服务器配置
      serverConfig: {
        baseUrl: 'http://192.168.79.1:8080', // 本地后台服务器地址
        apiPrefix: '/api' // API接口前缀
      }
    };

    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 应用启动时自动执行无感知登录流程
    this.autoLogin();
  },

  // 自动无感知登录流程（微信官方推荐）
  autoLogin: function() {
    const that = this;
    
    console.log('开始自动登录流程');
    
    // 检查本地是否有有效的登录缓存
    if (this.checkLocalLoginCache()) {
      console.log('使用本地登录缓存，跳过登录流程');
      return;
    }
    
    // 执行静默登录
    this.silentLogin();
  },

  // 检查本地登录缓存
  checkLocalLoginCache: function() {
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');
    const loginTime = wx.getStorageSync('loginTime');
    
    // 检查是否有有效的登录信息（登录有效期7天）
    if (openid && userInfo && loginTime) {
      const now = new Date().getTime();
      const loginExpired = (now - loginTime) > (7 * 24 * 60 * 60 * 1000); // 7天过期
      
      if (!loginExpired) {
        // 登录未过期，使用缓存数据
        this.globalData.openid = openid;
        this.globalData.userInfo = userInfo;
        this.globalData.loginStatus = true;
        
        // 异步拉取最新的用户状态
        this.refreshUserStatus();
        
        return true;
      } else {
        console.log('登录缓存已过期，清除缓存');
        this.clearLoginCache();
      }
    }
    
    return false;
  },

  // 静默登录（用户无感知）
  silentLogin: function() {
    const that = this;
    
    console.log('===== 开始静默登录 =====');
    console.log('当前重试次数:', this.globalData.loginRetryCount || 0);
    
    // 登录流程（1）：调用wx.login()获取临时登录凭证code
    wx.login({
      timeout: 5000, // 设置超时时间为5秒
      success: function(res) {
        if (res.code) {
          console.log('登录流程（1）：获取code成功');
          console.log('code值:', res.code);
          console.log('code长度:', res.code.length);
          console.log('获取时间:', new Date().toISOString());
          
          // 验证code格式（微信code通常是32位字符）
          if (res.code.length !== 32) {
            console.warn('⚠️ 警告：code长度异常，预期32位，实际', res.code.length, '位');
          }
          
          // 登录流程（2）：将code发送到后台服务器
          that.sendCodeToServer(res.code, function(serverRes) {
            if (serverRes.success) {
              console.log('✅ 登录流程（2）：后台处理成功，获得openid');
              console.log('openid:', serverRes.data.openid);
              
              // 登录成功，重置重试计数
              that.globalData.loginRetryCount = 0;
              
              // 保存登录信息到本地
              that.saveLoginInfo(serverRes.data);
              
              // 登录流程（3）：使用openid拉取用户状态（菜单权限等）
              that.fetchUserStatus(serverRes.data.openid, function(userStatusRes) {
                if (userStatusRes.success) {
                  console.log('✅ 登录流程（3）：拉取用户状态成功');
                  
                  // 登录流程（4）：更新用户信息
                  const updatedUserInfo = Object.assign({}, serverRes.data.userInfo || {}, userStatusRes.data);
                  that.globalData.userInfo = updatedUserInfo;
                  wx.setStorageSync('userInfo', updatedUserInfo);
                  
                  // 登录流程（5）：登录完成，更新全局状态
                  that.globalData.loginStatus = true;
                  
                  console.log('🎉 自动登录流程完成');
                  console.log('===== 登录成功 =====');
                } else {
                  console.error('❌ 登录流程（3）：拉取用户状态失败，使用基础登录信息');
                  console.error('失败原因:', userStatusRes.message);
                  // 即使拉取用户状态失败，基本的登录状态也已建立
                  that.globalData.loginStatus = true;
                }
              });
            } else {
              console.error('❌ 登录流程（2）：后台处理失败');
              console.error('失败详情:', serverRes);
              console.error('可能原因：后台配置错误、AppID不匹配、AppSecret错误');
              // 登录失败，触发重试机制
              that.handleLoginFailure();
            }
          });
        } else {
          console.error('❌ 登录流程（1）：获取code失败');
          console.error('错误信息:', res.errMsg);
          that.handleLoginFailure();
        }
      },
      fail: function(err) {
        console.error('❌ wx.login调用失败：', err);
        console.error('可能原因：网络问题、微信服务异常');
        that.handleLoginFailure();
      }
    });
  },

  // 处理登录失败的情况
  handleLoginFailure: function() {
    console.log('登录失败，应用以游客模式运行');
    this.globalData.loginStatus = false;
    
    // 设置默认用户信息
    this.globalData.userInfo = {
      nickName: '游客用户',
      avatarUrl: '/images/avatar.png'
    };
    
    // 智能重试机制：最多重试3次，每次间隔递增
    const retryCount = this.globalData.loginRetryCount || 0;
    
    if (retryCount < 3) {
      this.globalData.loginRetryCount = retryCount + 1;
      const retryDelay = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
      
      console.log(`将在 ${retryDelay/1000} 秒后进行第 ${this.globalData.loginRetryCount} 次重试`);
      
      setTimeout(() => {
        console.log(`===== 第 ${this.globalData.loginRetryCount} 次登录重试 =====`);
        this.silentLogin();
      }, retryDelay);
    } else {
      console.log('已达到最大重试次数，停止自动重试');
      console.log('用户需要手动刷新页面或重启应用来重新尝试登录');
      
      // 重置重试计数，允许下次启动时重试
      this.globalData.loginRetryCount = 0;
    }
  },

  // 刷新用户状态（异步）
  refreshUserStatus: function() {
    if (!this.globalData.openid) return;
    
    const that = this;
    this.fetchUserStatus(this.globalData.openid, function(userStatusRes) {
      if (userStatusRes.success) {
        console.log('用户状态更新成功');
        // 更新用户信息
        const updatedUserInfo = Object.assign({}, that.globalData.userInfo || {}, userStatusRes.data);
        that.globalData.userInfo = updatedUserInfo;
        wx.setStorageSync('userInfo', updatedUserInfo);
      }
    });
  },

  // 清除登录缓存
  clearLoginCache: function() {
    wx.removeStorageSync('openid');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('loginTime');
    wx.removeStorageSync('session_key');
    this.globalData.openid = null;
    this.globalData.userInfo = null;
    this.globalData.session_key = null;
    this.globalData.loginStatus = false;
  },

  // 发送code到后台服务器换取openid
  sendCodeToServer: function(code, callback) {
    const that = this;
    
    wx.request({
      url: that.globalData.serverConfig.baseUrl + '/api/auth/login',
      method: 'POST',
      data: {
        code: code
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log('后台响应登录请求：', res.data);
        if (res.data && res.data.code === 200) {
          callback({
            success: true,
            data: res.data.data,
            message: res.data.message || '登录成功'
          });
        } else {
          callback({
            success: false,
            message: res.data?.message || '后台登录处理失败'
          });
        }
      },
      fail: function(err) {
        console.error('请求后台登录接口失败：', err);
        callback({
          success: false,
          message: '网络请求失败'
        });
      }
    });
  },

  // 保存登录信息
  saveLoginInfo: function(loginData) {
    const now = new Date().getTime();
    
    // 保存到本地存储
    wx.setStorageSync('openid', loginData.openid);
    wx.setStorageSync('session_key', loginData.session_key);
    wx.setStorageSync('loginTime', now);
    
    if (loginData.userInfo) {
      wx.setStorageSync('userInfo', loginData.userInfo);
    }
    
    // 更新全局数据
    this.globalData.openid = loginData.openid;
    this.globalData.session_key = loginData.session_key;
    this.globalData.userInfo = loginData.userInfo;
  },

  // 拉取用户状态（菜单权限等）
  fetchUserStatus: function(openid, callback) {
    const that = this;
    
    wx.request({
      url: that.globalData.serverConfig.baseUrl + '/api/user/status',
      method: 'GET',
      data: {
        openid: openid
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log('用户状态响应：', res.data);
        if (res.data && res.data.code === 200) {
          callback({
            success: true,
            data: res.data.data,
            message: res.data.message || '获取用户状态成功'
          });
        } else {
          callback({
            success: false,
            message: res.data?.message || '获取用户状态失败'
          });
        }
      },
      fail: function(err) {
        console.error('请求用户状态接口失败：', err);
        callback({
          success: false,
          message: '网络请求失败'
        });
      }
    });
  },

  // 获取用户信息（新版API，需要用户主动授权）
  getUserProfile: function(callback) {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功：', res.userInfo);
        
        // 更新全局和本地存储的用户信息
        this.globalData.userInfo = res.userInfo;
        wx.setStorageSync('userInfo', res.userInfo);
        
        if (callback) callback({
          success: true,
          data: res.userInfo
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err);
        if (callback) callback({
          success: false,
          message: '用户拒绝授权'
        });
      }
    });
  },

  // 退出登录
  logout: function(callback) {
    // 清除本地登录信息
    this.clearLoginCache();
    
    // 通知后台退出登录（可选）
    if (this.globalData.openid) {
      wx.request({
        url: this.globalData.serverConfig.baseUrl + '/api/user/logout',
        method: 'POST',
        data: {
          openid: this.globalData.openid
        },
        success: function(res) {
          console.log('退出登录响应：', res.data);
        },
        fail: function(err) {
          console.error('退出登录请求失败：', err);
        },
        complete: function() {
          if (callback) callback({ success: true });
        }
      });
    } else {
      if (callback) callback({ success: true });
    }
  },

  // 检查用户是否登录
  isLoggedIn: function() {
    return this.globalData.loginStatus;
  },

  // 获取当前用户openid
  getOpenid: function() {
    return this.globalData.openid;
  },

  // 获取当前用户信息
  getUserInfo: function() {
    return this.globalData.userInfo || {
      nickName: '游客用户',
      avatarUrl: '/images/avatar.png'
    };
  },

  // 获取用户权限菜单（根据用户状态）
  getUserMenus: function() {
    // 根据用户状态返回可访问的菜单
    const userInfo = this.getUserInfo();
    const userStatus = userInfo.userStatus || {};
    
    // 这里可以根据后台返回的用户权限动态生成菜单
    // 暂时返回默认菜单
    return [
      {
        id: 'home',
        name: '首页',
        icon: 'home',
        path: '/pages/home/home'
      },
      {
        id: 'stall',
        name: '出摊',
        icon: 'business',
        path: '/pages/stall/stall'
      },
      {
        id: 'inventory',
        name: '库存',
        icon: 'goods',
        path: '/pages/inventory/inventory'
      }
    ];
  },

  globalData: {
    userInfo: null,
    openid: null,
    session_key: null,
    loginStatus: false
  }
});