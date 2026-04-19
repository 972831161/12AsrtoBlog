import re

svg_content = """        <svg viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg" 
             style="width:100%; display:block; background:#0d0d0f; border: 1px solid var(--border); border-radius: 4px;">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#00f3ff" />
                </marker>
                <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ff4444" />
                </marker>
                <marker id="arrowhead-orange" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ffaa44" />
                </marker>
            </defs>
            
            <path d="M0 0 L960 0 M0 80 L960 80 M0 160 L960 160 M0 240 L960 240 M0 320 L960 320 M0 400 L960 400" stroke="#1a1a1c" stroke-width="1" fill="none" />
            <text x="480" y="40" text-anchor="middle" font-family="'JetBrains Mono'" font-size="14" fill="#666" letter-spacing="4">DECISION_TREE: CONTENT_MIGRATION_V4.0</text>

            <!-- 1. Start -->
            <rect x="20" y="140" width="80" height="40" rx="20" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" filter="url(#glow)" />
            <text x="60" y="164" text-anchor="middle" font-size="11" fill="#fff">源视频</text>
            <path d="M100 160 L140 160" fill="none" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />

            <!-- Decision 1: Theme -->
            <path d="M180 120 L220 160 L180 200 L140 160 Z" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" />
            <text x="180" y="156" text-anchor="middle" font-size="10" fill="#fff">产品相关/</text>
            <text x="180" y="170" text-anchor="middle" font-size="10" fill="#fff">公司形象?</text>
            
            <path d="M180 200 L180 370 L730 370" fill="none" stroke="#ff4444" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrowhead-red)" />
            <text x="230" y="270" font-size="10" fill="#ff4444">否(太生活化)</text>
            
            <path d="M220 160 L280 160" fill="none" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />
            <text x="240" y="155" font-size="10" fill="#00f3ff">是</text>

            <!-- Decision 2: Risk -->
            <path d="M320 120 L360 160 L320 200 L280 160 Z" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" />
            <text x="320" y="156" text-anchor="middle" font-size="10" fill="#fff">公关风险</text>
            <text x="320" y="170" text-anchor="middle" font-size="10" fill="#fff">评估?</text>

            <path d="M320 200 L320 370" fill="none" stroke="#ff4444" stroke-width="1.5" stroke-dasharray="4" />
            <text x="330" y="270" font-size="10" fill="#ff4444">有风险(踩红线)</text>
            
            <path d="M360 160 L420 160" fill="none" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />
            <text x="380" y="155" font-size="10" fill="#00f3ff">无风险</text>

            <!-- Decision 3: Time -->
            <path d="M460 120 L500 160 L460 200 L420 160 Z" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" />
            <text x="460" y="156" text-anchor="middle" font-size="10" fill="#fff">内容实效性</text>
            <text x="460" y="170" text-anchor="middle" font-size="10" fill="#fff">校验?</text>

            <path d="M460 200 L460 370" fill="none" stroke="#ff4444" stroke-width="1.5" stroke-dasharray="4" />
            <text x="470" y="270" font-size="10" fill="#ff4444">否(旧展会/已过期)</text>

            <path d="M500 160 L560 160" fill="none" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />
            <text x="520" y="155" font-size="10" fill="#00f3ff">适用</text>

            <!-- Decision 4: Edit required? -->
            <path d="M600 120 L640 160 L600 200 L560 160 Z" fill="#0a1a1a" stroke="#00f3ff" stroke-width="1.5" />
            <text x="600" y="156" text-anchor="middle" font-size="10" fill="#fff">需要改造</text>
            <text x="600" y="170" text-anchor="middle" font-size="10" fill="#fff">整合吗?</text>

            <!-- To Direct -->
            <path d="M600 120 L600 90 L730 90" fill="none" stroke="#00f3ff" stroke-width="1.5" marker-end="url(#arrowhead)" />
            <text x="610" y="85" font-size="10" fill="#00f3ff">否(完美契合直接发)</text>

            <!-- To Edit -->
            <path d="M640 160 L690 160 L690 230 L730 230" fill="none" stroke="#ffaa44" stroke-width="1.5" marker-end="url(#arrowhead-orange)" />
            <text x="650" y="155" font-size="10" fill="#ffaa44">是(提取特写/重修标题)</text>

            <!-- Baskets -->
            <rect x="740" y="65" width="180" height="50" rx="4" fill="#001a1a" stroke="#00f3ff" stroke-width="2" filter="url(#glow)"/>
            <text x="830" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#00f3ff">01 官号直发复用库</text>

            <rect x="740" y="205" width="180" height="50" rx="4" fill="#1a1a00" stroke="#ffaa44" stroke-width="2" filter="url(#glow)"/>
            <text x="830" y="235" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffaa44">02 二次剪辑重塑库</text>

            <rect x="740" y="345" width="180" height="50" rx="4" fill="#1a0000" stroke="#ff4444" stroke-width="1.5" />
            <text x="830" y="375" text-anchor="middle" font-size="12" fill="#ff4444">03 个人封存淘汰废弃库</text>

        </svg>"""

with open('mission-archive.html', 'r', encoding='utf-8') as f:
    html = f.read()

start_tag = '<svg viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg"'
end_tag = '</svg>'

s_idx = html.find(start_tag)
e_idx = html.find(end_tag)

if s_idx != -1 and e_idx != -1:
    new_html = html[:s_idx] + svg_content.strip() + html[e_idx + len(end_tag):]
    with open('mission-archive.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("Replaced SVG successfully!")
else:
    print("Could not find SVG tags.")

