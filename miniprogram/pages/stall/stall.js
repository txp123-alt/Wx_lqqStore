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
    
    // 如果没有数据，添加假数据
    if (stallItems.length === 0) {
      stallItems = [
        { id: 1, name: '矿泉水', count: 20 },
        { id: 2, name: '方便面', count: 15 },
        { id: 3, name: '面包', count: 10 },
        { id: 4, name: '火腿肠', count: 25 },
        { id: 5, name: '薯片', count: 18 }
      ];
      // 保存假数据到本地存储
      wx.setStorageSync('stallItems', stallItems);
    }
    
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
  }
});