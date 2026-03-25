// Project data configuration file
// Used to manage data for the project display page

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "rs" | "photography" | "media" | "ai" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	sourceCodeLabel?: string; // 源码按钮文字（可选：每个项目自定义）
	bilibiliSource?: string; // B站跳转链接（在项目卡片上展示按钮）
	bilibiliSourceLabel?: string; // B站按钮文字（可选：每个项目自定义）
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	visitUrl?: string; // 添加前往项目链接字段
}

export const projectsData: Project[] = [
	{
		id: "Yangtze ssc",
		title: "长江悬浮泥沙研究论文",
		description:
			"基于landsat影像反演1984-2021年长江中下游河口悬浮泥沙浓度",
		image: "/images/projects/yangtzeSSC.png",
		category: "rs",
		techStack: ["ArcGIS", "Python", "ML"],
		status: "completed",
		liveDemo: "https://blog.example.com",
		sourceCode: "https://doi.org/10.6084/m9.figshare.29951894.v3", // DOI / 论文数据链接
		sourceCodeLabel:"数据分享",
		visitUrl: "https://doi.org/10.1016/j.isprsjprs.2026.03.023", // 添加前往项目链接
		startDate: "2024-04-01",
		endDate: "2026-03-14",
		featured: true,
		tags: ["遥感", "科研", "sci"],
	},
	{
		id: "Collapse monitoring method",
		title: "崩岸识别算法发明专利",
		description:
			"利用长时许遥感产品进行河道崩岸识别",
		image: "/images/projects/collapse_monitor.png",
		category: "rs",
		techStack: ["时序分析", "Mann-kendall", "发明专利"],
		status: "completed",
		liveDemo: "https://portfolio.example.com",
		sourceCode: "http://epub.cnipa.gov.cn/cred/CN121167370B",
		sourceCodeLabel:"专利链接",
		// visitUrl: "https://portfolio.example.com", // 添加前往项目链接
		startDate: "2024-04-01",
		endDate: "2026-03-18",
		featured: true,
		tags: ["Portfolio", "React", "Animation"],
	},
	{
		id: "anticheating",
		title: "反诈微电影破局",
		description:
			"反诈微电影《破局》于2022年4月18日上线.",
		image: "",
		category: "media",
		techStack: ["校园", "轮回", "改变"],
		status: "completed",
		bilibiliSource: "https://www.bilibili.com/video/BV14uQ1BvErS/?share_source=copy_web&vd_source=a057885a70a5bac2476c1519393dd2e7", // TODO: 替换为该项目对应的具体视频/页面链接
		bilibiliSourceLabel: "B站链接",
		startDate: "2022-04-01",
		tags: ["校园", "轮回", "改变"],
	},

	{
		id: "national-epidemic-prevention",
		title: "全名抗疫",
		description:
			"党史情景剧《全民抗疫》于2021年5月28日登上荧幕！",
		image: "",
		category: "media",
		techStack: ["情景剧", "抗疫", "党史"],
		status: "completed",
		bilibiliSource: "https://www.bilibili.com/", // TODO: 替换为该项目对应的具体视频/页面链接
		bilibiliSourceLabel: "B站链接",
		startDate: "2021-05-28",
		tags: ["情景剧", "抗疫", "党史"],
	},

	{
		id: "darwin-blog",
		title: "Darwin的博客",
		description:
			"正如你当前所在",
		image: "",
		category: "ai",
		techStack: ["Astro", "TypeScript", "Tailwind CSS", "Git"],
		status: "completed",
		liveDemo: "https://www.bettercall12.cc/",
		visitUrl: "https://www.bettercall12.cc/", // 添加前往项目链接
		startDate: "2026-03-02",
		endDate: "至今",
		tags: ["Data Visualization", "Analytics", "Charts"],
	},
	{
		id: "photography-set1",
		title: "我的所见",
		description:
			"镜头记录回忆",
		image: "",
		category: "photography",
		techStack: ["Fuji", "Photoshop", "Lightroom"],
		status: "in-progress",
		liveDemo: "/albums/",
		visitUrl: "/albums/", // 跳转到站内相册界面
		startDate: "2026-03-02",
		endDate: "至今",
		tags: ["摄影", "所见", "所闻"],
	},
	// {
	// 	id: "e-commerce-platform",
	// 	title: "E-commerce Platform",
	// 	description:
	// 		"Full-stack e-commerce platform including user management, product management, and order processing features.",
	// 	image: "",
	// 	category: "other",
	// 	techStack: ["Next.js", "Node.js", "PostgreSQL", "Stripe"],
	// 	status: "planned",
	// 	startDate: "2024-07-01",
	// 	tags: ["E-commerce", "Full Stack", "Payment Integration"],
	// },
];

// Get project statistics
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter(
		(p) => p.status === "completed",
	).length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// Get projects by category
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// Get featured projects
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// Get all tech stacks
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => {
			techSet.add(tech);
		});
	});
	return Array.from(techSet).sort();
};
