// Timeline data configuration file
// Used to manage data for the timeline page

export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
	startDate: string;
	endDate?: string; // If empty, it means current
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: {
		name: string;
		url: string;
		type: "website" | "certificate" | "project" | "other";
	}[];
	icon?: string; // Iconify icon name
	color?: string;
	featured?: boolean;
}

export const timelineData: TimelineItem[] = [
	{
		id: "current-study",
		title: "水环境遥感研究",
		description:
			"极地红绿雪藻反演及演替研究",
		type: "project",
		startDate: "2025-09-01",
		location: "珠海",
		organization: "中山大学",
		skills: ["Java", "Python", "JavaScript", "HTML/CSS", "MySQL"],
		achievements: [
			"发表SCI一区TOP论文一份",
			"发表国家发明专利一项",

		],
		icon: "material-symbols:school",
		color: "#059669",
		featured: true,
	},

		{
		id: "undergraduate-study",
		title: "丰富多彩本科生活",
		description:
			"2020-2024，最自由开心的四年（当时不觉得",
		type: "education",
		startDate: "2020-09-01",
		endDate:"2024-6-23",
		location: "南京",
		organization: "河海大学",
		skills: ["Java", "Python", "JavaScript", "HTML/CSS", "MySQL"],
		achievements: [
			"尝试了许多传媒相关工作",
			"交到人生好友",
			"疫情3年让我有充足时间、空间思考我的人生价值与目标所在",
			"2022开始听播客，我在一方空间聆听世界"

		],
		icon: "material-symbols:school",
		color: "#059669",
		featured: true,
	},


	// {
	// 	id: "mizuki-blog-project",
	// 	title: "Mizuki Personal Blog Project",
	// 	description:
	// 		"A personal blog website developed using the Astro framework as a practical project for learning frontend technologies.",
	// 	type: "project",
	// 	startDate: "2024-06-01",
	// 	endDate: "2024-08-01",
	// 	skills: ["Astro", "TypeScript", "Tailwind CSS", "Git"],
	// 	achievements: [
	// 		"Mastered modern frontend development tech stack",
	// 		"Learned responsive design and user experience optimization",
	// 		"Completed the full process from design to deployment",
	// 	],
	// 	links: [
	// 		{
	// 			name: "GitHub Repository",
	// 			url: "https://github.com/example/mizuki-blog",
	// 			type: "project",
	// 		},
	// 		{
	// 			name: "Live Demo",
	// 			url: "https://mizuki-demo.example.com",
	// 			type: "website",
	// 		},
	// 	],
	// 	icon: "material-symbols:code",
	// 	color: "#7C3AED",
	// 	featured: true,
	// },
	// {
	// 	id: "summer-internship-2024",
	// 	title: "Frontend Development Intern",
	// 	description:
	// 		"Summer internship at an internet company, participating in frontend development of web applications.",
	// 	type: "work",
	// 	startDate: "2024-07-01",
	// 	endDate: "2024-08-31",
	// 	location: "Beijing",
	// 	organization: "TechStart Internet Company",
	// 	position: "Frontend Development Intern",
	// 	skills: ["React", "JavaScript", "CSS3", "Git", "Figma"],
	// 	achievements: [
	// 		"Completed user interface component development",
	// 		"Learned team collaboration and code standards",
	// 		"Received outstanding internship performance certificate",
	// 	],
	// 	icon: "material-symbols:work",
	// 	color: "#DC2626",
	// 	featured: true,
	// },
	// {
	// 	id: "web-development-course",
	// 	title: "Completed Web Development Online Course",
	// 	description:
	// 		"Completed a full-stack web development online course, systematically learning frontend and backend development technologies.",
	// 	type: "achievement",
	// 	startDate: "2024-01-15",
	// 	endDate: "2024-05-30",
	// 	organization: "Mooc Website",
	// 	skills: ["HTML", "CSS", "JavaScript", "Node.js", "Express"],
	// 	achievements: [
	// 		"Received course completion certificate",
	// 		"Completed 5 practical projects",
	// 		"Mastered full-stack development fundamentals",
	// 	],
	// 	links: [
	// 		{
	// 			name: "Course Certificate",
	// 			url: "https://certificates.example.com/web-dev",
	// 			type: "certificate",
	// 		},
	// 	],
	// 	icon: "material-symbols:verified",
	// 	color: "#059669",
	// },
	// {
	// 	id: "student-management-system",
	// 	title: "Student Management System Course Project",
	// 	description:
	// 		"Final project for the database course, developed a complete student information management system.",
	// 	type: "project",
	// 	startDate: "2023-11-01",
	// 	endDate: "2023-12-15",
	// 	skills: ["Java", "MySQL", "Swing", "JDBC"],
	// 	achievements: [
	// 		"Received excellent course project grade",
	// 		"Implemented complete CRUD functionality",
	// 		"Learned database design and optimization",
	// 	],
	// 	icon: "material-symbols:database",
	// 	color: "#EA580C",
	// },
	// {
	// 	id: "programming-contest",
	// 	title: "University Programming Contest",
	// 	description:
	// 		"Participated in a programming contest held by the university, improving algorithm and programming skills.",
	// 	type: "achievement",
	// 	startDate: "2023-10-20",
	// 	location: "Beijing Institute of Technology",
	// 	organization: "School of Computer Science",
	// 	skills: ["C++", "Algorithms", "Data Structures"],
	// 	achievements: [
	// 		"Won third prize in university contest",
	// 		"Improved algorithmic thinking ability",
	// 		"Strengthened programming fundamentals",
	// 	],
	// 	icon: "material-symbols:emoji-events",
	// 	color: "#7C3AED",
	// },
	// {
	// 	id: "part-time-tutor",
	// 	title: "Part-time Programming Tutor",
	// 	description:
	// 		"Provided programming tutoring for high school students, helping them learn Python basics.",
	// 	type: "work",
	// 	startDate: "2023-09-01",
	// 	endDate: "2024-01-31",
	// 	position: "Programming Tutor",
	// 	skills: ["Python", "Teaching", "Communication"],
	// 	achievements: [
	// 		"Helped 3 students master Python basics",
	// 		"Improved expression and communication skills",
	// 		"Gained teaching experience",
	// 	],
	// 	icon: "material-symbols:school",
	// 	color: "#059669",
	// },
	// {
	// 	id: "high-school-graduation",
	// 	title: "High School Graduation",
	// 	description:
	// 		"Graduated from high school with excellent grades and was admitted to the Computer Science and Technology program at Beijing Institute of Technology.",
	// 	type: "education",
	// 	startDate: "2019-09-01",
	// 	endDate: "2022-06-30",
	// 	location: "Jinan, Shandong",
	// 	organization: "No.1 High School of Jinan",
	// 	achievements: [
	// 		"College entrance exam score: 620",
	// 		"Received municipal model student award",
	// 		"Won provincial second prize in math competition",
	// 	],
	// 	icon: "material-symbols:school",
	// 	color: "#2563EB",
	// },
	// {
	// 	id: "first-programming-experience",
	// 	title: "First Programming Experience",
	// 	description:
	// 		"First encountered programming in high school IT class, started learning Python basic syntax.",
	// 	type: "education",
	// 	startDate: "2021-03-01",
	// 	skills: ["Python", "Basic Programming Concepts"],
	// 	achievements: [
	// 		'Completed first "Hello World" program',
	// 		"Learned basic loops and conditional statements",
	// 		"Developed interest in programming",
	// 	],
	// 	icon: "material-symbols:code",
	// 	color: "#7C3AED",
	// },
];

// Get timeline statistics
export const getTimelineStats = () => {
	const total = timelineData.length;
	const byType = {
		education: timelineData.filter((item) => item.type === "education")
			.length,
		work: timelineData.filter((item) => item.type === "work").length,
		project: timelineData.filter((item) => item.type === "project").length,
		achievement: timelineData.filter((item) => item.type === "achievement")
			.length,
	};

	return { total, byType };
};

// Get timeline items by type
export const getTimelineByType = (type?: string) => {
	if (!type || type === "all") {
		return timelineData.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
	}
	return timelineData
		.filter((item) => item.type === type)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
};

// Get featured timeline items
export const getFeaturedTimeline = () => {
	return timelineData
		.filter((item) => item.featured)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
};

// Get current ongoing items
export const getCurrentItems = () => {
	return timelineData.filter((item) => !item.endDate);
};

// Calculate total work experience
export const getTotalWorkExperience = () => {
	const workItems = timelineData.filter((item) => item.type === "work");
	let totalMonths = 0;

	workItems.forEach((item) => {
		const startDate = new Date(item.startDate);
		const endDate = item.endDate ? new Date(item.endDate) : new Date();
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
		totalMonths += diffMonths;
	});

	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
