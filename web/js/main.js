// 主逻辑文件

let dataLoader, mapManager, styleEditor, layerManager;
let allData = null;

// 初始化应用
async function init() {
    try {
        // 初始化数据加载器
        dataLoader = new DataLoader();

        // 初始化地图管理器
        mapManager = new MapManager('map');

        // 初始化样式编辑器
        styleEditor = new StyleEditor(null); // 稍后设置layerManager

        // 初始化图层管理器
        layerManager = new LayerManager(mapManager.getMap(), styleEditor);

        // 更新样式编辑器的图层管理器引用
        styleEditor.layerManager = layerManager;

        // 加载所有数据
        console.log('加载数据中...');
        allData = await dataLoader.loadAllData();
        console.log('数据加载完成');

        // 添加图层
        addAllLayers();

        // 初始化UI事件
        initUIEvents();

            // 适应边界
        if (allData.nanjingBoundary) {
            const boundaryLayer = layerManager.getLayer('boundary');
            if (boundaryLayer) {
                try {
                    mapManager.fitBounds(boundaryLayer.getBounds());
                } catch (error) {
                    console.warn('适应边界失败:', error);
                }
            }
        }

        // 更新图层开关状态（禁用未加载的图层）
        updateLayerCheckboxes();

        console.log('应用初始化完成');
    } catch (error) {
        console.error('初始化错误:', error);
        alert('初始化失败，请检查控制台错误信息');
    }
}

// 添加所有图层
function addAllLayers() {
    // 添加市界
    if (allData.nanjingBoundary) {
        const boundaryLayer = layerManager.addBoundaryLayer(allData.nanjingBoundary);
        if (boundaryLayer) {
            mapManager.getMap().addLayer(boundaryLayer);
        }
    }

    // 添加道路
    if (allData.primaryRoads) {
        const roadsLayer = layerManager.addRoadsLayer(allData.primaryRoads);
        if (roadsLayer) {
            mapManager.getMap().addLayer(roadsLayer);
        }
    }

    // 添加地铁线路
    if (allData.metroLines) {
        const metroLinesLayer = layerManager.addMetroLinesLayer(allData.metroLines);
        if (metroLinesLayer) {
            mapManager.getMap().addLayer(metroLinesLayer);
        }
    }

    // 添加地铁站点
    if (allData.metroStations) {
        const metroStationsLayer = layerManager.addMetroStationsLayer(allData.metroStations);
        if (metroStationsLayer) {
            mapManager.getMap().addLayer(metroStationsLayer);
        } else {
            console.warn('地铁站点数据为空，跳过加载');
        }
    }

    // 添加景点
    if (allData.scenicSpots) {
        const scenicSpotsLayer = layerManager.addScenicSpotsLayer(allData.scenicSpots);
        if (scenicSpotsLayer) {
            mapManager.getMap().addLayer(scenicSpotsLayer);
        }
    }

    // 添加酒店
    if (allData.hotels) {
        const hotelsLayer = layerManager.addHotelsLayer(allData.hotels);
        if (hotelsLayer) {
            mapManager.getMap().addLayer(hotelsLayer);
        }
    }

    // 创建热力图（不自动添加）
    if (allData.scenicSpots && allData.scenicSpots.features && allData.scenicSpots.features.length > 0) {
        layerManager.addHeatLayer(allData.scenicSpots);
    }
}

// 更新图层checkbox状态
function updateLayerCheckboxes() {
    const layerMap = {
        'layer-boundary': 'boundary',
        'layer-roads': 'roads',
        'layer-metro-lines': 'metroLines',
        'layer-metro-stations': 'metroStations',
        'layer-scenic-spots': 'scenicSpots',
        'layer-hotels': 'hotels'
    };

    Object.keys(layerMap).forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        const layerType = layerMap[checkboxId];
        const layer = layerManager.getLayer(layerType);
        
        if (!layer) {
            checkbox.disabled = true;
            checkbox.checked = false;
            if (checkbox.parentElement) {
                checkbox.parentElement.style.opacity = '0.5';
            }
        }
    });

    // 热力图checkbox
    const heatmapCheckbox = document.getElementById('layer-heatmap');
    if (!layerManager.heatLayer) {
        heatmapCheckbox.disabled = true;
        heatmapCheckbox.checked = false;
        if (heatmapCheckbox.parentElement) {
            heatmapCheckbox.parentElement.style.opacity = '0.5';
        }
    }
}

