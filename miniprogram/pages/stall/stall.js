const app = getApp();

Page({
  data: {
    stallItems: [],
    filteredItems: [],
    searchKeyword: '',
    // 售出弹框相关
    showSellModal: false,
    selectedItem: null,
    sellCount: 0
  },

  onLoad: function() {
    // 检查访问权限
    if (!app.hasPagePermission('/pages/stall/stall')) {
      wx.showModal({
        title: '权限不足',
        content: '您没有访问此页面的权限',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/booking/booking' // 默认跳转到有权限的页面
          });
        }
      });
      return;
    }
    
    // 直接在onLoad中设置包含成本的数据
    const stallItems = [
      { id: 1, name: '矿泉水', count: 20, cost: 2.5, image: '/images/water.png' },
      { id: 2, name: '方便面', count: 15, cost: 3.5, image: '/images/noodles.png' },
      { id: 3, name: '面包', count: 10, cost: 8.0, image: '/images/bread.png' },
      { id: 4, name: '火腿肠', count: 25, cost: 1.5, image: '/images/sausage.png' },
      { id: 5, name: '薯片', count: 18, cost: 6.0, image: '/images/chips.png' },
      { id: 6, name: '可乐', count: 22, cost: 3.0, image: '/images/cola.png' },
      { id: 7, name: '雪碧', count: 16, cost: 3.0, image: '/images/sprite.png' },
      { id: 8, name: '饼干', count: 30, cost: 5.5, image: '/images/cookies.png' },
      { id: 9, name: '巧克力', count: 28, cost: 8.5, image: '/images/chocolate.png' },
      { id: 10, name: '口香糖', count: 40, cost: 0.5, image: '/images/gum.png' },
      { id: 11, name: '瓜子', count: 35, cost: 4.0, image: '/images/seeds.png' },
      { id: 12, name: '花生', count: 27, cost: 6.5, image: '/images/peanuts.png' },
      { id: 13, name: '八宝粥', count: 12, cost: 4.5, image: '/images/porridge.png' },
      { id: 14, name: '牛奶', count: 19, cost: 5.0, image: '/images/milk.png' },
      { id: 15, name: '鸡蛋', count: 50, cost: 0.8, image: '/images/eggs.png' }
    ];
    
    // 设置数据到页面
    this.setData({
      stallItems: stallItems,
      filteredItems: this.filterItems(stallItems, '')
    });
    
    // 保存到本地存储
    wx.setStorageSync('stallItems', stallItems);
  },

  onShow: function() {
    // 更新自定义TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateTabBar();
    }
  },

  // 从后台加载出摊商品数据
  loadStallItems: function() {
    const that = this;
    const openid = app.getOpenid();
    
    if (!openid) {
      console.log('用户未登录，使用本地数据');
      return;
    }

    app.request({
      url: '/api/stall/items',
      method: 'GET',
      data: { openid: openid }
    }).then(res => {
      if (res && res.code === 200) {
        const stallItems = res.data || [];
        that.setData({
          stallItems: stallItems,
          filteredItems: that.filterItems(stallItems, that.data.searchKeyword)
        });
        wx.setStorageSync('stallItems', stallItems);
        console.log('出摊商品加载成功:', stallItems);
      } else {
        console.log('加载出摊商品失败，使用本地数据:', res?.message || '未知错误');
      }
    }).catch(err => {
      console.error('请求出摊商品失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 搜索输入处理
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
      filteredItems: this.filterItems(this.data.stallItems, keyword)
    });
  },

  // 清空搜索
  clearSearch: function() {
    this.setData({
      searchKeyword: '',
      filteredItems: this.data.stallItems
    });
  },

  // 显示售出弹框
  showSellModal: function(e) {
    const id = e.currentTarget.dataset.id;
    const selectedItem = this.data.stallItems.find(item => item.id === id);
    if (selectedItem) {
      this.setData({
        showSellModal: true,
        selectedItem: selectedItem,
        sellCount: 0
      });
    }
  },

  // 隐藏售出弹框
  hideSellModal: function() {
    this.setData({
      showSellModal: false,
      selectedItem: null,
      sellCount: 0
    });
  },

  // 处理售出数量输入
  onSellCountInput: function(e) {
    this.setData({
      sellCount: parseInt(e.detail.value) || 0
    });
  },

  // 确认售出
  confirmSell: function() {
    const { selectedItem, sellCount, stallItems } = this.data;
    
    if (!selectedItem) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    if (sellCount <= 0) {
      wx.showToast({
        title: '请输入售出数量',
        icon: 'none'
      });
      return;
    }
    
    if (sellCount > selectedItem.count) {
      wx.showToast({
        title: '售出数量不能超过当前库存',
        icon: 'none'
      });
      return;
    }
    
    // 调用后台接口记录售出
    this.recordSell(selectedItem, sellCount);
  },

  // 记录售出到后台
  recordSell: function(product, count) {
    const that = this;
    const openid = app.getOpenid();
    
    app.request({
      url: '/api/stall/sell',
      method: 'POST',
      data: {
        openid: openid,
        productId: product.id,
        productName: product.name,
        sellCount: count,
        sellPrice: product.cost, // 这里应该是售价，暂时用成本代替
        sellTime: new Date().toISOString()
      }
    }).then(res => {
      if (res && res.code === 200) {
        // 售出成功，更新本地数据
        that.updateLocalProductCount(product.id, count);
        
        wx.showToast({
          title: '售出成功',
          icon: 'success'
        });
        
        that.setData({
          showSellModal: false,
          selectedItem: null,
          sellCount: 0
        });
      } else {
        wx.showToast({
          title: res?.message || '售出失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('记录售出失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 更新本地商品数量
  updateLocalProductCount: function(productId, sellCount) {
    const updatedStallItems = this.data.stallItems.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          count: item.count - sellCount
        };
      }
      return item;
    });
    
    const updatedFilteredItems = this.filterItems(updatedStallItems, this.data.searchKeyword);
    
    this.setData({
      stallItems: updatedStallItems,
      filteredItems: updatedFilteredItems
    });
    
    // 保存到本地存储
    wx.setStorageSync('stallItems', updatedStallItems);
  },

  // 添加商品到出摊
  addToStall: function(product) {
    const existingItem = this.data.stallItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // 商品已存在，更新数量
      const updatedStallItems = this.data.stallItems.map(item => {
        if (item.id === product.id) {
          return {
            ...item,
            count: item.count + product.count
          };
        }
        return item;
      });
      
      this.setData({
        stallItems: updatedStallItems,
        filteredItems: this.filterItems(updatedStallItems, this.data.searchKeyword)
      });
      
      wx.setStorageSync('stallItems', updatedStallItems);
      
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
    } else {
      // 新商品，添加到列表
      const updatedStallItems = [...this.data.stallItems, product];
      
      this.setData({
        stallItems: updatedStallItems,
        filteredItems: this.filterItems(updatedStallItems, this.data.searchKeyword)
      });
      
      wx.setStorageSync('stallItems', updatedStallItems);
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    }
  },

  // 过滤商品
  filterItems: function(items, keyword) {
    if (!keyword.trim()) {
      return items;
    }
    return items.filter(item => 
      item.name.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  // 移除商品
  removeItem: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要从出摊列表中移除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          const stallItems = this.data.stallItems.filter(item => item.id !== id);
          const updatedFilteredItems = this.filterItems(stallItems, this.data.searchKeyword);
          
          this.setData({
            stallItems: stallItems,
            filteredItems: updatedFilteredItems
          });
          
          wx.setStorageSync('stallItems', stallItems);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
});