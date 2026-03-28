// Skill data configuration file
// Used to manage data for the skill display page

export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string; // Iconify icon name
	category: "frontend" | "backend" | "database" | "tools" | "other"| "media";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[]; // Related project IDs
	certifications?: string[];
	color?: string; // Skill card theme color
}

export const skillsData: Skill[] = [
	// Frontend Skills
	{
		id: "javascript",
		name: "JavaScript",
		description:
			"在GEE平台基于JS处理各种遥感数据，包含数据分析、数据可视化等等。",
		icon: "logos:javascript",
		category: "frontend",
		level: "advanced",
		experience: { years: 1, months: 6 },
		projects: [
			"mizuki-blog",
			"portfolio-website",
			"data-visualization-tool",
		],
		color: "#F7DF1E",
	},

	{
		id: "vue",
		name: "Vue.js",
		description:
			"前端入门老师.",
		icon: "logos:vue",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 8 },
		projects: ["data-visualization-tool"],
		color: "#4FC08D",
	},

	{
		id: "astro",
		name: "Astro",
		description:
			"博客框架，仍在学习.",
		icon: "logos:astro-icon",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 2 },
		color: "#FF5D01",
	},

	// Backend Skills
	{
		id: "python",
		name: "Python",
		description:
			"万能、无敌.",
		icon: "logos:python",
		category: "backend",
		level: "advanced",
		experience: { years: 5, months: 1 },
		color: "#3776AB",
	},

	{
		id: "csharp",
		name: "C#",
		description:
			"感谢C#让我顺利通过毕设.",
		icon: "devicon:csharp",
		category: "backend",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		projects: ["desktop-application", "web-api"],
		color: "#239120",
	},

	// Database Skills
	{
		id: "mysql",
		name: "MySQL",
		description:
			"The world's most popular open-source relational database management system, widely used in web applications.",
		icon: "logos:mysql-icon",
		category: "database",
		level: "advanced",
		experience: { years: 2, months: 6 },
		projects: ["e-commerce-platform", "blog-system"],
		color: "#4479A1",
	},
	{
		id: "postgresql",
		name: "PostgreSQL",
		description:
			"A powerful open-source relational database management system.",
		icon: "logos:postgresql",
		category: "database",
		level: "intermediate",
		experience: { years: 1, months: 5 },
		projects: ["e-commerce-platform"],
		color: "#336791",
	},

	// Tools
	{
		id: "vscode",
		name: "VS Code",
		description:
			"万能OGIDE",
		icon: "logos:visual-studio-code",
		category: "tools",
		level: "expert",
		experience: { years: 3, months: 6 },
		color: "#007ACC",
	},
	{
		id: "pycharm",
		name: "PyCharm",
		description:
			"大创使用深度学习时下载，用到现在.",
		icon: "logos:pycharm",
		category: "tools",
		level: "intermediate",
		experience: { years: 4, months: 5 },
		projects: ["python-web-app", "data-analysis"],
		color: "#21D789",
	},
	{
		id: "cursor",
		name: "Cursor",
		description: "爱酱，直到被剥夺了免费pro资格（悲😢。",
		icon: "bxl:cursor-ai",
		category: "tools",
		level: "advanced",
		experience: { years: 1, months: 0 },
		color: "#56D1F3",
	},
	{
		id: "trae",
		name: "Trae",
		description: "被Cursor背叛后的备胎，除了高峰期需要waiting之外其他都很好。",
		icon: "material-symbols:auto-awesome",
		category: "tools",
		level: "intermediate",
		experience: { years: 0, months: 4 },
		color: "#5252EE",
	},
	{
		id: "antigravity",
		name: "Antigravity",
		description: "新神中神，感谢Google爸爸保留我的会员，下一年一定支持",
		icon: "material-symbols:antigravity",
		category: "tools",
		level: "advanced",
		experience: { years: 0, months: 6 },
		color: "#00E5FF",
	},
	{
		id: "office",
		name: "Microsoft Office",
		description: "小学四年级当大队委时就帮老师处理EXCEL的天选打工人一枚～",
		icon: "mdi:microsoft-office",
		category: "tools",
		level: "advanced",
		experience: { years: 15, months: 0 },
		color: "#D83B01",
	},
	{
		id: "wps",
		name: "WPS Office",
		description: "本土化办公首选，轻便全能。",
		icon: "hugeicons:wps-office",
		category: "tools",
		level: "advanced",
		experience: { years: 4, months: 0 },
		color: "#D44026",
	},
	{
		id: "flomo",
		name: "flomo",
		description: "每日复盘",
		icon: "ri:mental-health-line",
		category: "tools",
		level: "expert",
		experience: { years: 3, months: 0 },
		color: "#4CAF50",
	},

	// Media Skills
	{
		id: "photoshop",
		name: "Photoshop",
		description: "99%的时间都拿它抠背景，剩下1%的时间p图.",
		icon: "logos:adobe-photoshop",
		category: "media",
		level: "intermediate",
		experience: { years: 2, months: 6 },
		projects: ["ui-design", "image-processing"],
		color: "#31A8FF",
	},
	{
		id: "lightroom",
		name: "Lightroom",
		description: "调色，套log.",
		icon: "logos:adobe-lightroom",
		category: "media",
		level: "intermediate",
		experience: { years: 3, months: 0 },
		projects: ["photo-processing"],
		color: "#31A8FF",
	},
	{
		id: "premiere",
		name: "Premiere Pro",
		description: "视频剪辑，多机位处理，Vlog 产出.",
		icon: "skill-icons:premiere",
		category: "media",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		color: "#9999FF",
	},
	{
		id: "davinci",
		name: "DaVinci Resolve",
		description: "Tim推荐，甚至用达芬奇遭遇premier，对mac友好。（没用过FCP",
		icon: "simple-icons:davinciresolve",
		category: "media",
		level: "beginner",
		experience: { years: 1, months: 0 },
		color: "#FF9933",
	},
	{
		id: "capcut",
		name: "剪映",
		description: "字幕生成工具",
		icon: "hugeicons:capcut",
		category: "media",
		level: "advanced",
		experience: { years: 3, months: 0 },
		color: "#222222",
	},

	{
		id: "xiaoyuzhou",
		name: "小宇宙",
		description: "播客重度依赖.",
		icon: "dinkie-icons:xiaoyuzhou",
		category: "other",
		level: "advanced",
		experience: { years: 3, months: 2 },
		color: "#FFD500",
	},

];

