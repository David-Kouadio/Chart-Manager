var grid;
var dotNetRef;

function dashboardInit() {
    if (grid) return; 

    var options = {
        column: 12,
        cellHeight: 120,
        animate: true,
        float: true,
        acceptWidgets: true,
        removable: '#trash',
        resizable: { handles: 'e,w,n,s' },
        draggable: { scroll: false, handle: '.widget-drag-handle' },
        margin: 10,
    };
    let insert = [ {h: 2, content: 'new item'}];

    grid = GridStack.init(options);

    //Grid  
    
    GridStack.setupDragIn('.sidepanel>.grid-stack-item', undefined, insert);

    grid.on('resizestop', function(event, el) {
        var canvas = el.querySelector('canvas');
        if (!canvas) return;
        var chart = Chart.getChart(canvas);
        if (chart) chart.resize();
    });

    grid.on('removed', function(event, items) {
        items.forEach(function(item) {
            var wId = item.el.getAttribute('data-widget-id');
            if (wId && dotNetRef) dotNetRef.invokeMethodAsync('DeleteWidget', wId);
        });
        if (dotNetRef) dotNetRef.invokeMethodAsync('UpdateWidgetCount', items.length);
    });

    grid.on('change', function(event, items) {
        if (isRestoring) return;
        items.forEach(function(item) {
            var el              = item.el;
            var widgetId        = el.getAttribute('data-widget-id');
            var widgetType      = el.getAttribute('data-widget-type');
            var chartDataSource = el.getAttribute('data-chart-source') || '';
            var chartType       = el.getAttribute('data-chart-type')   || 'bar';
            var bg              = (el.querySelector('.widget-wrapper') || {}).style?.background || 'lightblue';
            var text            = (el.querySelector('span') || {}).textContent || '';
            if (!widgetId || !dotNetRef) return;
            dotNetRef.invokeMethodAsync('SaveWidgetFull', widgetId, widgetType, item.x, item.y, item.w, item.h, chartDataSource, bg, text, chartType);
        });
    });

    //Modal

    document.querySelectorAll('.color-option').forEach(function(el) {
        el.addEventListener('click', function() {
            _editSelectedColor = el.getAttribute('data-color');
            document.querySelectorAll('.color-option').forEach(function(o) {
                o.classList.remove('is-selected');
            });
            el.classList.add('is-selected');
        });
    });

    document.getElementById('edit-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
}

function setDotNetRef(ref) {
    dotNetRef = ref;
}

//Modal

var _editWidgetEl      = null;
var _editSelectedColor = 'lightblue';
var _editSelectedType  = 'text';
var _editIsNew         = false;

function openEditModal(widgetEl, isNew) {
    _editWidgetEl = widgetEl;
    _editIsNew    = isNew === true;

    var wrapper          = widgetEl.querySelector('.widget-wrapper');
    var currentBg        = wrapper ? wrapper.style.background : 'lightblue';
    var currentType      = widgetEl.getAttribute('data-widget-type')   || 'text';
    var currentText      = (widgetEl.querySelector('span') || {}).textContent || '';
    var currentSource    = widgetEl.getAttribute('data-chart-source')  || 'new_registrations';
    var currentChartType = widgetEl.getAttribute('data-chart-type')    || 'bar';

    setEditType(currentType);
    document.getElementById('edit-text-input').value   = currentText;
    document.getElementById('edit-chart-source').value = currentSource;
    document.getElementById('edit-chart-type').value   = currentChartType;

    _editSelectedColor = currentBg;
    document.querySelectorAll('.color-option').forEach(function(el) {
        el.classList.toggle('is-selected', el.getAttribute('data-color') === currentBg);
    });

    document.getElementById('edit-modal-overlay').style.display = 'flex';
}

function setEditType(type) {
    _editSelectedType = type;
    document.getElementById('edit-section-text').style.display   = (type === 'text')  ? 'block' : 'none';
    document.getElementById('edit-section-chart').style.display  = (type === 'chart') ? 'block' : 'none';
    document.getElementById('edit-type-text').classList.toggle('is-active', type === 'text');
    document.getElementById('edit-type-chart').classList.toggle('is-active', type === 'chart');
}

function closeEditModal() {
    if (_editIsNew && _editWidgetEl) {
        grid.removeWidget(_editWidgetEl);
    }
    document.getElementById('edit-modal-overlay').style.display = 'none';
    _editWidgetEl = null;
    _editIsNew    = false;
}

function applyEditModal() {
    if (!_editWidgetEl) return;

    var widgetId     = _editWidgetEl.getAttribute('data-widget-id');
    var node         = _editWidgetEl.gridstackNode;
    var newType      = _editSelectedType;
    var newBg        = _editSelectedColor;
    var newText      = document.getElementById('edit-text-input').value;
    var newSource    = document.getElementById('edit-chart-source').value;
    var newChartType = document.getElementById('edit-chart-type').value;

    var wrapper  = _editWidgetEl.querySelector('.widget-wrapper');
    var innerDiv = _editWidgetEl.querySelector('.widget-wrapper > div:last-child');

    if (wrapper) wrapper.style.background = newBg;

    if (newType === 'text') {
        _editWidgetEl.setAttribute('data-widget-type', 'text');
        _editWidgetEl.removeAttribute('data-chart-source');
        _editWidgetEl.removeAttribute('data-chart-type');

        // Destruir chart existente se houver
        var oldCanvas = innerDiv ? innerDiv.querySelector('canvas') : null;
        if (oldCanvas) {
            var oldChart = Chart.getChart(oldCanvas);
            if (oldChart) oldChart.destroy();
        }

        if (innerDiv) innerDiv.innerHTML = '';
        var span = document.createElement('span');
        span.textContent = newText || 'Widget';
        if (innerDiv) innerDiv.appendChild(span);

        if (dotNetRef)
            dotNetRef.invokeMethodAsync('SaveWidgetFull', widgetId, 'text', node.x, node.y, node.w, node.h, '', newBg, newText, '');

    } else {
        _editWidgetEl.setAttribute('data-widget-type', 'chart');
        _editWidgetEl.setAttribute('data-chart-source', newSource);
        _editWidgetEl.setAttribute('data-chart-type', newChartType);

        // Destruir chart existente se houver
        var oldCanvas = innerDiv ? innerDiv.querySelector('canvas') : null;
        if (oldCanvas) {
            var oldChart = Chart.getChart(oldCanvas);
            if (oldChart) oldChart.destroy();
        }

        if (innerDiv) innerDiv.innerHTML = '';
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100% !important; height:90% !important;';
        if (innerDiv) innerDiv.appendChild(canvas);

        if (dotNetRef) {
            dotNetRef.invokeMethodAsync('GetChartDataAndRedraw', widgetId, newSource, newBg, newChartType, node.x, node.y, node.w, node.h)
                .then(function(chartData) {
                    if (chartData && canvas) {
                        

                        new Chart(canvas, {
                            type: newChartType,
                            data: {
                                labels: chartData.labels,
                                datasets: [{ label: chartData.title || newSource, data: chartData.data, borderWidth: 1 }]
                            },
                            options: { 
                                responsive: true,
                                maintainAspectRatio: false,
                                layout: { padding: 2 },
                                plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10, padding: 6 } } },
                                scales: { y: { beginAtZero: true, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } }
                            }
                        });
                    }
                });
        }
    }

    document.getElementById('edit-modal-overlay').style.display = 'none';
    _editWidgetEl = null;
    _editIsNew    = false;
}

