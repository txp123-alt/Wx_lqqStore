Page({
  data: {
    stallItems: [],
    // 售出弹框相关
    showSellModal: false,
    selectedItem: null,
    sellCount: 0
  },

  onLoad: function() {
    // 从本地存储获取出摊商品数据
    let stallItems = wx.getStorageSync('stallItems') || [];
    
    // 添加测试数据，不管本地存储是否有数据
    stallItems = [
      { id: 1, name: '矿泉水', count: 20, image: '/images/water.png' },
      { id: 2, name: '方便面', count: 15, image: '/images/noodles.png' },
      { id: 3, name: '面包', count: 10, image: '/images/bread.png' },
      { id: 4, name: '火腿肠', count: 25, image: '/images/sausage.png' },
      { id: 5, name: '薯片', count: 18, image: '/images/chips.png' },
      { id: 6, name: '可乐', count: 22, image: '/images/cola.png' },
      { id: 7, name: '雪碧', count: 16, image: '/images/sprite.png' },
      { id: 8, name: '饼干', count: 30, image: '/images/cookies.png' },
      { id: 9, name: '巧克力', count: 28, image: '/images/chocolate.png' },
      { id: 10, name: '口香糖', count: 40, image: '/images/gum.png' },
      { id: 11, name: '瓜子', count: 35, image: '/images/seeds.png' },
      { id: 12, name: '花生', count: 27, image: '/images/peanuts.png' },
      { id: 13, name: '八宝粥', count: 12, image: '/images/porridge.png' },
      { id: 14, name: '牛奶', count: 19, image: '/images/milk.png' },
      { id: 15, name: '鸡蛋', count: 50, image: '/images/eggs.png' }
    ];
    
    // 保存测试数据到本地存储
    wx.setStorageSync('stallItems', stallItems);
    
    this.setData({
      stallItems: stallItems
    });
  },

  removeItem: function(e) {
    const id = e.currentTarget.dataset.id;
    const stallItems = this.data.stallItems.filter(item => item.id !== id);
    this.setData({
      stallItems: stallItems
    });
    // 保存到本地存储
    wx.setStorageSync('stallItems', stallItems);
    wx.showToast({
      title: '删除成功',
      icon: 'success'
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
    
    // 更新商品数量
    const updatedStallItems = stallItems.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          count: item.count - sellCount
        };
      }
      return item;
    });
    
    // 更新本地存储
    wx.setStorageSync('stallItems', updatedStallItems);
    
    // 更新页面数据
    this.setData({
      stallItems: updatedStallItems,
      showSellModal: false,
      selectedItem: null,
      sellCount: 0
    });
    
    // 后台接口预留：调用售出记录接口
    this.saveSellRecord(selectedItem.name, sellCount);
    
    wx.showToast({
      title: '售出成功',
      icon: 'success'
    });
  },

  // 后台接口预留 - 保存售出记录
  saveSellRecord: function(productName, count) {
    // TODO: 实际项目中调用后台API保存售出记录
    console.log('调用后台接口保存售出记录：', {
      productName: productName,
      count: count,
      sellTime: new Date().toISOString()
    });
    
    // 模拟API调用
    /*
    wx.request({
      url: 'https://your-api.com/api/sell',
      method: 'POST',
      data: {
        productName: productName,
        count: count,
        sellTime: new Date().toISOString()
      },
      success: function(res) {
        console.log('售出记录保存成功', res.data);
      },
      fail: function(err) {
        console.error('售出记录保存失败', err);
      }
    });
    */
  },
  
  // 后台接口预留 - 加载出摊商品图片
  loadStallProductImages: function(items) {
    // TODO: 实际项目中调用后台API获取出摊商品图片
    console.log('调用后台接口加载出摊商品图片：', {
      items: items.map(item => ({
        id: item.id,
        name: item.name
      }))
    });
    
    // 模拟API调用
    /*
    wx.request({
      url: 'https://your-api.com/api/stall/products/images',
      method: 'POST',
      data: {
        productIds: items.map(item => item.id)
      },
      success: function(res) {
        if (res.data && res.data.success) {
          // 更新出摊商品图片数据
          const imageMap = res.data.data;
          const updatedItems = items.map(item => ({
            ...item,
            image: imageMap[item.id] || item.image
          }));
          wx.setStorageSync('stallItems', updatedItems);
          this.setData({
            stallItems: updatedItems
          });
        }
      }.bind(this),
      fail: function(err) {
        console.error('加载出摊商品图片失败', err);
      }
    });
    */
  }
});