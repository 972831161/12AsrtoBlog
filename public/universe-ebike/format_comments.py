import re

mapping = {
    "剔除、太生活化": '<span style="color:#ff4444; font-weight:600;">日常非公</span> | 建议废弃',
    "剔除，安全性敏感": '<span style="color:#ff4444; font-weight:600;">涉及红线</span> | 安全合规风险，建议废弃',
    "剔除，官号不适合": '<span style="color:#ff4444; font-weight:600;">调性不符</span> | 建议废弃',
    "剔除，实效性不高": '<span style="color:#ff4444; font-weight:600;">时效过期</span> | 建议废弃',
    "剔除，时效性不高": '<span style="color:#ff4444; font-weight:600;">时效过期</span> | 建议废弃',
    "剔除，有重复的图文版本已上传，时效性有点弱了": '<span style="color:#ff4444; font-weight:600;">内容重复</span> | 图文已发且过期，建议废弃',
    "剔除，直播预告": '<span style="color:#ff4444; font-weight:600;">历史预告</span> | 废旧直播预热，建议废弃',
    "剔除，重复已上传": '<span style="color:#ff4444; font-weight:600;">内容重复</span> | 建议废弃',
    "可以保留，但是标题要改内容要缩短。“老板亲身视察产品质量”": '<span style="color:#ffaa44; font-weight:600;">视察向剪辑</span> | 提炼「视察产品质量」重发',
    "可以保留，但是标题要改内容要缩短。“老板亲身视察产品质量”，后面整合": '<span style="color:#ffaa44; font-weight:600;">视察向剪辑</span> | 提炼「视察产品质量」并作混剪整合',
    "可以保留，但要裁剪，保留和产品牢牢相关的内容，我们与友商与众不同的点，以及未来规划": '<span style="color:#ffaa44; font-weight:600;">产品向剪辑</span> | 提炼保留「防坑及未来规划」特写素材',
    "可以保留，可以在上海展之后进行一波宣传": '<span style="color:#ffaa44; font-weight:600;">展会向首发</span> | 留存作上海展后宣发素材',
    "强烈建议保留，产品教程": '<span style="color:#00ffaa; font-weight:600;">高优必留</span> | 硬核产品教程，直接复用发官号',
    "强烈建议保留，实效性高。而且就是一件很屌事情，可以添加内容，比如说咱们宇宙ebike  oi未来会作为思雨姐的比赛车辆，宣传一波": '<span style="color:#00ffaa; font-weight:600;">高优事件营销</span> | 建议保留并加录「赞助世锦赛选手」口播宣传',
    "强烈建议保留，干货满满。可以加入更多和公司运行、产品相关内容": '<span style="color:#00ffaa; font-weight:600;">高优干货</span> | 建议保留并适当融入公司运营B-roll',
    "暂时剔除、太生活化，但是公司文化最后可以整合": '<span style="color:#ffaa44; font-weight:600;">文化向剥离</span> | 剥离公司文化片段，归档作未来混剪',
    "暂时剔除、时效性不高，但是可以和26年的相结合？": '<span style="color:#ffaa44; font-weight:600;">跨代归档</span> | 延期保存至2026新展会做联合宣发',
    "暂时剔除，ai相关，但是ai部分感觉可以整合做个视频，就比如结合ai的工作流介绍那样。。做高端一点，让潜在用户觉得公司是具有科技嗅觉、且靠谱的": '<span style="color:#ffaa44; font-weight:600;">科技向剥离</span> | 剥离AI工作流片段，重塑并拔高科技品牌形象',
    "暂时剔除，太生活化，但是ai部分感觉可以整合做个视频，就比如结合ai的工作流介绍那样。。做高端一点，让潜在用户觉得公司是具有科技嗅觉、且靠谱的": '<span style="color:#ffaa44; font-weight:600;">科技向剥离</span> | 剥离AI工作流片段，重塑并拔高科技品牌形象'
}

with open('mission-archive.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the SVG typo
html = html.replace('内容实效性', '内容时效性')
html = html.replace('实效性校验', '时效性校验')

# Replace exact strings inside <td>...</td>
for original, replacement in mapping.items():
    html = html.replace(f"<td>{original}</td>", f"<td>{replacement}</td>")

with open('mission-archive.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Modification complete.")
