const app = getApp();

Page({
  data: {
    myBookings: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    activeTab: 'all', // all, pending, completed, cancelled
    filterTabs: [
      { key: 'all', name: '全部' },
      { key: 'pending', name: '待确认' },
      { key: 'delivering', name: '配送中' },
      { key: 'completed', name: '已完成' },
      { key: 'cancelled', name: '已取消' }
    ]
  },

  onLoad: function() {
    // 我的预定页面是默认权限，总是允许访问
    // if (!app.hasPagePermission('/pages/mybooking/mybooking')) {
    //   wx.showModal({
    //     title: '权限不足',
    //     content: '您没有访问此页面的权限',
    //     showCancel: false,
    //     success: () => {
    //       wx.switchTab({
    //         url: '/pages/booking/booking'
    //       });
    //     }
    //   });
    //   return;
    // }
    
    this.loadMyBookings();
  },

  onShow: function() {
    // 更新自定义TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateTabBar();
      this.getTabBar().updateSelected();
    }
  },

  // 加载我的预定
  loadMyBookings: function() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    const openid = app.getOpenid();
    
    if (!openid) {
      this.setData({ loading: false });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    app.request({
      url: '/api/booking/my',
      method: 'GET',
      data: {
        openid: openid,
        status: this.data.activeTab,
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      if (res && res.code === 200) {
        const newBookings = res.data || [];
        
        this.setData({
          myBookings: this.data.page === 1 ? newBookings : [...this.data.myBookings, ...newBookings],
          loading: false,
          hasMore: newBookings.length >= this.data.pageSize,
          page: this.data.page + 1
        });
        
        // 保存到本地存储
        wx.setStorageSync('myBookings', this.data.myBookings);
      } else {
        this.setData({ loading: false });
        wx.showToast({
          title: res?.message || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('加载我的预定失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 切换筛选标签
  switchFilterTab: function(e) {
    const tabKey = e.currentTarget.dataset.key;
    this.setData({
      activeTab: tabKey,
      page: 1,
      myBookings: [],
      hasMore: true
    });
    this.loadMyBookings();
  },

  // 取消预定
  cancelBooking: function(e) {
    const bookingId = e.currentTarget.dataset.id;
    const booking = this.data.myBookings.find(item => item.id === bookingId);
    
    if (!booking) return;

    wx.showModal({
      title: '取消预定',
      content: `确定要取消${booking.productName}的预定吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doCancelBooking(bookingId);
        }
      }
    });
  },

  // 执行取消预定
  doCancelBooking: function(bookingId) {
    const openid = app.getOpenid();
    
    app.request({
      url: '/api/booking/cancel',
      method: 'POST',
      data: {
        openid: openid,
        bookingId: bookingId
      }
    }).then(res => {
      if (res && res.code === 200) {
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        });
        
        // 刷新列表
        this.setData({
          page: 1,
          myBookings: [],
          hasMore: true
        });
        this.loadMyBookings();
      } else {
        wx.showToast({
          title: res?.message || '取消失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('取消预定失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 查看预定详情
  viewDetail: function(e) {
    const bookingId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/booking-detail/booking-detail?id=${bookingId}`
    });
  },

  // 重新预定
  reBook: function(e) {
    const productId = e.currentTarget.dataset.productId;
    wx.navigateTo({
      url: `/pages/booking/booking?productId=${productId}`
    });
  },

  // 去预订
  goToBooking: function() {
    wx.switchTab({
      url: '/pages/booking/booking'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      myBookings: [],
      hasMore: true
    });
    this.loadMyBookings();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadMyBookings();
  }
});