function buildWrapper(bg) {
    var wrapper = document.createElement('div');
    wrapper.className = 'widget-wrapper';
    wrapper.style.background = bg;
    return wrapper;
}

function buildEditBtn(widgetEl) {
    var btn = document.createElement('button');
    btn.className = 'edit-btn';
    btn.textContent = '✏️';
    btn.title = 'Editar widget';
    btn.addEventListener('click', function(e) { e.stopPropagation(); openEditModal(widgetEl); });
    return btn;
}

function buildDelBtn(widgetEl) {
    var btn = document.createElement('button');
    btn.className = 'del-btn';
    btn.textContent = '🗑️';
    btn.title = 'Excluir widget';
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este widget?')) grid.removeWidget(widgetEl);
    });
    return btn;
}

function buildDragHandle() {
    var handle = document.createElement('div');
    handle.className = 'widget-drag-handle';
    return handle;
}


function CreateWidget() {
    var uniqueId = 'widget-' + Date.now();
    var widgetEl = grid.addWidget({ w: 2, h: 1, minW: 2 });
    widgetEl.setAttribute('data-widget-id', uniqueId);
    widgetEl.setAttribute('data-widget-type', 'text');

    var contentEl = widgetEl.querySelector('.grid-stack-item-content');
    var wrapper   = buildWrapper('lightblue');
    var innerDiv  = document.createElement('div');
    innerDiv.className = 'widget-body';
    var span = document.createElement('span');
    span.textContent = 'Widget';
    innerDiv.appendChild(span);
    wrapper.appendChild(buildDragHandle());
    wrapper.appendChild(buildEditBtn(widgetEl));
    wrapper.appendChild(buildDelBtn(widgetEl));
    wrapper.appendChild(innerDiv);
    contentEl.appendChild(wrapper);

    openEditModal(widgetEl, true);
}

var isRestoring = false;

function RestoreWidget(widgetId, type, x, y, w, h, chartData, chartSource, bg, text, chartType) {
    
    var widgetEl = grid.addWidget({ id: widgetId, x: x, y: y, w: w, h: h, minW: 2 });

    widgetEl.setAttribute('data-widget-id', widgetId);
    widgetEl.setAttribute('data-widget-type', type);
    if (chartSource) widgetEl.setAttribute('data-chart-source', chartSource);
    if (chartType)   widgetEl.setAttribute('data-chart-type',   chartType);

    var contentEl = widgetEl.querySelector('.grid-stack-item-content');
    var wrapper   = buildWrapper(bg || 'lightblue');
    var innerDiv  = document.createElement('div');
    innerDiv.className = 'widget-body';

    if (type === 'text') {
        var span = document.createElement('span');
        span.textContent = text || 'Widget';
        innerDiv.appendChild(span);
    } else {
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100% !important; height:90% !important;';
        new Chart(canvas, {
            type: chartType || 'bar',
            data: { labels: chartData.labels, datasets: [{ label: chartData.title || '', data: chartData.data, borderWidth: 1 }] },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 2 },
                plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10, padding: 6 } } },
                scales: { y: { beginAtZero: true, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } }
            }
        });
        innerDiv.appendChild(canvas);
    }

    wrapper.appendChild(buildDragHandle());
    wrapper.appendChild(buildDelBtn(widgetEl));
    wrapper.appendChild(buildEditBtn(widgetEl));
    wrapper.appendChild(innerDiv);
    contentEl.appendChild(wrapper);
}

function setRestoring(value) { isRestoring = value; }

function populateChartSources(sources) {
    var select = document.getElementById('edit-chart-source');
    if (!select) return;
    select.innerHTML = '';
    sources.forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.key;
        opt.textContent = s.label;
        select.appendChild(opt);
    });
}
