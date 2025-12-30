const app = getApp();

Page({
  data: {
    allBookings: [], // 存储所有预订数据
    myBookings: [], // 显示的预订列表（筛选后）
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    activeTab: 'all', // all, 1, 2, 3, 4, 0
    filterTabs: [
      { key: 'all', name: '全部' },
      { key: '1', name: '待确认' },
      { key: '2', name: '已确认' },
      { key: '3', name: '配送中' },
      { key: '4', name: '已完成' },
      { key: '0', name: '已取消' }
    ],
    showDetailModal: false,
    currentDetail: null
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
    // 如果已有数据，只更新自定义TabBar
    if (this.data.allBookings.length > 0) {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().updateTabBar();
        this.getTabBar().updateSelected();
      }
      return;
    }

    // 更新自定义TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateTabBar();
      this.getTabBar().updateSelected();
    }
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

    console.log('===== 我的预订请求参数 =====');
    console.log('openid:', openid);
    console.log('page:', this.data.page);
    console.log('pageSize:', this.data.pageSize);
    console.log('========================');

    app.request({
      url: '/api/reservations/my',
      method: 'GET',
      data: {
        openid: openid,
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      if (res && res.code === 200) {
        const newBookings = res.data || [];
        // 处理返回数据，添加格式化字段
        const formattedBookings = newBookings.map(booking => this.formatBookingData(booking));

        // 追加到所有预订列表
        const allBookings = this.data.page === 1 ? formattedBookings : [...this.data.allBookings, ...formattedBookings];

        this.setData({
          allBookings: allBookings,
          myBookings: this.filterBookings(allBookings, this.data.activeTab),
          loading: false,
          hasMore: newBookings.length >= this.data.pageSize,
          page: this.data.page + 1
        });

        // 保存到本地存储
        wx.setStorageSync('myBookings', allBookings);
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

  // 根据状态筛选预订列表
  filterBookings: function(bookings, activeTab) {
    if (activeTab === 'all') {
      return bookings;
    }
    return bookings.filter(item => item.status === parseInt(activeTab));
  },

  // 格式化预订数据
  formatBookingData: function(booking) {
    // 状态映射：数据库status -> 前端显示状态
    const statusMap = {
      '0': { text: '已取消', value: 'cancelled', class: 'status-cancelled' },
      '1': { text: '等待摊主接受预定', value: 'waiting', class: 'status-waiting' },
      '2': { text: '已确认', value: 'confirmed', class: 'status-confirmed' },
      '3': { text: '飞奔中', value: 'delivering', class: 'status-delivering' },
      '4': { text: '已完成', value: 'completed', class: 'status-completed' }
    };

    const statusInfo = statusMap[booking.status] || statusMap['0'];

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return '';
      const date = new Date(time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    return {
      ...booking,
      statusText: statusInfo.text,
      statusValue: statusInfo.value,
      statusClass: statusInfo.class,
      formattedCreatedTime: formatTime(booking.createdAt),
      formattedReservedTime: booking.reservedDate || formatTime(booking.createdAt),
      canCancel: booking.status === 1, // 只有待确认状态可以取消
      unitPrice: ((booking.totalPrice || 0) / (booking.quantity || 1)).toFixed(2) // 计算单价
    };
  },

  // 切换筛选标签
  switchFilterTab: function(e) {
    const tabKey = e.currentTarget.dataset.key;
    console.log('切换筛选标签:', tabKey);
    this.setData({
      activeTab: tabKey,
      myBookings: this.filterBookings(this.data.allBookings, tabKey)
    });
  },

  // 取消预定
  cancelBooking: function(e) {
    const bookingId = e.currentTarget.dataset.id;
    const booking = this.data.myBookings.find(item => item.id === bookingId);
    
    if (!booking) return;

    if (!booking.canCancel) {
      wx.showToast({
        title: '只能取消待确认的预定',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '取消预定',
      content: `确定要取消预订编号 ${booking.reservation_no} 的预定吗？`,
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

    console.log('===== 取消预订请求参数 =====');
    console.log('openid:', openid);
    console.log('reservationId:', bookingId);
    console.log('========================');

    app.request({
      url: '/api/reservations/cancel',
      method: 'POST',
      data: {
        reservationId: bookingId
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
    const booking = this.data.myBookings.find(item => item.id === bookingId);

    if (!booking) return;

    this.setData({
      currentDetail: booking,
      showDetailModal: true
    });
  },

  // 关闭详情弹窗
  onCloseDetailModal: function() {
    this.setData({
      showDetailModal: false
    });
  },

  // 阻止详情弹窗内容点击冒泡
  onDetailContentTap: function() {
    // 阻止事件冒泡
  },

  // 阻止底部操作区冒泡
  onFooterTap: function() {
    // 阻止事件冒泡，避免触发详情查看
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
      allBookings: [],
      myBookings: [],
      hasMore: true
    });
    this.loadMyBookings();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom: function() {
    // 只有在全部标签下才加载更多
    if (this.data.activeTab === 'all') {
      this.loadMyBookings();
    }
  }
});