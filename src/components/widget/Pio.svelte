<script>
import { onDestroy, onMount } from "svelte";
import { pioConfig } from "@/config";

// 将配置转换为 Pio 插件需要的格式
const pioOptions = {
	mode: pioConfig.mode,
	hidden: pioConfig.hiddenOnMobile,
	content: pioConfig.dialog || {},
	model: pioConfig.models || ["/pio/models/pio/model.json"],
};

// 全局Pio实例引用
let pioInstance = null;
let pioInitialized = false;
let pioContainer;
let pioCanvas;

let isImageMode = false;
let imageSrc = "";
let isCubism3 = false;
let pixiApp = null;

function initPio() {
	if (typeof window !== "undefined" && typeof Paul_Pio !== "undefined") {
		try {
			if (pioContainer && pioCanvas && !pioInitialized) {
				pioInstance = new Paul_Pio(pioOptions);
				pioInitialized = true;
				console.log("Pio initialized successfully (Svelte)");
			} else if (!pioContainer || !pioCanvas) {
				console.warn("Pio DOM elements not found, retrying...");
				setTimeout(initPio, 100);
			}
		} catch (e) {
			console.error("Pio initialization error:", e);
		}
	} else {
		setTimeout(initPio, 100);
	}
}

async function initCubism3() {
    if (typeof PIXI === 'undefined' || !PIXI.live2d) {
        setTimeout(initCubism3, 100);
        return;
    }
    if (!pioCanvas) return;

    try {
        const modelUrl = pioOptions.model[0];
        
        pixiApp = new PIXI.Application({
            view: pioCanvas,
            transparent: true,
            width: pioConfig.width || 280,
            height: pioConfig.height || 250,
            autoStart: true,
            backgroundAlpha: 0,
        });

        const model = await PIXI.live2d.Live2DModel.from(modelUrl);
        pixiApp.stage.addChild(model);

        const canvasWidth = pioConfig.width || 280;
        const canvasHeight = pioConfig.height || 250;

        const scaleX = canvasWidth / model.width;
        const scaleY = canvasHeight / model.height;
        model.scale.set(Math.min(scaleX, scaleY));
        
        model.x = (canvasWidth - model.width * model.scale.x) / 2;
        model.y = (canvasHeight - model.height * model.scale.y) / 2;
        
        pioInitialized = true;
        console.log("Cubism 3/4 model initialized successfully via PIXI");
    } catch (e) {
        console.error("Failed to initialize Cubism 3 model:", e);
    }
}

function loadPioAssets() {
	if (typeof window === "undefined") return;

	const loadScript = (src, id) => {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`#${id}`)) {
				resolve();
				return;
			}
			const script = document.createElement("script");
			script.id = id;
			script.src = src;
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	};

    if (isCubism3) {
        Promise.all([
            loadScript("/pio/static/live2dcubismcore.min.js", "cubism-core"),
            loadScript("/pio/static/pixi.min.js", "pixi-js")
        ]).then(() => {
            return loadScript("/pio/static/pixi-live2d-display.min.js", "pixi-live2d");
        }).then(() => {
            setTimeout(initCubism3, 100);
        }).catch(err => {
            console.error("Failed to load Pixi/Live2D scripts:", err);
        });
    } else if (isImageMode) {
        window.loadlive2d = function() { console.log('Image model, skipping Live2D engine'); };
        loadScript("/pio/static/pio.js", "pio-main-script")
            .then(() => {
                setTimeout(initPio, 100);
            })
            .catch((error) => {
                console.error("Failed to load Pio script:", error);
            });
    } else {
        loadScript("/pio/static/l2d.js", "pio-l2d-script")
            .then(() => loadScript("/pio/static/pio.js", "pio-main-script"))
            .then(() => {
                setTimeout(initPio, 100);
            })
            .catch((error) => {
                console.error("Failed to load Pio scripts:", error);
            });
    }
}

onMount(() => {
	if (!pioConfig.enable) return;

    if (pioConfig.hiddenOnMobile && window.matchMedia("(max-width: 1280px)").matches) {
        return;
    }

	if (pioConfig.models && pioConfig.models[0]) {
        const firstModel = pioConfig.models[0];
        if (firstModel.match(/\.(gif|png|jpg|jpeg|webp)$/i)) {
            isImageMode = true;
            imageSrc = firstModel;
        } else if (firstModel.endsWith('.model3.json') || firstModel.endsWith('.moc3')) {
            isCubism3 = true;
        }
    }

	loadPioAssets();
});

onDestroy(() => {
    if (pixiApp) {
        pixiApp.destroy(false, {children: true, texture: true, baseTexture: true});
    }
	console.log("Pio Svelte component destroyed");
});
</script>

{#if pioConfig.enable}
  <div class={`pio-container ${pioConfig.position || 'right'} ${isImageMode ? 'is-image' : ''}`} bind:this={pioContainer} style={isImageMode ? `--pio-avatar: url('${imageSrc}');` : ''}>
    <div class="pio-action"></div>
    {#if isImageMode}
      <img 
        id="pio"
        bind:this={pioCanvas}
        src={imageSrc} 
        alt="看板娘" 
        class="pio-image-avatar"
        style={`width: ${pioConfig.width || 280}px; height: ${pioConfig.height || 250}px; object-fit: contain; cursor: pointer;`}
      />
    {:else}
      <canvas 
        id="pio" 
        bind:this={pioCanvas}
        width={pioConfig.width || 280} 
        height={pioConfig.height || 250}
      ></canvas>
    {/if}
  </div>
{/if}

<style>
  /* Pio 相关样式将通过外部CSS文件加载 */
  .pio-image-avatar {
      transform-origin: bottom center;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .pio-image-avatar:hover {
      transform: scale(1.1);
  }

  /* 针对图片模式的 UI 布局优化：拉宽对话框并推开侧边按钮 */
  :global(.pio-container.is-image .pio-dialog) {
      min-width: unset !important;
      width: max-content !important; /* 根据内容自适应宽度 */
      max-width: none !important; /* 彻底解除最大宽度限制 */
      white-space: nowrap !important; /* 强制在一行内显示，绝不换行 */
      bottom: calc(100% + 0.5em) !important;
  }
  :global(.pio-container.is-image .pio-action) {
      top: 1em !important;
  }
  :global(.pio-container.is-image.left .pio-action) {
      left: -2em !important;
  }
  :global(.pio-container.is-image.right .pio-action) {
      right: -2em !important;
  }
  :global(.pio-container.is-image.left) {
      margin-left: 2em !important;
  }
  :global(.pio-container.is-image.right) {
      margin-right: 2em !important;
  }
  
  /* 替换小黑板被召唤时的默认头像 */
  :global(.pio-container.is-image .pio-show) {
      background-image: var(--pio-avatar) !important;
  }
</style>