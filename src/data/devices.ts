// 设备数据配置文件

export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = {
	[categoryName: string]: Device[];
} & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	Apple: [
		{
			name: "iPhone 16 Pro",
			image: "/images/device/apple/iphone16pro.png",
			specs: "黑色 / 256G",
			description: "没找到什么缺点，新一代祖传机",
			link: "https://www.apple.com.cn/iphone-16-pro/",
		},
		{
			name: "MacBook Air",
			image: "/images/device/apple/macbookair.png",
			specs: "M3 / 256G",
			description: "轻薄便携的生产力工具和代码环境",
			link: "https://www.apple.com.cn/macbook-air/",
		},
		{
			name: "iPad Air 2024",
			image: "/images/device/apple/ipadair2024.png",
			specs: "天蓝色 / 256G",
			description: "压泡面：夯",
			link: "https://www.apple.com.cn/ipad-air/",
		},
		{
			name: "Apple Watch Series 7",
			image: "/images/device/apple/applewatchs7.png",
			specs: "Nike版本 / 黑色",
			description: "小钢炮，提供健身情绪价值",
			link: "https://www.apple.com.cn/apple-watch-nike/",
		},
		{
			name: "AirPods Pro 2",
			image: "/images/device/apple/airpodspro2.png",
			specs: "降噪真无线",
			description: "2023年购入，好用的一，擦擦又能用三年",
			link: "https://www.apple.com.cn/airpods-pro/",
		},
		{
			name: "AirPods 2",
			image: "/images/device/apple/airpods2.png",
			specs: "半入耳无线耳机",
			description: "2020年购入，划时代的产品",
			link: "https://www.apple.com.cn/airpods-2nd-generation/",
		},
	],
	Bike: [
		{
			name: "喜德盛 黑客380",
			image: "/images/device/bike/hacker380.png",
			specs: "XDS Hacker 380",
			description: "2024研究生入学时购入，首辆山地车，一分钱一分货",
			link: "https://www.xdscc.com/",
		},
	],
	"Liverpool Outfit": [
		{
			name: "24-25赛季 球迷版球衣",
			image: "/images/device/liverpool/lfc_home.png",
			specs: "主场：84号 Conor Bradley / 客场：66号 阿诺德",
			description: "本赛季红军主客场披挂出征球衣",
			link: "https://store.liverpoolfc.com/",
		},
		{
			name: "25-26赛季 球服配套",
			image: "/images/device/liverpool/lfc_away.png",
			specs: "主场、客场、二客(14号 基耶萨) / 三合一冲锋衣",
			description: "2025青藏高原唯一伙伴，没有YNWA撑不过去",
			link: "https://store.liverpoolfc.com/",
		},
		{
			name: "利物浦周边配件",
			image: "/images/device/liverpool/lfc_acc.png",
			specs: "短袖 / 毛巾 / 萨拉赫围巾",
			description: "看球和日常使用的经典信仰配件",
			link: "https://store.liverpoolfc.com/",
		},
	],
	其他: [
		{
			name: "联想拯救者 R7000P",
			image: "/images/device/others/r7000p.png",
			specs: "Lenovo Legion R7000P",
			description: "2020上大学购入，6年仍旧抗打。缺点是容易出小毛病",
			link: "https://www.lenovo.com.cn/",
		},
		{
			name: "迈从 v9 pro 耳机",
			image: "/images/device/others/mc_v9pro.png",
			specs: "MCHOSE V9 Pro",
			description: "佩戴舒适的头戴式无线耳机",
			link: "#",
		},
		{
			name: "雷柏 V3TS",
			image: "/images/device/others/rapoo_v3ts.png",
			specs: "Rapoo V3ts",
			description: "性价比电竞外设选择",
			link: "https://www.rapoo.com/",
		},
		{
			name: "罗技 G304",
			image: "/images/device/others/g304.png",
			specs: "Logitech G304",
			description: "2020年购入，从未出过毛病，好用的一",
			link: "https://www.logitechg.com/",
		},
		{
			name: "罗技 M240",
			image: "/images/device/others/m240.png",
			specs: "Logitech M240",
			description: "工位使用，委屈自己，造福他人",
			link: "https://www.logitech.com.cn/",
		},
	],
};
