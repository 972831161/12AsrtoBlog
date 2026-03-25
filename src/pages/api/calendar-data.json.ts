import { getSortedPosts } from "../../utils/content-utils";
import diaryData from "../../data/diary";

export async function GET() {
	const posts = await getSortedPosts();

	const allPostsData = posts.map((post) => {
		const date = new Date(post.data.published);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");

		return {
			id: post.id,
			title: post.data.title,
			date: `${year}-${month}-${day}`,
			type: "post",
		};
	});

	const allDiaryData = diaryData.map((diary) => {
		const date = new Date(diary.date);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");

		return {
			id: String(diary.id),
			title: diary.content.length > 20 ? `${diary.content.substring(0, 20)}...` : diary.content,
			date: `${year}-${month}-${day}`,
			type: "diary",
		};
	});

	const combinedData = [...allPostsData, ...allDiaryData];

	return new Response(JSON.stringify(combinedData), {
		headers: {
			"Content-Type": "application/json",
		},
	});
}
