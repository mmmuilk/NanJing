// 地图管理模块

class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.initMap();
    }

    // 初始化地图
    initMap() {
        // 南京市中心坐标（约）
        const nanjingCenter = [32.0572, 118.7781];
        
        // 创建地图实例
        this.map = L.map(this.containerId, {
            center: nanjingCenter,
            zoom: 11,
            zoomControl: false, // 稍后手动添加，以便控制位置
            attributionControl: true
        });

        // 添加底图（OpenStreetMap）
        this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abc',
            maxZoom: 19,
            opacity: 1
        }).addTo(this.map);

        // 添加缩放控件到右上角
        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        // 添加比例尺
        L.control.scale({
            position: 'bottomright',
            metric: true,
            imperial: false
        }).addTo(this.map);
    }

    // 获取地图实例
    getMap() {
        return this.map;
    }

    // 设置地图视图
    setView(center, zoom) {
        if (this.map) {
            this.map.setView(center, zoom);
        }
    }

    // 适应边界
    fitBounds(bounds) {
        if (this.map && bounds) {
            this.map.fitBounds(bounds, {
                padding: [50, 50]
            });
        }
    }

    // 设置底图透明度（0 ~ 1）
    setBaseLayerOpacity(opacity) {
        if (this.baseLayer && typeof this.baseLayer.setOpacity === 'function') {
            this.baseLayer.setOpacity(opacity);
        }
    }

    // 获取底图透明度
    getBaseLayerOpacity() {
        return this.baseLayer ? (this.baseLayer.options && this.baseLayer.options.opacity !== undefined ? this.baseLayer.options.opacity : 1) : 1;
    }

    // 获取地图边界
    getBounds() {
        return this.map ? this.map.getBounds() : null;
    }

    // 销毁地图
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

window.MapManager = MapManager;
