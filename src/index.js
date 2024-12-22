// 初始化全局变量
window.uigoRecorder = null;
window.uigoUI = null;

function initUIGO() {
    if (!window.uigoRecorder) {
        window.uigoRecorder = new UIRecorder();
    }
    if (!window.uigoUI) {
        window.uigoUI = new FloatingUI();
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUIGO);
} else {
    initUIGO();
}

// 监听页面变化，确保在SPA导航后重新初始化
const observer = new MutationObserver(() => {
    if (!document.querySelector('.uigo-control-panel')) {
        initUIGO();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
}); 