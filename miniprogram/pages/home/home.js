// 获取应用实例
const app = getApp();

Page({
  data: {
    userInfo: {},
    todaySales: 0,
    todayRevenue: '0.00',
    visitorCount: 0,
    hasStall: false,
    userMenus: [] // 用户权限菜单
  },

  onLoad: function() {
    // 页面加载时加载用户信息和页面数据
    this.loadPageData();
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadPageData();
  },

  // 加载页面数据
  loadPageData: function() {
    // 加载用户信息（现在是自动的）
    this.loadUserInfo();
    
    // 如果已登录，加载需要登录状态的数据
    if (app.isLoggedIn()) {
      this.loadTodayStats();
      this.checkStallStatus();
      this.loadUserMenus();
    } else {
      console.log('用户正在登录中或登录失败，稍后会自动加载数据');
      // 等待登录完成后重新加载数据
      setTimeout(() => {
        if (app.isLoggedIn()) {
          this.loadPageData();
        }
      }, 2000);
    }
  },

  // 加载用户信息
  loadUserInfo: function() {
    const userInfo = app.getUserInfo();
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      });
    }
  },

  // 加载用户权限菜单
  loadUserMenus: function() {
    const menus = app.getUserMenus();
    this.setData({
      userMenus: menus
    });
  },

  // 加载今日统计数据
  loadTodayStats: function() {
    // 模拟数据，实际项目中应该从后台API获取
    const today = new Date().toDateString();
    const cachedStats = wx.getStorageSync(`stats_${today}`);
    
    if (cachedStats) {
      this.setData({
        todaySales: cachedStats.sales || 0,
        todayRevenue: cachedStats.revenue || '0.00',
        visitorCount: cachedStats.visitors || 0
      });
    } else {
      // 模拟今日数据
      this.setData({
        todaySales: 12,
        todayRevenue: '258.50',
        visitorCount: 47
      });
    }

    // 实际项目中的API调用
    this.fetchTodayStatsFromServer();
  },

  // 检查小摊状态
  checkStallStatus: function() {
    const stallInfo = wx.getStorageSync('stallInfo');
    const hasStall = !!(stallInfo && stallInfo.name);
    
    this.setData({
      hasStall: hasStall
    });
  },

  // 从服务器获取今日统计
  fetchTodayStatsFromServer: function() {
    if (!app.isLoggedIn()) {
      console.log('用户未登录，跳过统计请求');
      return;
    }
    
    const that = this;
    const openid = app.getOpenid();
    
    wx.request({
      url: app.globalData.serverConfig.baseUrl + '/api/stats/today',
      method: 'GET',
      data: {
        openid: openid
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('统计数据响应：', res.data);
        if (res.data && res.data.code === 200) {
          const stats = res.data.data;
          const today = new Date().toDateString();
          
          that.setData({
            todaySales: stats.sales || 0,
            todayRevenue: stats.revenue || '0.00',
            visitorCount: stats.visitors || 0
          });
          
          // 缓存今日统计
          wx.setStorageSync(`stats_${today}`, stats);
        }
      },
      fail: (err) => {
        console.error('获取今日统计失败', err);
      }
    });
  },

  // 进入我的小摊
  goToMyStall: function() {
    if (!this.data.hasStall) {
      // 如果没有创建小摊，引导创建
      wx.showModal({
        title: '提示',
        content: '您还没有创建小摊，现在去创建吗？',
        success: (res) => {
          if (res.confirm) {
            this.createStall();
          }
        }
      });
      return;
    }

    // 跳转到出摊页面
    wx.switchTab({
      url: '/pages/stall/stall'
    });
  },

  // 逛逛其他小摊
  browseStalls: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
    
    // TODO: 跳转到小摊列表页面
    // wx.navigateTo({
    //   url: '/pages/market/market'
    // });
  },

  // 创建小摊
  createStall: function() {
    wx.showModal({
      title: '创建小摊',
      content: '请输入您的小摊名称',
      editable: true,
      placeholderText: '我的小摊',
      success: (res) => {
        if (res.confirm && res.content) {
          const stallInfo = {
            name: res.content.trim(),
            createTime: new Date().toISOString(),
            status: 'active'
          };
          
          // 保存小摊信息
          wx.setStorageSync('stallInfo', stallInfo);
          
          this.setData({
            hasStall: true
          });
          
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转到库存管理
  goToInventory: function() {
    wx.switchTab({
      url: '/pages/inventory/inventory'
    });
  },

  // 跳转到销售统计
  goToSales: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
    
    // TODO: 跳转到销售统计页面
    // wx.navigateTo({
    //   url: '/pages/statistics/statistics'
    // });
  },

  // 跳转到个人中心
  goToProfile: function() {
    wx.showActionSheet({
      itemList: ['编辑资料', '设置', '关于', '退出登录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.editProfile();
            break;
          case 1:
            this.openSettings();
            break;
          case 2:
            this.showAbout();
            break;
          case 3:
            this.logout();
            break;
        }
      }
    });
  },

  // 编辑资料（获取用户详细信息）
  editProfile: function() {
    const that = this;
    
    if (!app.isLoggedIn()) {
      wx.showToast({
        title: '请稍等，正在登录...',
        icon: 'none'
      });
      return;
    }
    
    app.getUserProfile(function(profileRes) {
      if (profileRes.success) {
        that.setData({
          userInfo: profileRes.data
        });
        
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '获取信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 打开设置
  openSettings: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 显示关于
  showAbout: function() {
    wx.showModal({
      title: '关于摆摊平台',
      content: '这是一个帮助小摊主管理生意的小程序，让摆摊变得更简单、更高效。',
      showCancel: false
    });
  },

  // 退出登录
  logout: function() {
    const that = this;
    
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '退出中...'
          });
          
          // 调用应用退出登录方法
          app.logout(function(logoutRes) {
            wx.hideLoading();
            
            // 清除页面数据
            that.setData({
              userInfo: app.getUserInfo(),
              todaySales: 0,
              todayRevenue: '0.00',
              visitorCount: 0
            });
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            });
            
            // 重新加载页面数据（会触发重新登录）
            setTimeout(() => {
              that.loadPageData();
            }, 1000);
          });
        }
      }
    });
  }
});