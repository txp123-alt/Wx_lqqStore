Page({
  data: {
    userInfo: {},
    todaySales: 0,
    todayRevenue: '0.00',
    visitorCount: 0,
    hasStall: false
  },

  onLoad: function() {
    this.loadUserInfo();
    this.loadTodayStats();
    this.checkStallStatus();
  },

  onShow: function() {
    // 每次显示页面时刷新统计数据
    this.loadTodayStats();
  },

  // 加载用户信息
  loadUserInfo: function() {
    // 获取缓存的用户信息
    const cachedUserInfo = wx.getStorageSync('userInfo');
    if (cachedUserInfo) {
      this.setData({
        userInfo: cachedUserInfo
      });
    }

    // 如果没有缓存的用户信息，尝试获取用户授权
    if (!cachedUserInfo) {
      this.getUserProfile();
    }
  },

  // 获取用户信息
  getUserProfile: function() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          userInfo: userInfo
        });
        // 缓存用户信息
        wx.setStorageSync('userInfo', userInfo);
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
        // 设置默认信息
        this.setData({
          userInfo: {
            nickName: '摊主',
            avatarUrl: '/images/default-avatar.png'
          }
        });
      }
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
    // TODO: 实际项目中调用后台API
    /*
    wx.request({
      url: 'https://your-api.com/api/stats/today',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const stats = res.data.data;
          const today = new Date().toDateString();
          
          this.setData({
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
    */
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

  // 编辑资料
  editProfile: function() {
    this.getUserProfile();
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
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息缓存
          wx.removeStorageSync('userInfo');
          this.setData({
            userInfo: {
              nickName: '游客',
              avatarUrl: '/images/default-avatar.png'
            }
          });
          
          wx.showToast({
            title: '已退出',
            icon: 'success'
          });
        }
      }
    });
  }
});