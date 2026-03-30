import { getSortedPosts } from "../../utils/content-utils";
import diaryData from "../../data/diary";
import lfcMatches from "../../data/lfc-match";

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

	const allLfcMatches = lfcMatches.map((match) => {
		const venueTag = match.isHome ? "[主]" : "[客]";
		const competitionMap: Record<string, string> = {
			"Premier League": "英超",
			"Champions League": "欧冠",
			"FA Cup": "足总杯",
			"League Cup": "联赛杯",
		};
		const competitionCN = competitionMap[match.competition] || match.competition;

		return {
			id: match.id,
			title: `${venueTag} ${match.opponent}`,
			date: match.date,
			type: "lfc-match",
			opponent: match.opponent,
			competition: competitionCN,
			venue: match.venue,
			result: match.result || "",
			time: match.time,
		};
	});

	const combinedData = [...allPostsData, ...allDiaryData, ...allLfcMatches];

	return new Response(JSON.stringify(combinedData), {
		headers: {
			"Content-Type": "application/json",
		},
	});
}
