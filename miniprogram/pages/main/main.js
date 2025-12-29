const app = getApp();

Page({
  data: {
    userMenus: [],
    currentTab: 0,
    tabBarList: [],
    currentComponent: 'booking-component'
  },

  onLoad: function() {
    this.initUserMenus();
  },

  onShow: function() {
    this.initUserMenus();
  },

  // 初始化用户菜单
  initUserMenus: function() {
    const userMenus = app.getUserMenus();
    console.log('主页面获取到用户菜单:', userMenus);
    
    // 构建TabBar列表
    const tabBarList = this.buildTabBarList(userMenus);
    
    this.setData({
      userMenus: userMenus,
      tabBarList: tabBarList
    });
    
    console.log('构建的TabBar列表:', tabBarList);
  },

  // 根据用户菜单构建TabBar列表
  buildTabBarList: function(userMenus) {
    const allTabBarConfig = [
      {
        pagePath: "pages/booking/booking",
        text: "预订",
        iconPath: "/images/icons/home.png",
        selectedIconPath: "/images/icons/home-active.png",
        component: "booking-component"
      },
      {
        pagePath: "pages/stall/stall",
        text: "出摊", 
        iconPath: "/images/icons/business.png",
        selectedIconPath: "/images/icons/business-active.png",
        component: "stall-component"
      },
      {
        pagePath: "pages/inventory/inventory",
        text: "库存",
        iconPath: "/images/icons/goods.png", 
        selectedIconPath: "/images/icons/goods-active.png",
        component: "inventory-component"
      }
    ];
    
    // 过滤出用户有权限的Tab
    return allTabBarConfig.filter(tab => {
      return userMenus.some(menu => {
        return menu.path === `/${tab.pagePath}` || 
               menu.id === 'booking' && tab.pagePath === 'pages/booking/booking';
      });
    });
  },

  // Tab切换
  onTabChange: function(e) {
    const index = e.currentTarget.dataset.index;
    let currentComponent = 'booking-component';
    
    if (this.data.tabBarList.length > 0 && index < this.data.tabBarList.length) {
      currentComponent = this.data.tabBarList[index].component;
    }
    
    this.setData({
      currentTab: index,
      currentComponent: currentComponent
    });
  }
});