// 初始化UI事件
function initUIEvents() {
    // 图层开关
    const boundaryCheckbox = document.getElementById('layer-boundary');
    if (boundaryCheckbox) {
        boundaryCheckbox.addEventListener('change', (e) => {
            layerManager.toggleLayer('boundary', e.target.checked);
        });
    }

    const roadsCheckbox = document.getElementById('layer-roads');
    if (roadsCheckbox) {
        roadsCheckbox.addEventListener('change', (e) => {
            layerManager.toggleLayer('roads', e.target.checked);
        });
    }

    const metroLinesCheckbox = document.getElementById('layer-metro-lines');
    if (metroLinesCheckbox) {
        metroLinesCheckbox.addEventListener('change', (e) => {
            layerManager.toggleLayer('metroLines', e.target.checked);
        });
    }

    const metroStationsCheckbox = document.getElementById('layer-metro-stations');
    if (metroStationsCheckbox) {
        metroStationsCheckbox.addEventListener('change', (e) => {
            layerManager.toggleLayer('metroStations', e.target.checked);
        });
    }

    const scenicSpotsCheckbox = document.getElementById('layer-scenic-spots');
    if (scenicSpotsCheckbox) {
        scenicSpotsCheckbox.addEventListener('change', (e) => {
            layerManager.toggleLayer('scenicSpots', e.target.checked);
        });
    }

    const hotelsCheckbox = document.getElementById('layer-hotels');
    if (hotelsCheckbox) {
        hotelsCheckbox.addEventListener('change', (e) => {
            layerManager.toggleLayer('hotels', e.target.checked);
        });
    }

    const heatmapCheckbox = document.getElementById('layer-heatmap');
    if (heatmapCheckbox) {
        heatmapCheckbox.addEventListener('change', (e) => {
            layerManager.toggleHeatLayer(e.target.checked);
        });
    }

    // 图层选择变化
    const layerSelect = document.getElementById('layer-select');
    layerSelect.addEventListener('change', () => {
        updateStyleControls();
    });

    // 颜色选择器
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('change', (e) => {
        const layerType = layerSelect.value;
        styleEditor.setLayerColor(layerType, e.target.value);
    });

    // 填充颜色选择器（仅面要素）
    const fillColorPicker = document.getElementById('fill-color-picker');
    fillColorPicker.addEventListener('change', (e) => {
        const layerType = layerSelect.value;
        styleEditor.setLayerFillColor(layerType, e.target.value);
    });

    // 透明度滑块
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    opacitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        opacityValue.textContent = Math.round(value * 100) + '%';
        const layerType = layerSelect.value;
        styleEditor.setLayerOpacity(layerType, value);
    });

    // 底图透明度滑块
    const basemapOpacitySlider = document.getElementById('basemap-opacity-slider');
    const basemapOpacityValue = document.getElementById('basemap-opacity-value');
    if (basemapOpacitySlider) {
        basemapOpacitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            basemapOpacityValue.textContent = Math.round(value * 100) + '%';
            if (mapManager && typeof mapManager.setBaseLayerOpacity === 'function') {
                mapManager.setBaseLayerOpacity(value);
            }
        });
        // 初始化为当前底图透明度
        if (mapManager && typeof mapManager.getBaseLayerOpacity === 'function') {
            const initial = mapManager.getBaseLayerOpacity();
            basemapOpacitySlider.value = initial;
            basemapOpacityValue.textContent = Math.round(initial * 100) + '%';
        }
    }

    // 大小/线宽滑块
    const sizeSlider = document.getElementById('size-slider');
    const sizeValue = document.getElementById('size-value');
    sizeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        sizeValue.textContent = value;
        const layerType = layerSelect.value;
        const layerTypeInfo = getLayerTypeInfo(layerType);
        if (layerTypeInfo.isPoint) {
            styleEditor.setPointRadius(layerType, value);
        } else {
            styleEditor.setLineWeight(layerType, value);
        }
    });

    // 标签显示
    const showLabelsCheckbox = document.getElementById('show-labels');
    showLabelsCheckbox.addEventListener('change', (e) => {
        const layerType = layerSelect.value;
        const labelLayerType = getLabelLayerType(layerType);
        if (labelLayerType && e.target.checked) {
            // 如果标签图层不存在，创建它
            if (!layerManager.labelLayers[labelLayerType]) {
                if (labelLayerType === 'scenicSpots' && allData.scenicSpots) {
                    layerManager.addLabels(allData.scenicSpots, labelLayerType, (feature) => {
                        return feature.properties?.Name || feature.properties?.名称 || '';
                    });
                } else if (labelLayerType === 'hotels' && allData.hotels) {
                    layerManager.addLabels(allData.hotels, labelLayerType, (feature) => {
                        return feature.properties?.名称 || feature.properties?.Name || '';
                    });
                }
            }
            layerManager.toggleLabels(labelLayerType, true);
        } else if (labelLayerType) {
            layerManager.toggleLabels(labelLayerType, false);
        }
    });

    // 导出配置
    document.getElementById('export-config').addEventListener('click', () => {
        const config = styleEditor.exportConfig();
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map-config.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // 导入配置
    const configFileInput = document.getElementById('config-file-input');
    document.getElementById('import-config').addEventListener('click', () => {
        configFileInput.click();
    });

    configFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const configJson = event.target.result;
                if (styleEditor.importConfig(configJson)) {
                    alert('配置导入成功');
                    updateStyleControls();
                } else {
                    alert('配置导入失败，请检查文件格式');
                }
            };
            reader.readAsText(file);
        }
    });

    // 重置配置
    document.getElementById('reset-config').addEventListener('click', () => {
        if (confirm('确定要重置为默认配置吗？')) {
            styleEditor.resetStyles();
            updateStyleControls();
            alert('配置已重置');
        }
    });

    // 初始化样式控件
    updateStyleControls();
}

