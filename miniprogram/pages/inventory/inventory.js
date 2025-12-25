Page({
  data: {
    inventoryItems: [],
    stallItems: [],
    newItem: {
      name: '',
      count: 0,
      cost: '',
      image: ''
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
        { id: 1, name: '矿泉水', count: 20, cost: 2.5, image: '/images/water.png' },
        { id: 2, name: '方便面', count: 15, cost: 3.5, image: '/images/noodles.png' },
        { id: 3, name: '面包', count: 10, cost: 8.0, image: '/images/bread.png' },
        { id: 4, name: '火腿肠', count: 25, cost: 1.5, image: '/images/sausage.png' },
        { id: 5, name: '薯片', count: 18, cost: 6.0, image: '/images/chips.png' },
        { id: 6, name: '可乐', count: 30, cost: 3.0, image: '/images/cola.png' },
        { id: 7, name: '雪碧', count: 22, cost: 3.0, image: '/images/sprite.png' },
        { id: 8, name: '果汁', count: 15, cost: 4.5, image: '/images/juice.png' },
        { id: 9, name: '饼干', count: 28, cost: 5.5, image: '/images/cookies.png' },
        { id: 10, name: '巧克力', count: 12, cost: 8.5, image: '/images/chocolate.png' },
        { id: 11, name: '糖果', count: 40, cost: 0.5, image: '/images/candy.png' },
        { id: 12, name: '坚果', count: 25, cost: 12.0, image: '/images/nuts.png' },
        { id: 13, name: '口香糖', count: 35, cost: 1.0, image: '/images/gum.png' },
        { id: 14, name: '咖啡', count: 18, cost: 15.0, image: '/images/coffee.png' },
        { id: 15, name: '奶茶', count: 22, cost: 7.0, image: '/images/milktea.png' }
      ];
      inventoryItems = testItems;
      wx.setStorageSync('inventoryItems', inventoryItems);
    }
    
    // 预留：加载商品图片的后台接口
    this.loadProductImages(inventoryItems);

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

  onCostInput: function(e) {
    this.setData({
      'newItem.cost': e.detail.value
    });
  },

  // 选择图片
  chooseImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadImage(tempFilePath);
      }
    });
  },

  // 上传图片到云存储
  uploadImage: function(filePath) {
    wx.cloud.uploadFile({
      cloudPath: `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
      filePath: filePath,
      success: (res) => {
        this.setData({
          'newItem.image': res.fileID
        });
        wx.showToast({
          title: '图片上传成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('图片上传失败:', err);
        wx.showToast({
          title: '图片上传失败',
          icon: 'error'
        });
      }
    });
  },

  // 移除图片
  removeImage: function() {
    this.setData({
      'newItem.image': ''
    });
  },

  addItem: function() {
    const { name, count, cost } = this.data.newItem;
    if (!name || count <= 0 || !cost || cost <= 0) {
      wx.showToast({
        title: '请输入商品名称、库存数量和成本',
        icon: 'none'
      });
      return;
    }

    // 添加新商品到库存
    const newItem = {
      id: Date.now(),
      name: name,
      count: count,
      cost: parseFloat(cost),
      image: this.data.newItem.image || '/images/default-goods-image.png' // 使用上传的图片或默认图片
    };

    const inventoryItems = [...this.data.inventoryItems, newItem];
    this.setData({
      inventoryItems: inventoryItems,
      newItem: {
        name: '',
        count: 0,
        cost: '',
        image: ''
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
        count: stallCount,
        image: selectedItem.image
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
  },
  
  // 后台接口预留 - 加载商品图片
  loadProductImages: function(items) {
    // TODO: 实际项目中调用后台API获取商品图片
    console.log('调用后台接口加载商品图片：', {
      items: items.map(item => ({
        id: item.id,
        name: item.name
      }))
    });
    
    // 模拟API调用 - 为商品加载图片
    /*
    wx.request({
      url: 'https://your-api.com/api/products/images',
      method: 'POST',
      data: {
        productIds: items.map(item => item.id)
      },
      success: function(res) {
        if (res.data && res.data.success) {
          // 更新商品图片数据
          const imageMap = res.data.data;
          const updatedItems = items.map(item => ({
            ...item,
            image: imageMap[item.id] || item.image
          }));
          wx.setStorageSync('inventoryItems', updatedItems);
          this.setData({
            inventoryItems: updatedItems
          });
        }
      }.bind(this),
      fail: function(err) {
        console.error('加载商品图片失败', err);
      }
    });
    */
  }
});