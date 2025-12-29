const app = getApp();

Page({
  data: {
    products: [],
    searchKeyword: '',
    selectedCategory: '',
    categories: ['全部', '食品', '饮品', '日用品', '其他'],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad: function() {
    // 预订页面是默认权限，总是允许访问
    // if (!app.hasPagePermission('/pages/booking/booking')) {
    //   wx.showModal({
    //     title: '权限不足',
    //     content: '您没有访问此页面的权限',
    //     showCancel: false,
    //     success: () => {
    //       wx.switchTab({
    //         url: '/pages/booking/booking' // 默认跳转到有权限的页面
    //       });
    //     }
    //   });
    //   return;
    // }
    
    this.loadProducts();
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.setData({
      page: 1,
      products: [],
      hasMore: true
    });
    this.loadProducts();
    
    // 更新自定义TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateTabBar();
    }
  },

  // 加载商品列表
  loadProducts: function() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    const app = getApp();
    const that = this;

    // 模拟数据，实际应该从服务器获取
    setTimeout(() => {
      const mockProducts = [
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
          sellerName: '张三的小摊'
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
          sellerName: '李四的饮品店'
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
          sellerName: '王五的小摊'
        }
      ];

      let newProducts = mockProducts;
      
      // 应用搜索过滤
      if (this.data.searchKeyword) {
        newProducts = newProducts.filter(item => 
          item.name.includes(this.data.searchKeyword) ||
          item.description.includes(this.data.searchKeyword)
        );
      }

      // 应用分类过滤
      if (this.data.selectedCategory && this.data.selectedCategory !== '全部') {
        newProducts = newProducts.filter(item => 
          item.category === this.data.selectedCategory
        );
      }

      that.setData({
        products: this.data.page === 1 ? newProducts : [...this.data.products, ...newProducts],
        loading: false,
        hasMore: newProducts.length >= this.data.pageSize,
        page: this.data.page + 1
      });
    }, 1000);
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
      products: [],
      hasMore: true
    });
    this.loadProducts();
  },

  // 选择分类
  onCategorySelect: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category,
      page: 1,
      products: [],
      hasMore: true
    });
    this.loadProducts();
  },

  // 预订商品
  onReserve: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(item => item.id === productId);
    
    if (!product) return;

    wx.showModal({
      title: '预订确认',
      content: `确定要预订 ${product.name} 吗？\n价格：¥${product.price}`,
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用预订API
          wx.showToast({
            title: '预订成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 查看商品详情
  onProductDetail: function(e) {
    const productId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      products: [],
      hasMore: true
    });
    this.loadProducts();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadProducts();
  }
});