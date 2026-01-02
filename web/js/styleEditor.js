// 样式编辑模块

class StyleEditor {
    constructor(layerManager) {
        this.layerManager = layerManager;
        this.layerStyles = this.loadStyles();
        this.initDefaultStyles();
    }

    // 初始化默认样式
    initDefaultStyles() {
        const defaultStyles = {
            boundary: { color: '#4a90e2', fillColor: '#e8f4f8', opacity: 1, fillOpacity: 0.1, weight: 2 },
            roads: { color: '#ff6b6b', opacity: 0.7, weight: 2 },
            metroLines: { color: '#9b59b6', opacity: 0.8, weight: 3 },
            metroStations: { color: '#e74c3c', fillColor: '#e74c3c', opacity: 1, fillOpacity: 0.8, radius: 5, weight: 2 },
            scenicSpots: { color: '#f39c12', fillColor: '#f39c12', opacity: 1, fillOpacity: 0.8, radius: 8, weight: 2 },
            hotels: { color: '#3498db', fillColor: '#3498db', opacity: 1, fillOpacity: 0.8, radius: 6, weight: 2 }
        };

        // 合并默认样式和保存的样式
        Object.keys(defaultStyles).forEach(layerType => {
            if (!this.layerStyles[layerType]) {
                this.layerStyles[layerType] = { ...defaultStyles[layerType] };
            } else {
                this.layerStyles[layerType] = {
                    ...defaultStyles[layerType],
                    ...this.layerStyles[layerType]
                };
            }
        });
    }

    // 从LocalStorage加载样式
    loadStyles() {
        try {
            const saved = localStorage.getItem('mapLayerStyles');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Error loading styles from localStorage:', e);
            return {};
        }
    }

    // 保存样式到LocalStorage
    saveStyles() {
        try {
            localStorage.setItem('mapLayerStyles', JSON.stringify(this.layerStyles));
        } catch (e) {
            console.error('Error saving styles to localStorage:', e);
        }
    }

    // 获取图层样式
    getLayerStyle(layerType) {
        return this.layerStyles[layerType] || {};
    }

    // 设置图层颜色
    setLayerColor(layerType, color) {
        if (!this.layerStyles[layerType]) {
            this.layerStyles[layerType] = {};
        }
        this.layerStyles[layerType].color = color;
        // 对于点要素，同时设置fillColor
        if (['scenicSpots', 'hotels', 'metroStations'].includes(layerType)) {
            this.layerStyles[layerType].fillColor = color;
        }
        this.updateLayer(layerType);
        this.saveStyles();
    }

    // 设置图层填充颜色（仅面要素）
    setLayerFillColor(layerType, fillColor) {
        if (!this.layerStyles[layerType]) {
            this.layerStyles[layerType] = {};
        }
        this.layerStyles[layerType].fillColor = fillColor;
        this.updateLayer(layerType);
        this.saveStyles();
    }

    // 设置图层透明度
    setLayerOpacity(layerType, opacity) {
        if (!this.layerStyles[layerType]) {
            this.layerStyles[layerType] = {};
        }
        this.layerStyles[layerType].opacity = opacity;
        // 对于面要素，同时设置fillOpacity
        if (layerType === 'boundary') {
            this.layerStyles[layerType].fillOpacity = opacity * 0.1;
        }
        this.updateLayer(layerType);
        this.saveStyles();
    }

    // 设置点要素大小（半径）
    setPointRadius(layerType, radius) {
        if (!['scenicSpots', 'hotels', 'metroStations'].includes(layerType)) {
            return;
        }
        if (!this.layerStyles[layerType]) {
            this.layerStyles[layerType] = {};
        }
        this.layerStyles[layerType].radius = radius;
        this.updateLayer(layerType);
        this.saveStyles();
    }

    // 设置线宽
    setLineWeight(layerType, weight) {
        if (!['roads', 'metroLines', 'boundary'].includes(layerType)) {
            return;
        }
        if (!this.layerStyles[layerType]) {
            this.layerStyles[layerType] = {};
        }
        this.layerStyles[layerType].weight = weight;
        this.updateLayer(layerType);
        this.saveStyles();
    }

    // 更新图层
    updateLayer(layerType) {
        if (this.layerManager) {
            this.layerManager.updateLayerStyle(layerType, this.getLayerStyle(layerType));
        }
    }

    // 导出配置
    exportConfig() {
        return JSON.stringify(this.layerStyles, null, 2);
    }

    // 导入配置
    importConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            this.layerStyles = config;
            this.initDefaultStyles();
            
            // 更新所有图层
            Object.keys(this.layerStyles).forEach(layerType => {
                this.updateLayer(layerType);
            });
            
            this.saveStyles();
            return true;
        } catch (e) {
            console.error('Error importing config:', e);
            return false;
        }
    }

    // 重置为默认样式
    resetStyles() {
        this.layerStyles = {};
        this.initDefaultStyles();
        
        // 更新所有图层
        Object.keys(this.layerStyles).forEach(layerType => {
            this.updateLayer(layerType);
        });
        
        this.saveStyles();
    }
}

window.StyleEditor = StyleEditor;
