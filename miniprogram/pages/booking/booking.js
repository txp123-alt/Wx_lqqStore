const app = getApp();

Page({
  data: {
    products: [],
    searchKeyword: '',
    selectedCategory: '',
    categories: ['全部', '食品', '饮品', '日用品', '其他'],
    selectedSort: '',
    sortOptions: [
      { key: '', name: '默认排序', order: 'desc' },
      { key: 'price', name: '价格', order: 'asc' },
      { key: 'sales', name: '销量', order: 'desc' },
      { key: 'stock', name: '库存', order: 'desc' }
    ],
    sortOrder: 'desc',
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    // 预订表单数据
    reserveForm: {
      quantity: 1,
      contactName: '',
      contactPhone: '',
      contactAddr: '',
      remark: ''
    },
    currentProduct: null,
    showReserveModal: false,
    reserveTotalPrice: '0.00'
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

    // 等待用户登录成功后再加载商品
    this.waitForLoginAndLoad();
  },

  onShow: function() {
    // 每次显示页面时刷新数据（仅当已登录时）
    if (app.getOpenid()) {
      this.setData({
        page: 1,
        products: [],
        hasMore: true
      });
      this.loadProducts();
    }

    // 更新自定义TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateTabBar();
      this.getTabBar().updateSelected();
    }
  },

  // 等待用户登录成功后加载商品
  waitForLoginAndLoad: function() {
    const checkLogin = () => {
      if (app.getOpenid()) {
        // 已登录，加载商品
        this.loadProducts();
      } else {
        // 未登录，延迟重试
        setTimeout(() => {
          checkLogin();
        }, 500);
      }
    };

    // 设置超时，避免无限等待
    const timeout = setTimeout(() => {
      if (!app.getOpenid()) {
        console.log('等待登录超时，用户可能未登录');
      }
    }, 30000);

    checkLogin();
    this.loginTimeout = timeout;
  },

  onUnload: function() {
    // 清理登录等待定时器
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
    }
  },

  // 加载商品列表
  loadProducts: function() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    const openid = app.getOpenid();

    app.request({
      url: '/api/products/list',
      method: 'GET',
      data: {
        openid: openid,
        page: this.data.page,
        pageSize: this.data.pageSize,
        keyword: this.data.searchKeyword,
        category: this.data.selectedCategory === '全部' ? '' : this.data.selectedCategory,
        sortBy: this.data.selectedSort,
        sortOrder: this.data.sortOrder
      }
    }).then(res => {
      if (res && res.code === 200) {
        const newProducts = res.data || [];

        this.setData({
          products: this.data.page === 1 ? newProducts : [...this.data.products, ...newProducts],
          loading: false,
          hasMore: newProducts.length >= this.data.pageSize,
          page: this.data.page + 1
        });
      } else {
        this.setData({ loading: false });
        wx.showToast({
          title: res?.message || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('加载商品列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
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

  // 选择排序
  onSortSelect: function(e) {
    const sortKey = e.currentTarget.dataset.sort;
    const sortOrder = e.currentTarget.dataset.order;

    if (this.data.selectedSort === sortKey) {
      // 切换排序顺序
      const newOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc';
      const updatedSortOptions = this.data.sortOptions.map(item => {
        if (item.key === sortKey) {
          return { ...item, order: newOrder };
        }
        return item;
      });
      this.setData({
        sortOrder: newOrder,
        sortOptions: updatedSortOptions,
        page: 1,
        products: [],
        hasMore: true
      });
    } else {
      // 切换排序方式
      const updatedSortOptions = this.data.sortOptions.map(item => {
        if (item.key === sortKey) {
          return { ...item, order: sortOrder };
        }
        return item;
      });
      this.setData({
        selectedSort: sortKey,
        sortOrder: sortOrder,
        sortOptions: updatedSortOptions,
        page: 1,
        products: [],
        hasMore: true
      });
    }
    this.loadProducts();
  },

  // 预订商品
  onReserve: function(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(item => item.id === productId);

    if (!product) return;

    // 计算初始总价
    const totalPrice = (product.price * 1).toFixed(2);

    // 保存当前商品信息
    this.setData({
      currentProduct: product,
      reserveForm: {
        quantity: 1,
        contactName: '',
        contactPhone: '',
        contactAddr: '',
        remark: ''
      },
      showReserveModal: true,
      reserveTotalPrice: totalPrice
    });
  },

  // 关闭预订弹窗
  onCloseReserveModal: function() {
    this.setData({
      showReserveModal: false
    });
  },

  // 阻止弹窗内容点击冒泡
  onModalContentTap: function() {
    // 阻止事件冒泡
  },

  // 增加数量
  onIncreaseQuantity: function() {
    const maxQuantity = this.data.currentProduct.stock || 99;
    if (this.data.reserveForm.quantity >= maxQuantity) {
      wx.showToast({
        title: '超过库存数量',
        icon: 'none'
      });
      return;
    }
    const newQuantity = this.data.reserveForm.quantity + 1;
    const newTotal = (this.data.currentProduct.price * newQuantity).toFixed(2);
    this.setData({
      'reserveForm.quantity': newQuantity,
      reserveTotalPrice: newTotal
    });
  },

  // 减少数量
  onDecreaseQuantity: function() {
    if (this.data.reserveForm.quantity <= 1) {
      return;
    }
    const newQuantity = this.data.reserveForm.quantity - 1;
    const newTotal = (this.data.currentProduct.price * newQuantity).toFixed(2);
    this.setData({
      'reserveForm.quantity': newQuantity,
      reserveTotalPrice: newTotal
    });
  },

  // 输入联系人姓名
  onContactNameInput: function(e) {
    this.setData({
      'reserveForm.contactName': e.detail.value
    });
  },

  // 输入联系电话
  onContactPhoneInput: function(e) {
    this.setData({
      'reserveForm.contactPhone': e.detail.value
    });
  },

  // 输入配送地址
  onContactAddrInput: function(e) {
    this.setData({
      'reserveForm.contactAddr': e.detail.value
    });
  },

  // 输入备注
  onRemarkInput: function(e) {
    this.setData({
      'reserveForm.remark': e.detail.value
    });
  },

  // 确认预订
  onConfirmReserve: function() {
    const product = this.data.currentProduct;
    const form = this.data.reserveForm;
    const openid = app.getOpenid();

    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 验证表单
    if (!form.contactName) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      });
      return;
    }

    if (!form.contactPhone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }

    if (!/^\d{11}$/.test(form.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return;
    }

    if (!form.contactAddr) {
      wx.showToast({
        title: '请输入配送地址',
        icon: 'none'
      });
      return;
    }

    // 计算价格信息
    const totalPrice = (product.price * form.quantity).toFixed(2);
    const now = new Date();
    const reservedDate = now.toISOString().split('T')[0];
    const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    // 构建请求参数
    const requestData = {
      productId: product.id,
      quantity: form.quantity,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      contactAddr: form.contactAddr,
      remark: form.remark,
      totalPrice: parseFloat(totalPrice),
      deposit: 0,
      reservedDate: reservedDate,
      expiryDate: expiryDate
    };

    // 打印请求参数
    console.log('===== 预订请求参数 =====');
    console.log('productId:', requestData.productId);
    console.log('quantity:', requestData.quantity);
    console.log('contactName:', requestData.contactName);
    console.log('contactPhone:', requestData.contactPhone);
    console.log('contactAddr:', requestData.contactAddr);
    console.log('remark:', requestData.remark);
    console.log('totalPrice:', requestData.totalPrice);
    console.log('deposit:', requestData.deposit);
    console.log('reservedDate:', requestData.reservedDate);
    console.log('expiryDate:', requestData.expiryDate);
    console.log('========================');

    // 调用预订接口
    app.request({
      url: '/api/reservations',
      method: 'POST',
      data: requestData
      }
    }).then(res => {
      if (res && res.code === 200) {
        wx.showToast({
          title: '预订成功',
          icon: 'success'
        });
        this.setData({
          showReserveModal: false,
          page: 1,
          products: [],
          hasMore: true
        });
        this.loadProducts();
      } else {
        wx.showToast({
          title: res?.message || '预订失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('创建预订失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
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
