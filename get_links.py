import pandas as pd

try:
    xl = pd.ExcelFile('/Users/shier/mizuki/ebike-analysis-backup/宇宙ebike内容评论审查汇总.xlsx')
    df_p = xl.parse('抖音(程泓宁个人号)')
    
    selected_titles = [
        '26岁财富自由，个人砸3000万造车',
        '25岁上市公司董事，30岁制造业狼狈转身',
        '一条视频，拆解一步到位的电助力公路车VAPOR',
        '花30万骑行新疆，我被丢在罗布泊无人区',
        '台北自行车展看什么',
        '3金2银2铜！',
        '电助力新品曝光',
        '硅谷调研日记完结',
        '2025上海自行车展',
        '法兰克福报告'
    ]
    
    results = []
    # In df_p: Col 1 is Title, Col 2 is Link
    for title in selected_titles:
        mask = df_p.iloc[:, 1].str.contains(title, na=False, case=False)
        match = df_p[mask]
        if not match.empty:
            results.append({
                'title': match.iloc[0, 1].strip(),
                'link': match.iloc[0, 2]
            })
    
    for r in results:
        print(f"{r['title']} | {r['link']}")

except Exception as e:
    print(f"Error: {e}")
