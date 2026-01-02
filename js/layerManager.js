// 图层管理模块

class LayerManager {
    constructor(map, styleEditor) {
        this.map = map;
        this.styleEditor = styleEditor;
        this.layers = {};
        this.layerGroups = {};
        this.defaultStyles = {
            boundary: { color: '#4a90e2', weight: 2, fillColor: '#e8f4f8', fillOpacity: 0.1 },
            roads: { color: '#ff6b6b', weight: 2, opacity: 0.7 },
            metroLines: { color: '#9b59b6', weight: 3, opacity: 0.8 },
            metroStations: { color: '#e74c3c', radius: 5, fillOpacity: 0.8 },
            scenicSpots: { color: '#f39c12', radius: 8, fillOpacity: 0.8 },
            hotels: { color: '#3498db', radius: 6, fillOpacity: 0.8 }
        };
        this.labelLayers = {};
        this.heatLayer = null;
    }

    // 创建图层样式函数
    createStyleFunction(layerType, styleConfig) {
        return (feature) => {
            const defaultStyle = this.defaultStyles[layerType] || {};
            const customStyle = styleConfig || {};
            
            if (layerType === 'scenicSpots' || layerType === 'hotels' || layerType === 'metroStations') {
                // 点要素样式
                return {
                    radius: customStyle.radius || defaultStyle.radius || 8,
                    fillColor: customStyle.color || defaultStyle.color || '#3388ff',
                    color: customStyle.strokeColor || customStyle.color || '#ffffff',
                    weight: customStyle.weight || 2,
                    opacity: customStyle.opacity !== undefined ? customStyle.opacity : 1,
                    fillOpacity: customStyle.fillOpacity !== undefined ? customStyle.fillOpacity : 0.8
                };
            } else {
                // 线要素和面要素样式
                return {
                    color: customStyle.color || defaultStyle.color || '#3388ff',
                    weight: customStyle.weight || defaultStyle.weight || 2,
                    opacity: customStyle.opacity !== undefined ? customStyle.opacity : (defaultStyle.opacity !== undefined ? defaultStyle.opacity : 1),
                    fillColor: customStyle.fillColor || defaultStyle.fillColor,
                    fillOpacity: customStyle.fillOpacity !== undefined ? customStyle.fillOpacity : (defaultStyle.fillOpacity !== undefined ? defaultStyle.fillOpacity : 1)
                };
            }
        };
    }

