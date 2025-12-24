Page({
  data: {
    inventoryItems: [],
    stallItems: [],
    newItem: {
      name: '',
      count: 0
    },
    // 添加到出摊弹框相关
    showAddToStallModal: false,
    selectedItem: null,
    stallCount: 0,
    totalInventoryCount: 0,
    stallItemsCount: 0,
    totalItemsCount: 0
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    // 每次页面显示时重新加载数据，确保数据最新
    this.loadData();
  },

  loadData: function() {
    // 从本地存储获取数据
    let inventoryItems = wx.getStorageSync('inventoryItems') || [];
    let stallItems = wx.getStorageSync('stallItems') || [];

    // 如果没有数据，添加测试数据
    if (inventoryItems.length === 0) {
      const testItems = [
        { id: 1, name: '矿泉水', count: 20 },
        { id: 2, name: '方便面', count: 15 },
        { id: 3, name: '面包', count: 10 },
        { id: 4, name: '火腿肠', count: 25 },
        { id: 5, name: '薯片', count: 18 },
        { id: 6, name: '可乐', count: 30 },
        { id: 7, name: '雪碧', count: 22 },
        { id: 8, name: '果汁', count: 15 },
        { id: 9, name: '饼干', count: 28 },
        { id: 10, name: '巧克力', count: 12 },
        { id: 11, name: '糖果', count: 40 },
        { id: 12, name: '坚果', count: 25 },
        { id: 13, name: '口香糖', count: 35 },
        { id: 14, name: '咖啡', count: 18 },
        { id: 15, name: '奶茶', count: 22 }
      ];
      inventoryItems = testItems;
      wx.setStorageSync('inventoryItems', inventoryItems);
    }

    // 计算库存统计
    const totalInventoryCount = inventoryItems.reduce((total, item) => total + item.count, 0);
    const stallItemsCount = stallItems.reduce((total, item) => total + item.count, 0);
    const totalItemsCount = totalInventoryCount + stallItemsCount;

    this.setData({
      inventoryItems: inventoryItems,
      stallItems: stallItems,
      totalInventoryCount: totalInventoryCount,
      stallItemsCount: stallItemsCount,
      totalItemsCount: totalItemsCount
    });
  },

  onNameInput: function(e) {
    this.setData({
      'newItem.name': e.detail.value
    });
  },

  onCountInput: function(e) {
    this.setData({
      'newItem.count': parseInt(e.detail.value) || 0
    });
  },

  addItem: function() {
    const { name, count } = this.data.newItem;
    if (!name || count <= 0) {
      wx.showToast({
        title: '请输入商品名称和库存数量',
        icon: 'none'
      });
      return;
    }

    // 添加新商品到库存
    const newItem = {
      id: Date.now(),
      name: name,
      count: count
    };

    const inventoryItems = [...this.data.inventoryItems, newItem];
    this.setData({
      inventoryItems: inventoryItems,
      newItem: {
        name: '',
        count: 0
      }
    });

    // 保存到本地存储
    wx.setStorageSync('inventoryItems', inventoryItems);
    // 更新统计数据
    this.loadData();

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 显示添加到出摊弹框
  showAddToStallModal: function(e) {
    const id = e.currentTarget.dataset.id;
    const selectedItem = this.data.inventoryItems.find(item => item.id === id);
    if (selectedItem) {
      this.setData({
        showAddToStallModal: true,
        selectedItem: selectedItem,
        stallCount: 0
      });
    }
  },

  // 隐藏添加到出摊弹框
  hideAddToStallModal: function() {
    this.setData({
      showAddToStallModal: false,
      selectedItem: null,
      stallCount: 0
    });
  },

  // 处理出摊数量输入
  onStallCountInput: function(e) {
    this.setData({
      stallCount: parseInt(e.detail.value) || 0
    });
  },

  // 确认添加到出摊
  confirmAddToStall: function() {
    const { selectedItem, stallCount, inventoryItems, stallItems } = this.data;
    
    if (!selectedItem) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }
    
    if (stallCount <= 0) {
      wx.showToast({
        title: '请输入出摊数量',
        icon: 'none'
      });
      return;
    }
    
    if (stallCount > selectedItem.count) {
      wx.showToast({
        title: '出摊数量不能超过库存数量',
        icon: 'none'
      });
      return;
    }
    
    // 更新库存商品数量
    const updatedInventoryItems = inventoryItems.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          count: item.count - stallCount
        };
      }
      return item;
    });
    
    // 更新出摊商品
    const existingStallItemIndex = stallItems.findIndex(item => item.id === selectedItem.id);
    let updatedStallItems;
    
    if (existingStallItemIndex !== -1) {
      // 如果商品已在出摊列表中，增加数量
      updatedStallItems = stallItems.map(item => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            count: item.count + stallCount
          };
        }
        return item;
      });
    } else {
      // 如果商品不在出摊列表中，添加新商品
      updatedStallItems = [...stallItems, {
        id: selectedItem.id,
        name: selectedItem.name,
        count: stallCount
      }];
    }
    
    // 更新本地存储
    wx.setStorageSync('inventoryItems', updatedInventoryItems);
    wx.setStorageSync('stallItems', updatedStallItems);
    
    // 更新页面数据
    this.setData({
      inventoryItems: updatedInventoryItems,
      stallItems: updatedStallItems,
      showAddToStallModal: false
    });
    
    // 更新统计数据
    this.loadData();
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  }
});