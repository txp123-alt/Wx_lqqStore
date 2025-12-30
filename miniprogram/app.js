// app.js
App({
    onLaunch: function () {
        this.globalData = {
            // env 参数说明：
            //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
            //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
            //   如不填则使用默认环境（第一个创建的环境）
            env: "",

            // 用户登录状态信息
            userInfo: null,
            openid: null,
            token: null, // 后台返回的token
            expiresIn: null, // token过期时间
            userMenus: null, // 用户菜单权限
            loginStatus: false, // 登录状态：false-未登录，true-已登录
            loginRetryCount: 0, // 登录重试计数器

            // 后台服务器配置
            serverConfig: {
                // baseUrl: 'http://192.168.79.1:8080', // 本地后台服务器地址
               baseUrl: 'http://192.168.112.1:8080', //公司
                apiPrefix: '/api' // API接口前缀
            }
        };

        if (!wx.cloud) {
            console.error("请使用 2.2.3 或以上的基础库以使用云能力");
        } else {
            wx.cloud.init({
                env: this.globalData.env,
                traceUser: true,
            });
        }

        // 应用启动时自动执行无感知登录流程
        this.autoLogin();
    },

    // 自动无感知登录流程（微信官方推荐）
    autoLogin: function() {
        const that = this;

        console.log('开始自动登录流程');

        // 检查本地是否有有效的登录缓存
        if (this.checkLocalLoginCache()) {
            console.log('使用本地登录缓存，跳过登录流程');
            return;
        }

        // 执行静默登录
        this.silentLogin();
    },

    // 检查本地登录缓存
    checkLocalLoginCache: function() {
        const openid = wx.getStorageSync('openid');
        const token = wx.getStorageSync('token');
        const expiresIn = wx.getStorageSync('expiresIn');
        const userInfo = wx.getStorageSync('userInfo');
        const loginTime = wx.getStorageSync('loginTime');

        // 检查是否有有效的登录信息
        if (openid && token && userInfo && loginTime) {
            let tokenExpired = false;
            
            // 检查token过期时间
            if (expiresIn) {
                const tokenExpireTime = loginTime + (expiresIn * 1000); // expiresIn是秒数，转换为毫秒
                const now = new Date().getTime();
                tokenExpired = now > tokenExpireTime;
                
                if (tokenExpired) {
                    console.log('Token已过期，需要重新登录');
                }
            }

            if (!tokenExpired) {
                // 登录未过期，使用缓存数据
                this.globalData.openid = openid;
                this.globalData.token = token;
                this.globalData.expiresIn = expiresIn;
                this.globalData.userInfo = userInfo;
                this.globalData.loginStatus = true;

                // 异步拉取最新的用户状态
                this.refreshUserStatus();

                return true;
            } else {
                console.log('登录缓存已过期，清除缓存');
                this.clearLoginCache();
            }
        }

        return false;
    },

    // 静默登录（用户无感知）
    silentLogin: function() {
        const that = this;

        console.log('===== 开始静默登录 =====');
        console.log('当前重试次数:', this.globalData.loginRetryCount || 0);

        // 登录流程（1）：调用wx.login()获取临时登录凭证code
        wx.login({
            timeout: 5000, // 设置超时时间为5秒
            success: function(res) {
                if (res.code) {
                    console.log('登录流程（1）：获取code成功');
                    console.log('code值:', res.code);
                    console.log('code长度:', res.code.length);
                    console.log('获取时间:', new Date().toISOString());

                    // 验证code格式（微信code通常是32位字符）
                    if (res.code.length !== 32) {
                        console.warn('⚠️ 警告：code长度异常，预期32位，实际', res.code.length, '位');
                    }

                    // 登录流程（2）：将code发送到后台服务器
                    that.sendCodeToServer(res.code, function(serverRes) {
                        if (serverRes.success) {
                            console.log('✅ 登录流程（2）：后台处理成功，获得token');
                            console.log('openid:', serverRes.data.openid);
                            console.log('token:', serverRes.data.token);

                            // 登录成功，重置重试计数
                            that.globalData.loginRetryCount = 0;

                            // 保存登录信息到本地
                            that.saveLoginInfo(serverRes.data);

                            // 登录流程（3）：使用openid拉取用户菜单权限
                            that.fetchUserStatus(serverRes.data.openid, function(userStatusRes) {
                                console.log('✅ 登录流程（3）：拉取用户菜单完成');
                                console.log('菜单获取结果:', userStatusRes.message);

                                // 显示当前用户菜单权限（用于调试）
                                const userMenus = that.getUserMenus();
                                console.log('📋 当前用户菜单权限:', userMenus);

                                // 检查各页面权限（用于调试）
                                console.log('🔒 权限检查结果:');
                                console.log('- 预订页面:', that.hasPagePermission('/pages/booking/booking'));
                                console.log('- 首页:', that.hasPagePermission('/pages/home/home'));
                                console.log('- 出摊页面:', that.hasPagePermission('/pages/stall/stall'));
                                console.log('- 库存页面:', that.hasPagePermission('/pages/inventory/inventory'));

                                // 登录流程（4）：登录完成，更新全局状态
                                that.globalData.loginStatus = true;

                                // 刷新TabBar显示
                                setTimeout(() => {
                                    that.refreshAllTabBars();
                                }, 500);

                                console.log('🎉 自动登录流程完成');
                                console.log('===== 登录成功 =====');
                            });
                        } else {
                            console.error('❌ 登录流程（2）：后台处理失败');
                            console.error('失败详情:', serverRes);
                            console.error('可能原因：后台配置错误、AppID不匹配、AppSecret错误');
                            // 登录失败，触发重试机制
                            that.handleLoginFailure();
                        }
                    });
                } else {
                    console.error('❌ 登录流程（1）：获取code失败');
                    console.error('错误信息:', res.errMsg);
                    that.handleLoginFailure();
                }
            },
            fail: function(err) {
                console.error('❌ wx.login调用失败：', err);
                console.error('可能原因：网络问题、微信服务异常');
                that.handleLoginFailure();
            }
        });
    },

    // 处理登录失败的情况
    handleLoginFailure: function() {
        console.log('登录失败，应用以游客模式运行');
        this.globalData.loginStatus = false;

        // 设置默认用户信息
        this.globalData.userInfo = {
            nickName: '游客用户',
            avatarUrl: '/images/avatar.png'
        };

        // 智能重试机制：最多重试3次，每次间隔递增
        const retryCount = this.globalData.loginRetryCount || 0;

        if (retryCount < 3) {
            this.globalData.loginRetryCount = retryCount + 1;
            const retryDelay = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s

            console.log(`将在 ${retryDelay/1000} 秒后进行第 ${this.globalData.loginRetryCount} 次重试`);

            setTimeout(() => {
                console.log(`===== 第 ${this.globalData.loginRetryCount} 次登录重试 =====`);
                this.silentLogin();
            }, retryDelay);
        } else {
            console.log('已达到最大重试次数，停止自动重试');
            console.log('用户需要手动刷新页面或重启应用来重新尝试登录');

            // 重置重试计数，允许下次启动时重试
            this.globalData.loginRetryCount = 0;
        }
    },

    // 刷新用户状态（异步）
    refreshUserStatus: function() {
        if (!this.globalData.openid) return;

        const that = this;
        this.fetchUserStatus(this.globalData.openid, function(userStatusRes) {
            if (userStatusRes.success) {
                console.log('用户菜单更新成功');
                // 菜单数据已经在 fetchUserStatus 中处理了，这里不需要额外处理
            } else {
                console.log('用户菜单更新失败，但已使用默认菜单');
            }
        });
    },

    // 清除登录缓存
    clearLoginCache: function() {
        wx.removeStorageSync('openid');
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('loginTime');
        wx.removeStorageSync('token');
        wx.removeStorageSync('expiresIn');
        wx.removeStorageSync('userMenus');
        this.globalData.openid = null;
        this.globalData.userInfo = null;
        this.globalData.token = null;
        this.globalData.expiresIn = null;
        this.globalData.userMenus = null;
        this.globalData.loginStatus = false;
    },

    // 发送code到后台服务器换取openid
    sendCodeToServer: function(code, callback) {
        const that = this;

        wx.request({
            url: that.globalData.serverConfig.baseUrl + '/api/auth/login',
            method: 'POST',
            data: {
                code: code
            },
            header: {
                'content-type': 'application/json'
            },
            success: function(res) {
                console.log('后台响应登录请求：', res.data);
                if (res.data && res.data.code === 200) {
                    callback({
                        success: true,
                        data: res.data.data,
                        message: res.data.message || '登录成功'
                    });
                } else {
                    callback({
                        success: false,
                        message: res.data?.message || '后台登录处理失败'
                    });
                }
            },
            fail: function(err) {
                console.error('请求后台登录接口失败：', err);
                callback({
                    success: false,
                    message: '网络请求失败'
                });
            }
        });
    },

    // 保存登录信息
    saveLoginInfo: function(loginData) {
        const now = new Date().getTime();

        // 保存到本地存储
        wx.setStorageSync('openid', loginData.openid);
        wx.setStorageSync('token', loginData.token);
        wx.setStorageSync('expiresIn', loginData.expiresIn);
        wx.setStorageSync('loginTime', now);

        if (loginData.userInfo) {
            wx.setStorageSync('userInfo', loginData.userInfo);
        }

        // 更新全局数据
        this.globalData.openid = loginData.openid;
        this.globalData.token = loginData.token;
        this.globalData.expiresIn = loginData.expiresIn;
        this.globalData.userInfo = loginData.userInfo;
        
        console.log('登录信息已保存:', {
            openid: loginData.openid,
            token: loginData.token,
            expiresIn: loginData.expiresIn
        });
    },

    // 拉取用户菜单权限
    fetchUserStatus: function(openid, callback) {
        const that = this;

        this.request({
            url: '/api/user/menus',
            method: 'GET',
            data: {
                openid: openid
            }
        }).then(res => {
            console.log('用户菜单响应：', res);
            if (res && res.code === 200) {
                const menus = res.data || [];
                
                // 如果返回的菜单权限为空，设置默认菜单（只有商品预定页面权限）
                if (!menus || menus.length === 0) {
                    console.log('用户菜单权限为空，使用默认菜单（仅商品预定页面）');
                    const defaultMenus = [
                        {
                            id: 'booking',
                            name: '商品预定',
                            icon: 'shopping',
                            path: '/pages/booking/booking'
                        },
                        {
                            id: 'mybooking',
                            name: '我的预定',
                            icon: 'user',
                            path: '/pages/mybooking/mybooking'
                        }
                    ];
                    
                    // 保存默认菜单到全局数据和本地存储
                    that.globalData.userMenus = defaultMenus;
                    wx.setStorageSync('userMenus', defaultMenus);
                    
                    callback({
                        success: true,
                        data: { menus: defaultMenus },
                        message: '使用默认菜单权限'
                    });
                } else {
                    // 保存服务器返回的菜单到全局数据和本地存储
                    that.globalData.userMenus = menus;
                    wx.setStorageSync('userMenus', menus);
                    
                    callback({
                        success: true,
                        data: { menus: menus },
                        message: '获取用户菜单成功'
                    });
                }
            } else {
                // 加载失败时也使用默认菜单
                console.log('获取用户菜单失败，使用默认菜单（仅商品预定和我的预定页面）');
                const defaultMenus = [
                    {
                        id: 'booking',
                        name: '商品预定',
                        icon: 'shopping',
                        path: '/pages/booking/booking'
                    },
                    {
                        id: 'mybooking',
                        name: '我的预定',
                        icon: 'user',
                        path: '/pages/mybooking/mybooking'
                    }
                ];
                
                that.globalData.userMenus = defaultMenus;
                wx.setStorageSync('userMenus', defaultMenus);
                
                callback({
                    success: false,
                    data: { menus: defaultMenus },
                    message: res?.message || '获取用户菜单失败，使用默认菜单'
                });
            }
        }).catch(err => {
            console.error('请求用户菜单接口失败：', err);
            console.log('网络请求失败，使用默认菜单（仅商品预定和我的预定页面）');
            
            // 网络失败时使用默认菜单
            const defaultMenus = [
                {
                    id: 'booking',
                    name: '商品预定',
                    icon: 'shopping',
                    path: '/pages/booking/booking'
                },
                {
                    id: 'mybooking',
                    name: '我的预定',
                    icon: 'user',
                    path: '/pages/mybooking/mybooking'
                }
            ];
            
            that.globalData.userMenus = defaultMenus;
            wx.setStorageSync('userMenus', defaultMenus);
            
            callback({
                success: false,
                data: { menus: defaultMenus },
                message: '网络请求失败，使用默认菜单'
            });
        });
    },



    // 退出登录
    logout: function(callback) {
        // 清除本地登录信息
        this.clearLoginCache();

        // 通知后台退出登录（可选）
        if (this.globalData.openid) {
            this.request({
                url: '/api/user/logout',
                method: 'POST',
                data: {
                    openid: this.globalData.openid
                }
            }).then(res => {
                console.log('退出登录响应：', res);
                if (callback) callback({ success: true });
            }).catch(err => {
                console.error('退出登录请求失败：', err);
                if (callback) callback({ success: true });
            });
        } else {
            if (callback) callback({ success: true });
        }
    },

    // 检查用户是否登录
    isLoggedIn: function() {
        return this.globalData.loginStatus;
    },

    // 获取当前用户openid
    getOpenid: function() {
        return this.globalData.openid;
    },

    // 获取当前token
    getToken: function() {
        return this.globalData.token;
    },

    // 获取当前用户信息
    getUserInfo: function() {
        return this.globalData.userInfo || {
            nickName: '游客用户',
            avatarUrl: '/images/avatar.png'
        };
    },

    // 获取用户权限菜单（从缓存中获取）
    getUserMenus: function() {
        // 优先从全局数据中获取菜单
        if (this.globalData.userMenus && this.globalData.userMenus.length > 0) {
            return this.globalData.userMenus;
        }

        // 如果全局数据中没有，从本地存储中获取
        const cachedMenus = wx.getStorageSync('userMenus');
        if (cachedMenus && cachedMenus.length > 0) {
            this.globalData.userMenus = cachedMenus;
            return cachedMenus;
        }

        // 如果都没有，返回默认菜单（仅商品预定和我的预定页面）
        console.log('未找到用户菜单数据，返回默认菜单（仅商品预定和我的预定页面）');
        const defaultMenus = [
            {
                id: 'booking',
                name: '商品预定',
                icon: 'shopping',
                path: '/pages/booking/booking'
            },
            {
                id: 'mybooking',
                name: '我的预定',
                icon: 'user',
                path: '/pages/mybooking/mybooking'
            }
        ];

        this.globalData.userMenus = defaultMenus;
        wx.setStorageSync('userMenus', defaultMenus);

        return defaultMenus;
    },

    // 检查用户是否有访问某个页面的权限
    hasPagePermission: function(pagePath) {
        const menus = this.getUserMenus();

        // 检查页面路径是否在用户菜单中
        const hasPermission = menus.some(menu => {
            // 支持精确匹配和模糊匹配
            return menu.path === pagePath ||
                pagePath.startsWith(menu.path + '/') ||
                menu.path === pagePath.replace(/\/[^\/]*$/, ''); // 匹配父路径
        });

        console.log(`权限检查 - 页面: ${pagePath}, 有权限: ${hasPermission}`);
        return hasPermission;
    },

    // 获取用户可访问的TabBar页面列表
    getAccessibleTabBarPages: function() {
        const menus = this.getUserMenus();
        const tabBarConfig = [
            {
                pagePath: "pages/booking/booking",
                text: "预订",
                iconPath: "images/icons/home.png",
                selectedIconPath: "images/icons/home-active.png"
            },
            {
                pagePath: "pages/stall/stall",
                text: "出摊",
                iconPath: "images/icons/business.png",
                selectedIconPath: "images/icons/business-active.png"
            },
            {
                pagePath: "pages/inventory/inventory",
                text: "库存",
                iconPath: "images/icons/goods.png",
                selectedIconPath: "images/icons/goods-active.png"
            }
        ];

//        return tabBarConfig;
        // 过滤出用户有权限的TabBar页面
        return tabBarConfig.filter(tab => {
            return menus.some(menu => menu.path === `/${tab.pagePath}`) ||
                menus.some(menu => menu.id === 'booking' && tab.pagePath === 'pages/booking/booking'); // 默认预订页面权限
        });
    },

    // 强制刷新所有页面的TabBar
    refreshAllTabBars: function() {
        // 获取当前页面实例
        const pages = getCurrentPages();
        if (pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            if (typeof currentPage.getTabBar === 'function' && currentPage.getTabBar()) {
                currentPage.getTabBar().updateTabBar();
            }
        }
    },

    // 通用网络请求方法（自动携带token）
    request: function(options) {
        const defaultOptions = {
            method: 'GET',
            header: {
                'content-type': 'application/json'
            },
            timeout: 10000
        };

        // 合并用户配置
        const finalOptions = Object.assign({}, defaultOptions, options);

        // 自动添加完整的URL
        if (!options.url.startsWith('http')) {
            finalOptions.url = this.globalData.serverConfig.baseUrl + options.url;
        }

        // 自动携带token
        const token = this.getToken();
        if (token) {
            finalOptions.header = finalOptions.header || {};
            finalOptions.header['Authorization'] = `Bearer ${token}`;
        }

        console.log(`发起请求: ${finalOptions.method} ${finalOptions.url}`, finalOptions.data || '');

        return new Promise((resolve, reject) => {
            wx.request({
                ...finalOptions,
                success: (res) => {
                    console.log(`请求成功: ${finalOptions.url}`, res.data);
                    
                    // 检查token过期
                    if (res.data && res.data.code === 401) {
                        console.log('Token已过期，需要重新登录');
                        this.clearLoginCache();
                        this.autoLogin();
                        
                        // 重新发起请求
                        setTimeout(() => {
                            this.request(options).then(resolve).catch(reject);
                        }, 1000);
                        return;
                    }
                    
                    resolve(res.data);
                },
                fail: (err) => {
                    console.error(`请求失败: ${finalOptions.url}`, err);
                    reject(err);
                }
            });
        });
    },

    globalData: {
        userInfo: null,
        openid: null,
        token: null,
        expiresIn: null,
        userMenus: null,
        loginStatus: false
    }
});