// 获取应用实例
const app = getApp();

Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    // 分类相关
    categories: [
      { id: 'all', name: '全部', icon: '🛍️' },
      { id: 'paper', name: '卫生纸', icon: '🧻' },
      { id: 'hairpin', name: '发夹', icon: '🎀' },
      { id: 'snacks', name: '零食', icon: '🍿' },
      { id: 'drinks', name: '饮料', icon: '🥤' },
      { id: 'daily', name: '日用品', icon: '🧴' }
    ],
    currentCategory: 'all',
    // 商品列表
    productList: [],
    filteredList: [],
    // 预定弹窗相关
    showReserveModal: false,
    selectedProduct: null,
    reserveForm: {
      quantity: 1,
      deliveryTime: '',
      deliveryAddress: '',
      contactPhone: '',
      remark: ''
    },
    // 加载状态
    isLoading: false,
    // 临时库存数据（模拟）
    inventoryData: [
      { id: 1, name: '抽纸', category: 'paper', stock: 50, price: 2.50, unit: '包', image: '/images/default-goods-image.png' },
      { id: 2, name: '卷纸', category: 'paper', stock: 30, price: 5.80, unit: '提', image: '/images/default-goods-image.png' },
      { id: 3, name: '粉色发夹', category: 'hairpin', stock: 20, price: 3.00, unit: '个', image: '/images/default-goods-image.png' },
      { id: 4, name: '蓝色发夹', category: 'hairpin', stock: 15, price: 3.00, unit: '个', image: '/images/default-goods-image.png' },
      { id: 5, name: '薯片', category: 'snacks', stock: 25, price: 8.50, unit: '包', image: '/images/default-goods-image.png' },
      { id: 6, name: '可乐', category: 'drinks', stock: 40, price: 3.00, unit: '瓶', image: '/images/default-goods-image.png' },
      { id: 7, name: '洗发水', category: 'daily', stock: 10, price: 25.00, unit: '瓶', image: '/images/default-goods-image.png' },
      { id: 8, name: '香皂', category: 'daily', stock: 35, price: 4.50, unit: '块', image: '/images/default-goods-image.png' }
    ]
  },

  onLoad: function() {
    this.loadInventoryData();
  },

  onShow: function() {
    this.loadInventoryData();
  },

  // 加载库存数据
  loadInventoryData: function() {
    const that = this;
    that.setData({ isLoading: true });

    // 模拟从后台获取库存数据
    setTimeout(() => {
      // 获取有库存的商品并添加分类信息
      const availableProducts = that.data.inventoryData.filter(item => item.stock > 0);
      const productsWithCategory = availableProducts.map(product => {
        const category = that.data.categories.find(cat => cat.id === product.category);
        return {
          ...product,
          categoryIcon: category ? category.icon : '📦',
          categoryName: category ? category.name : product.category
        };
      });
      
      that.setData({
        productList: productsWithCategory,
        filteredList: productsWithCategory,
        isLoading: false
      });
      
      console.log('加载商品数据成功，共', productsWithCategory.length, '件商品');
    }, 500);

    // 实际项目中应该调用后台API
    /*
    wx.request({
      url: app.globalData.serverConfig.baseUrl + '/api/inventory/available',
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.code === 200) {
          const products = res.data.data.filter(item => item.stock > 0);
          that.setData({
            productList: products,
            filteredList: products
          });
        }
      },
      complete: () => {
        that.setData({ isLoading: false });
      }
    });
    */
  },

  // 搜索商品
  onSearchInput: function(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    this.filterProducts();
  },

  // 确认搜索
  onSearchConfirm: function() {
    this.filterProducts();
  },

  // 清除搜索
  onClearSearch: function() {
    this.setData({ searchKeyword: '' });
    this.filterProducts();
  },

  // 切换分类
  onCategoryChange: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ currentCategory: categoryId });
    this.filterProducts();
  },

  // 过滤商品
  filterProducts: function() {
    const { productList, searchKeyword, currentCategory } = this.data;
    let filtered = productList;

    // 按分类过滤
    if (currentCategory !== 'all') {
      filtered = filtered.filter(item => item.category === currentCategory);
    }

    // 按关键词搜索
    if (searchKeyword) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    this.setData({ filteredList: filtered });
  },

  // 点击预定商品
  onReserveProduct: function(e) {
    const product = e.currentTarget.dataset.product;
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再预定商品',
        showCancel: false
      });
      return;
    }

    // 检查库存
    if (product.stock <= 0) {
      wx.showToast({
        title: '商品已售罄',
        icon: 'none'
      });
      return;
    }

    // 显示预定弹窗
    this.setData({
      selectedProduct: product,
      showReserveModal: true,
      reserveForm: {
        quantity: 1,
        deliveryTime: '',
        deliveryAddress: '',
        contactPhone: '',
        remark: ''
      }
    });
  },

  // 关闭预定弹窗
  onCloseReserveModal: function() {
    this.setData({
      showReserveModal: false,
      selectedProduct: null
    });
  },

  // 输入预定数量
  onQuantityChange: function(e) {
    const quantity = parseInt(e.detail.value) || 1;
    const maxQuantity = this.data.selectedProduct.stock;
    
    if (quantity > maxQuantity) {
      wx.showToast({
        title: `最多预定${maxQuantity}${this.data.selectedProduct.unit}`,
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'reserveForm.quantity': quantity
    });
  },

  // 数量减少
  onQuantityMinus: function() {
    let quantity = this.data.reserveForm.quantity - 1;
    if (quantity < 1) quantity = 1;
    this.setData({
      'reserveForm.quantity': quantity
    });
  },

  // 数量增加
  onQuantityPlus: function() {
    let quantity = this.data.reserveForm.quantity + 1;
    const maxQuantity = this.data.selectedProduct.stock;
    
    if (quantity > maxQuantity) {
      wx.showToast({
        title: `最多预定${maxQuantity}${this.data.selectedProduct.unit}`,
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'reserveForm.quantity': quantity
    });
  },

  // 选择配送时间
  onDeliveryTimeChange: function(e) {
    this.setData({
      'reserveForm.deliveryTime': e.detail.value
    });
  },

  // 输入配送地址
  onDeliveryAddressInput: function(e) {
    this.setData({
      'reserveForm.deliveryAddress': e.detail.value
    });
  },

  // 输入联系电话
  onContactPhoneInput: function(e) {
    this.setData({
      'reserveForm.contactPhone': e.detail.value
    });
  },

  // 输入备注
  onRemarkInput: function(e) {
    this.setData({
      'reserveForm.remark': e.detail.value
    });
  },

  // 提交预定
  onSubmitReserve: function() {
    const { selectedProduct, reserveForm } = this.data;
    
    // 验证表单
    if (!reserveForm.deliveryTime) {
      wx.showToast({
        title: '请选择配送时间',
        icon: 'none'
      });
      return;
    }

    if (!reserveForm.deliveryAddress.trim()) {
      wx.showToast({
        title: '请输入配送地址',
        icon: 'none'
      });
      return;
    }

    if (!reserveForm.contactPhone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(reserveForm.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    // 提交预定信息到后台
    this.submitReserveOrder(selectedProduct, reserveForm);
  },

  // 提交预定订单
  submitReserveOrder: function(product, reserveForm) {
    const that = this;
    const openid = app.getOpenid();

    wx.showLoading({
      title: '提交中...'
    });

    const orderData = {
      openid: openid,
      productId: product.id,
      productName: product.name,
      quantity: reserveForm.quantity,
      price: product.price,
      totalPrice: (product.price * reserveForm.quantity).toFixed(2),
      deliveryTime: reserveForm.deliveryTime,
      deliveryAddress: reserveForm.deliveryAddress,
      contactPhone: reserveForm.contactPhone,
      remark: reserveForm.remark,
      orderTime: new Date().toISOString()
    };

    // 模拟提交预定
    setTimeout(() => {
      wx.hideLoading();
      
      // 关闭弹窗
      that.setData({
        showReserveModal: false,
        selectedProduct: null
      });

      wx.showModal({
        title: '预定成功',
        content: `您已成功预定${product.name} ${reserveForm.quantity}${product.unit}，我们会按时配送。`,
        showCancel: false,
        success: function() {
          // 可以跳转到预定记录页面
          console.log('预定订单数据：', orderData);
        }
      });
    }, 1000);

    // 实际项目中调用后台API
    /*
    wx.request({
      url: app.globalData.serverConfig.baseUrl + '/api/order/reserve',
      method: 'POST',
      data: orderData,
      success: (res) => {
        wx.hideLoading();
        
        if (res.data && res.data.code === 200) {
          that.setData({
            showReserveModal: false,
            selectedProduct: null
          });

          wx.showModal({
            title: '预定成功',
            content: res.data.message || '预定成功，我们会按时配送。',
            showCancel: false
          });
        } else {
          wx.showToast({
            title: res.data?.message || '预定失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
    */
  },

  // 获取当前时间作为配送时间的最小值
  getMinDateTime: function() {
    const now = new Date();
    now.setHours(now.getHours() + 1); // 最少1小时后
    return now.toISOString().slice(0, 16);
  },

  // 格式化价格显示
  formatPrice: function(price) {
    return parseFloat(price).toFixed(2);
  },

  // 计算总价
  calculateTotalPrice: function() {
    if (!this.data.selectedProduct) return '0.00';
    const price = this.data.selectedProduct.price;
    const quantity = this.data.reserveForm.quantity;
    return (price * quantity).toFixed(2);
  }
});