    // 创建点要素图标
    createPointIcon(style) {
        const radius = style.radius || 8;
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="width: ${radius * 2}px; height: ${radius * 2}px; background-color: ${style.fillColor}; border: 2px solid ${style.color}; border-radius: 50%;"></div>`,
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius]
        });
    }

    // 添加市界图层
    addBoundaryLayer(data) {
        if (!data || !data.features || data.features.length === 0) return null;

        const styleConfig = this.styleEditor?.getLayerStyle('boundary') || {};
        const style = this.createStyleFunction('boundary', styleConfig);
        
        const layer = L.geoJSON(data, {
            style: style,
            onEachFeature: (feature, layer) => {
                layer.on({
                    click: (e) => this.onFeatureClick(e, feature, 'boundary'),
                    mouseover: (e) => this.onFeatureHover(e, feature, 'boundary')
                });
            }
        });

        this.layers.boundary = layer;
        return layer;
    }

    // 添加道路图层
    addRoadsLayer(data) {
        if (!data || !data.features || data.features.length === 0) return null;

        const styleConfig = this.styleEditor?.getLayerStyle('roads') || {};
        const style = this.createStyleFunction('roads', styleConfig);
        
        const layer = L.geoJSON(data, {
            style: style,
            onEachFeature: (feature, layer) => {
                layer.on({
                    click: (e) => this.onFeatureClick(e, feature, 'roads'),
                    mouseover: (e) => this.onFeatureHover(e, feature, 'roads')
                });
            }
        });

        this.layers.roads = layer;
        return layer;
    }

    // 添加地铁线路图层
    addMetroLinesLayer(data) {
        if (!data || !data.features || data.features.length === 0) return null;

        const styleConfig = this.styleEditor?.getLayerStyle('metroLines') || {};
        const style = this.createStyleFunction('metroLines', styleConfig);
        
        const layer = L.geoJSON(data, {
            style: style,
            onEachFeature: (feature, layer) => {
                const name = feature.properties?.线路名 || feature.properties?.Name || '';
                layer.on({
                    click: (e) => this.onFeatureClick(e, feature, 'metroLines'),
                    mouseover: (e) => {
                        e.target.setStyle({ weight: (styleConfig.weight || 3) + 2 });
                        if (name) {
                            e.target.bindPopup(name).openPopup();
                        }
                    },
                    mouseout: (e) => {
                        e.target.setStyle(style(feature));
                        e.target.closePopup();
                    }
                });
            }
        });

        this.layers.metroLines = layer;
        return layer;
    }

    // 添加地铁站点图层
    addMetroStationsLayer(data) {
        if (!data || !data.features || data.features.length === 0) return null;

        const styleConfig = this.styleEditor?.getLayerStyle('metroStations') || {};
        const style = this.createStyleFunction('metroStations', styleConfig);
        
        const layer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const styleObj = style(feature);
                return L.circleMarker(latlng, styleObj);
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    click: (e) => this.onFeatureClick(e, feature, 'metroStations'),
                    mouseover: (e) => {
                        e.target.setStyle({ radius: (styleConfig.radius || 5) + 2 });
                        const name = feature.properties?.name || feature.properties?.名称 || feature.properties?.Name || '地铁站';
                        e.target.bindPopup(name).openPopup();
                    },
                    mouseout: (e) => {
                        e.target.setStyle(style(feature));
                        e.target.closePopup();
                    }
                });
            }
        });

        this.layers.metroStations = layer;
        return layer;
    }

    // 添加景点图层
    addScenicSpotsLayer(data) {
        if (!data || !data.features || data.features.length === 0) return null;

        const styleConfig = this.styleEditor?.getLayerStyle('scenicSpots') || {};
        const style = this.createStyleFunction('scenicSpots', styleConfig);
        
        const layer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const styleObj = style(feature);
                return L.circleMarker(latlng, styleObj);
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    click: (e) => this.onFeatureClick(e, feature, 'scenicSpots'),
                    mouseover: (e) => {
                        e.target.setStyle({ radius: (styleConfig.radius || 8) + 2 });
                        const name = feature.properties?.Name || feature.properties?.名称 || '景点';
                        e.target.bindPopup(name).openPopup();
                    },
                    mouseout: (e) => {
                        e.target.setStyle(style(feature));
                        e.target.closePopup();
                    }
                });
            }
        });

        this.layers.scenicSpots = layer;
        
        // 保存原始数据用于标签
        this.scenicSpotsData = data;

        return layer;
    }

    // 添加酒店图层
    addHotelsLayer(data) {
        if (!data || !data.features || data.features.length === 0) return null;

        const styleConfig = this.styleEditor?.getLayerStyle('hotels') || {};
        const style = this.createStyleFunction('hotels', styleConfig);
        
        const layer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const styleObj = style(feature);
                return L.circleMarker(latlng, styleObj);
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    click: (e) => this.onFeatureClick(e, feature, 'hotels'),
                    mouseover: (e) => {
                        e.target.setStyle({ radius: (styleConfig.radius || 6) + 2 });
                        const name = feature.properties?.名称 || feature.properties?.Name || '酒店';
                        e.target.bindPopup(name).openPopup();
                    },
                    mouseout: (e) => {
                        e.target.setStyle(style(feature));
                        e.target.closePopup();
                    }
                });
            }
        });

        this.layers.hotels = layer;
        
        // 保存原始数据用于标签
        this.hotelsData = data;

        return layer;
    }

    // 添加热力图图层
    addHeatLayer(scenicSpotsData) {
        if (!scenicSpotsData || !scenicSpotsData.features) return null;

        const points = [];
        scenicSpotsData.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const heatValue = feature.properties?.热力值 || 0;
            // 热力值范围大约在0-0.25之间，转换为0-1范围用于热力图
            const intensity = Math.min(heatValue * 4, 1);
            if (coords && coords.length === 2) {
                // GeoJSON坐标是 [lng, lat]，Leaflet.heat需要 [lat, lng]
                const [lng, lat] = coords;
                points.push([lat, lng, intensity]);
            }
        });

        if (points.length === 0) return null;

        const heatLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.0: 'blue',
                0.3: 'cyan',
                0.5: 'lime',
                0.7: 'yellow',
                1.0: 'red'
            }
        });

        this.heatLayer = heatLayer;
        return heatLayer;
    }

    // 添加标签
    addLabels(data, layerType, labelFunction) {
        if (!data || !data.features) return null;

        const labelLayer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const label = labelFunction(feature);
                if (!label) return null;
                return L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'map-label',
                        html: `<div class="label-text">${label}</div>`,
                        iconSize: [100, 20],
                        iconAnchor: [50, 10]
                    })
                });
            }
        });

        this.labelLayers[layerType] = labelLayer;
        return labelLayer;
    }

    // 要素点击事件
    onFeatureClick(e, feature, layerType) {
        L.DomEvent.stopPropagation(e);
        const props = feature.properties || {};
        
        let content = '<div class="popup-content">';
        Object.keys(props).forEach(key => {
            if (key !== 'geometry' && props[key] !== null && props[key] !== undefined) {
                content += `<div><strong>${key}:</strong> ${props[key]}</div>`;
            }
        });
        content += '</div>';

        e.target.bindPopup(content, {
            maxWidth: 300,
            className: 'custom-popup'
        }).openPopup();
    }

    // 要素悬停事件
    onFeatureHover(e, feature, layerType) {
        const props = feature.properties || {};
        const name = props.name || props.名称 || props.Name || props.线路名 || '';
        if (name) {
            e.target.bindPopup(name, {
                className: 'hover-popup'
            }).openPopup();
        }
    }

    // 更新图层样式
    updateLayerStyle(layerType, styleConfig) {
        const layer = this.layers[layerType];
        if (!layer) return;

        const style = this.createStyleFunction(layerType, styleConfig);
        
        layer.eachLayer((featureLayer) => {
            const feature = featureLayer.feature;
            const newStyle = style(feature);
            
            if (layerType === 'scenicSpots' || layerType === 'hotels' || layerType === 'metroStations') {
                featureLayer.setStyle(newStyle);
            } else {
                featureLayer.setStyle(newStyle);
            }
        });
    }

    // 设置图层透明度
    setLayerOpacity(layerType, opacity) {
        const layer = this.layers[layerType];
        if (layer) {
            layer.setStyle({ opacity: opacity, fillOpacity: opacity });
        }
    }

    // 显示/隐藏图层
    toggleLayer(layerType, visible) {
        const layer = this.layers[layerType];
        if (!layer) {
            console.warn(`图层 ${layerType} 不存在`);
            return;
        }

        try {
            if (visible) {
                if (!this.map.hasLayer(layer)) {
                    this.map.addLayer(layer);
                }
            } else {
                if (this.map.hasLayer(layer)) {
                    this.map.removeLayer(layer);
                }
            }
        } catch (error) {
            console.error(`切换图层 ${layerType} 时出错:`, error);
        }
    }

    // 显示/隐藏标签
    toggleLabels(layerType, visible) {
        const labelLayer = this.labelLayers[layerType];
        if (!labelLayer) return;

        if (visible) {
            this.map.addLayer(labelLayer);
        } else {
            this.map.removeLayer(labelLayer);
        }
    }

    // 显示/隐藏热力图
    toggleHeatLayer(visible) {
        if (!this.heatLayer) return;

        if (visible) {
            this.map.addLayer(this.heatLayer);
        } else {
            this.map.removeLayer(this.heatLayer);
        }
    }

    // 获取图层
    getLayer(layerType) {
        return this.layers[layerType];
    }
}

window.LayerManager = LayerManager;
