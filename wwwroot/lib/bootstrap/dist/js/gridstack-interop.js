window.gridStackInterop = (() => {
    let grid = null;

    return {
        init() {
            grid = GridStack.init({
                column: 12,
                cellHeight: 80,
                animate: true,
                float: true,
            });
        },

        addWidget(count) {
            if (!grid) return;
            grid.addWidget({
                w: 2,
                h: 2,
                content: `<div class="widget-content">Widget #${count}</div>`
            });
        }
    };
})();