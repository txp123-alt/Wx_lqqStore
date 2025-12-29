const app = getApp();

Component({
  data: {
    selected: 0,
    color: "#666666",
    selectedColor: "#667eea",
    list: [],
    showTabBar: false
  },
  
  attached() {
    this.updateTabBar();
  },
  
  methods: {
    updateTabBar: function() {
      const userMenus = app.getUserMenus();
      console.log('自定义TabBar获取用户菜单:', userMenus);
      
      const allTabs = [
        {
          pagePath: "/pages/booking/booking",
          text: "预订",
          iconPath: "/images/icons/home.png",
          selectedIconPath: "/images/icons/home-active.png"
        },
        {
          pagePath: "/pages/mybooking/mybooking",
          text: "我的预定",
          iconPath: "/images/icons/usercenter.png",
          selectedIconPath: "/images/icons/usercenter-active.png"
        },
        {
          pagePath: "/pages/stall/stall",
          text: "出摊",
          iconPath: "/images/icons/business.png",
          selectedIconPath: "/images/icons/business-active.png"
        },
        {
          pagePath: "/pages/inventory/inventory",
          text: "库存",
          iconPath: "/images/icons/goods.png",
          selectedIconPath: "/images/icons/goods-active.png"
        }
      ];
      
      // 过滤出用户有权限的Tab
      const filteredTabs = allTabs.filter(tab => {
        return userMenus.some(menu => {
          return menu.path === tab.pagePath || 
                 (menu.id === 'booking' && tab.pagePath === '/pages/booking/booking');
        });
      });
      
      console.log('过滤后的TabBar列表:', filteredTabs);
      
      this.setData({
        list: filteredTabs,
        showTabBar: filteredTabs.length > 0
      });
    },
    
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
    }
  }
})