// Get skill statistics
export const getSkillStats = () => {
	const total = skillsData.length;
	const byLevel = {
		beginner: skillsData.filter((s) => s.level === "beginner").length,
		intermediate: skillsData.filter((s) => s.level === "intermediate")
			.length,
		advanced: skillsData.filter((s) => s.level === "advanced").length,
		expert: skillsData.filter((s) => s.level === "expert").length,
	};
	const byCategory = {
		frontend: skillsData.filter((s) => s.category === "frontend").length,
		backend: skillsData.filter((s) => s.category === "backend").length,
		database: skillsData.filter((s) => s.category === "database").length,
		tools: skillsData.filter((s) => s.category === "tools").length,
		media: skillsData.filter((s) => s.category === "media").length,
		other: skillsData.filter((s) => s.category === "other").length,
	};

	return { total, byLevel, byCategory };
};

// Get skills by category
export const getSkillsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return skillsData;
	}
	return skillsData.filter((s) => s.category === category);
};

// Get advanced skills
export const getAdvancedSkills = () => {
	return skillsData.filter(
		(s) => s.level === "advanced" || s.level === "expert",
	);
};

// Calculate total years of experience
export const getTotalExperience = () => {
	const totalMonths = skillsData.reduce((total, skill) => {
		return total + skill.experience.years * 12 + skill.experience.months;
	}, 0);
	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
