import json
import re

with open('data.json', 'r') as f:
    data = json.load(f)

# Categorization
cat1 = [] # 官号直发组
cat2 = [] # 二次剪辑组
cat3 = [] # 废弃/封存组

cat2_words = ['裁剪', '缩短', '要改', '重剪', '重新', '提取', '空镜', 'B-roll', '整合', '结合', '加入更多', '重构', '重制']
cat1_words = ['保留', '直发', '直接发', '不错', '发']
cat3_words = ['剔除', '不要', '废弃', '封存', '生活化', '不要发', '不适合']

for row in data:
    adv = row.get('内容迁移建议', str(row.get('内容迁移建议')))
    if adv is None or adv == 'nan' or not str(adv).strip():
        cat = 3
    else:
        adv_str = str(adv)
        if any(w in adv_str for w in cat2_words):
            cat = 2
        elif any(w in adv_str for w in cat1_words):
            cat = 1
        else:
            cat = 3
            
    if cat == 1: cat1.append(row)
    elif cat == 2: cat2.append(row)
    else: cat3.append(row)

# Render HTML
def render_table(rows, cat_name):
    html = f"""
        <table>
            <thead>
                <tr>
                    <th style="width:6%;">序号</th>
                    <th style="width:34%;">原始内容标题</th>
                    <th style="width:44%;">迁移执行批注 (来自业务线反馈)</th>
                    <th style="width:16%;">原文链接</th>
                </tr>
            </thead>
            <tbody>
"""
    for r in rows:
        title = r.get('标题', '')
        link = r.get('链接', '')
        adv = r.get('内容迁移建议', '')
        idx = r.get('序号', '')
        if link and str(link) != 'nan':
            link_html = f'<a href="{link}" target="_blank">查看原文</a>'
        else:
            link_html = 'N/A'
            
        html += f"""                <tr><td>{idx}</td><td>{title}</td><td>{adv}</td><td class="link-cell">{link_html}</td></tr>\n"""
    html += """            </tbody>\n        </table>\n"""
    return html

html_out = f"""
    <!-- ======== 决策流程图 (重构业务版) ======== -->
    <div class="logic-box">
        <svg viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg" 
             style="width:100%; display:block; background:#0d0d0f; border: 1px solid var(--border); border-radius: 4px;">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#00f3ff" />
                </marker>
            </defs>
            
            <path d="M0 0 L960 0 M0 80 L960 80 M0 160 L960 160 M0 240 L960 240 M0 320 L960 320 M0 400 L960 400" stroke="#1a1a1c" stroke-width="1" fill="none" />
            <text x="480" y="40" text-anchor="middle" font-family="'JetBrains Mono'" font-size="14" fill="#444" letter-spacing="4">CONTENT_MIGRATION_FLOW_V3.0</text>

            <!-- 1. Start -->
            <ellipse cx="120" cy="240" rx="60" ry="25" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" filter="url(#glow)" />
            <text x="120" y="245" text-anchor="middle" font-size="12" fill="#fff">个人号源视频</text>
            <path d="M180 240 L240 240" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />

            <!-- 2. Logic -->
            <path d="M300 200 L360 240 L300 280 L240 240 Z" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" />
            <text x="300" y="235" text-anchor="middle" font-size="10" fill="#fff">官方号复用</text>
            <text x="300" y="250" text-anchor="middle" font-size="10" fill="#fff">判定?</text>

            <!-- 3 Branches -->
            <!-- Top: 官号直发 -->
            <path d="M300 200 L300 120 L440 120" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />
            <text x="310" y="150" font-size="11" fill="#00f3ff">直接复用</text>
            
            <!-- Middle: 二次剪辑 -->
            <path d="M360 240 L440 240" stroke="#ffaa44" stroke-width="1.5" marker-end="url(#arrowhead)" />
            <text x="390" y="230" font-size="11" fill="#ffaa44">可重组</text>
            
            <!-- Bottom: 弃用 -->
            <path d="M300 280 L300 360 L440 360" stroke="#ff4444" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrowhead)" />
            <text x="310" y="325" font-size="11" fill="#ff4444">无价值/高风险</text>

            <!-- Baskets -->
            <rect x="440" y="95" width="160" height="50" rx="4" fill="#001a1a" stroke="#00f3ff" stroke-width="2" filter="url(#glow)"/>
            <text x="520" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#00f3ff">01 官号直发/复用资产库</text>

            <rect x="440" y="215" width="160" height="50" rx="4" fill="#1a1a00" stroke="#ffaa44" stroke-width="2" filter="url(#glow)"/>
            <text x="520" y="245" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffaa44">02 二次剪辑/重塑改造库</text>

            <rect x="440" y="335" width="160" height="50" rx="4" fill="#1a0000" stroke="#ff4444" stroke-width="1.5" />
            <text x="520" y="365" text-anchor="middle" font-size="12" fill="#ff4444">03 个人封存/淘汰废弃库</text>
            
        </svg>
    </div>

    <!-- ======== 01 ======== -->
    <div class="section-block">
        <div class="section-label">// 01 DIRECT_REUSE_ASSETS (TOTAL:{len(cat1)})</div>
        <h2>官号直发/复用资产库 <span class="sub">（无需大改，可直接复用于官方号）</span></h2>
        {render_table(cat1, '1')}
    </div>

    <!-- ======== 02 ======== -->
    <div class="section-block">
        <div class="section-label">// 02 REEDIT_ASSETS (TOTAL:{len(cat2)})</div>
        <h2>二次剪辑/重塑改造库 <span class="sub">（需按批注进行裁剪/缩短/信息整合后再发）</span></h2>
        {render_table(cat2, '2')}
    </div>

    <!-- ======== 03 ======== -->
    <div class="section-block">
        <div class="section-label">// 03 ARCHIVED_ASSETS (TOTAL:{len(cat3)})</div>
        <h2>个人封存/淘汰废弃库 <span class="sub">（太生活化或涉嫌风险/重复，官方号不复用）</span></h2>
        <div class="scroll-table-wrap" style="height: 400px;">
        {render_table(cat3, '3')}
        </div>
    </div>
"""

with open('mission-archive.html', 'r', encoding='utf-8') as f:
    content = f.read()

prefix = '<!-- ======== 决策流程图 (专业标准版) ======== -->'
suffix = '<!-- ======== 03 改写执行原则 ======== -->'

if prefix in content and suffix in content:
    start_idx = content.find(prefix)
    end_idx = content.find(suffix)
    new_content = content[:start_idx] + html_out + "\n    " + content[end_idx:]
    with open('mission-archive.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully replaced sections. Cat1: {len(cat1)}, Cat2: {len(cat2)}, Cat3: {len(cat3)}")
else:
    print("Cannot find prefix or suffix markers in HTML.")