// 更新样式控件
function updateStyleControls() {
    const layerSelect = document.getElementById('layer-select');
    const layerType = layerSelect.value;
    const style = styleEditor.getLayerStyle(layerType);
    const layerInfo = getLayerTypeInfo(layerType);

    // 更新颜色选择器
    const colorPicker = document.getElementById('color-picker');
    if (style.color) {
        colorPicker.value = style.color;
    }

    // 更新填充颜色选择器（仅面要素）
    const fillColorControl = document.getElementById('fill-color-control');
    const fillColorPicker = document.getElementById('fill-color-picker');
    if (layerInfo.isPolygon) {
        fillColorControl.style.display = 'block';
        if (style.fillColor) {
            fillColorPicker.value = style.fillColor;
        }
    } else {
        fillColorControl.style.display = 'none';
    }

    // 更新透明度滑块
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const opacity = style.opacity !== undefined ? style.opacity : 1;
    opacitySlider.value = opacity;
    opacityValue.textContent = Math.round(opacity * 100) + '%';

    // 更新大小/线宽滑块
    const sizeSlider = document.getElementById('size-slider');
    const sizeValue = document.getElementById('size-value');
    const sizeLabel = document.getElementById('size-label');
    
    if (layerInfo.isPoint) {
        sizeLabel.textContent = '大小：';
        sizeSlider.min = 3;
        sizeSlider.max = 20;
        const radius = style.radius !== undefined ? style.radius : 8;
        sizeSlider.value = radius;
        sizeValue.textContent = radius;
    } else {
        sizeLabel.textContent = '线宽：';
        sizeSlider.min = 1;
        sizeSlider.max = 10;
        const weight = style.weight !== undefined ? style.weight : 2;
        sizeSlider.value = weight;
        sizeValue.textContent = weight;
    }

    // 更新标签复选框（仅点要素）
    const showLabels = document.getElementById('show-labels').parentElement;
    if (layerInfo.hasLabels) {
        showLabels.style.display = 'block';
    } else {
        showLabels.style.display = 'none';
    }
}

// 获取图层类型信息
function getLayerTypeInfo(layerType) {
    const pointLayers = ['scenicSpots', 'hotels', 'metroStations'];
    const polygonLayers = ['boundary'];
    const hasLabelLayers = ['scenicSpots', 'hotels'];

    return {
        isPoint: pointLayers.includes(layerType),
        isPolygon: polygonLayers.includes(layerType),
        hasLabels: hasLabelLayers.includes(layerType)
    };
}

// 获取标签图层类型
function getLabelLayerType(layerType) {
    const labelMap = {
        'scenicSpots': 'scenicSpots',
        'hotels': 'hotels'
    };
    return labelMap[layerType] || null;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
