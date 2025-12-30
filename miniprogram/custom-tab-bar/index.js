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
    this.updateSelected();
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
        // 预订和我的预定页面默认总是显示
        if (tab.pagePath === '/pages/booking/booking' || tab.pagePath === '/pages/mybooking/mybooking') {
          return true;
        }
        
        return userMenus.some(menu => {
          return menu.path === tab.pagePath;
        });
      });
      
      console.log('过滤后的TabBar列表:', filteredTabs);
      
      this.setData({
        list: filteredTabs,
        showTabBar: filteredTabs.length > 0
      });
    },
    
    updateSelected: function() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const currentRoute = '/' + currentPage.route;
      
      console.log('当前页面路径:', currentRoute);
      console.log('TabBar列表:', this.data.list.map((item, index) => `${index}: ${item.pagePath}`));
      
      // 根据当前页面设置选中的Tab
      let selectedIndex = 0;
      const list = this.data.list;
      
      for (let i = 0; i < list.length; i++) {
        console.log(`比较: ${list[i].pagePath} === ${currentRoute} ? ${list[i].pagePath === currentRoute}`);
        if (list[i].pagePath === currentRoute) {
          selectedIndex = i;
          break;
        }
      }
      
      console.log('设置Tab选中索引:', selectedIndex);
      
      this.setData({
        selected: selectedIndex
      });
    },
    
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      console.log('切换Tab到:', url);
      
      wx.switchTab({ url });
      this.setData({
        selected: data.index
      });
    }
  }
})