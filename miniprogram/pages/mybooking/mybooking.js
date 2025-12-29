const app = getApp();

Page({
  data: {
    reservations: [],
    searchKeyword: '',
    selectedCategory: '',
    categories: ['全部', '食品', '饮品', '日用品', '其他'],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad: function() {
    // 默认权限，不进行权限检查
    this.loadReservations();
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.setData({
      page: 1,
      reservations: [],
      hasMore: true
    });
    this.loadReservations();
    
    // 更新自定义TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateTabBar();
    }
  },

  // 加载已预定商品列表
  loadReservations: function() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    const that = this;

    // 模拟数据，实际应该从服务器获取
    setTimeout(() => {
      const mockReservations = [
        {
          id: 1,
          name: '手抓饼',
          price: 8.00,
          originalPrice: 10.00,
          image: '/images/products/pancake.jpg',
          category: '食品',
          description: '新鲜现做手抓饼，可加蛋加肠',
          stock: 50,
          salesCount: 128,
          rating: 4.8,
          sellerName: '张三的小摊',
          reserveTime: '2025-12-29 10:30',
          reserveQuantity: 2,
          reserveStatus: 'waiting',
          totalPrice: 16.00
        },
        {
          id: 2,
          name: '柠檬水',
          price: 5.00,
          originalPrice: 6.00,
          image: '/images/products/lemonade.jpg',
          category: '饮品',
          description: '新鲜柠檬制作，冰爽解渴',
          stock: 100,
          salesCount: 89,
          rating: 4.6,
          sellerName: '李四的饮品店',
          reserveTime: '2025-12-28 15:20',
          reserveQuantity: 3,
          reserveStatus: 'delivering',
          totalPrice: 15.00
        },
        {
          id: 3,
          name: '手机支架',
          price: 15.00,
          originalPrice: 20.00,
          image: '/images/products/phone-stand.jpg',
          category: '日用品',
          description: '可调节角度，稳固耐用',
          stock: 30,
          salesCount: 45,
          rating: 4.7,
          sellerName: '王五的小摊',
          reserveTime: '2025-12-27 09:00',
          reserveQuantity: 1,
          reserveStatus: 'ready',
          totalPrice: 15.00
        },
        {
          id: 4,
          name: '煎饼果子',
          price: 12.00,
          originalPrice: 15.00,
          image: '/images/products/pancake.jpg',
          category: '食品',
          description: '传统煎饼果子，香酥可口',
          stock: 20,
          salesCount: 56,
          rating: 4.9,
          sellerName: '赵六的小摊',
          reserveTime: '2025-12-26 08:15',
          reserveQuantity: 1,
          reserveStatus: 'completed',
          totalPrice: 12.00
        },
        {
          id: 5,
          name: '冰镇可乐',
          price: 3.00,
          originalPrice: 4.00,
          image: '/images/products/lemonade.jpg',
          category: '饮品',
          description: '冰镇可乐，清凉解暑',
          stock: 50,
          salesCount: 34,
          rating: 4.5,
          sellerName: '孙七的小摊',
          reserveTime: '2025-12-25 11:30',
          reserveQuantity: 2,
          reserveStatus: 'cancelled',
          totalPrice: 6.00
        }
      ];

      let newReservations = mockReservations;
      
      // 应用搜索过滤
      if (this.data.searchKeyword) {
        newReservations = newReservations.filter(item => 
          item.name.includes(this.data.searchKeyword) ||
          item.description.includes(this.data.searchKeyword)
        );
      }

      // 应用分类过滤
      if (this.data.selectedCategory && this.data.selectedCategory !== '全部') {
        newReservations = newReservations.filter(item => 
          item.category === this.data.selectedCategory
        );
      }

      that.setData({
        reservations: this.data.page === 1 ? newReservations : [...this.data.reservations, ...newReservations],
        loading: false,
        hasMore: newReservations.length >= this.data.pageSize,
        page: this.data.page + 1
      });
    }, 1000);
  },

  // 获取预定状态文本
  getStatusText: function(status) {
    const statusMap = {
      'waiting': '等待摊主接受预定',
      'delivering': '飞奔中',
      'ready': '待取货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知';
  },

  // 获取预定状态样式类
  getStatusClass: function(status) {
    const classMap = {
      'waiting': 'status-waiting',
      'delivering': 'status-delivering',
      'ready': 'status-ready',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classMap[status] || '';
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  onSearch: function() {
    this.setData({
      page: 1,
      reservations: [],
      hasMore: true
    });
    this.loadReservations();
  },

  // 选择分类
  onCategorySelect: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category,
      page: 1,
      reservations: [],
      hasMore: true
    });
    this.loadReservations();
  },

  // 取消预定
  onCancelReserve: function(e) {
    const reservationId = e.currentTarget.dataset.id;
    const reservation = this.data.reservations.find(item => item.id === reservationId);
    
    if (!reservation) return;

    // 检查是否可以取消
    if (reservation.reserveStatus !== 'waiting') {
      wx.showToast({
        title: '只能取消等待接受的预定',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '取消预定',
      content: `确定要取消 ${reservation.name} 的预定吗？`,
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用取消预定API
          wx.showToast({
            title: '取消成功',
            icon: 'success'
          });
          // 刷新列表
          this.setData({
            page: 1,
            reservations: [],
            hasMore: true
          });
          this.loadReservations();
        }
      }
    });
  },

  // 查看预定详情
  onReserveDetail: function(e) {
    const reservationId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      reservations: [],
      hasMore: true
    });
    this.loadReservations();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadReservations();
  }
});
