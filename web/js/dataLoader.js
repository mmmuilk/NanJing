// 数据加载和坐标转换模块

class DataLoader {
    constructor() {
        this.proj = null;
        this.dataCache = {};
        this.initProj4();
    }

    // 初始化Proj4坐标转换
    initProj4() {
        // EPSG:32650 (UTM Zone 50N) 转 WGS84 (EPSG:4326)
        const epsg32650 = '+proj=utm +zone=50 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
        const epsg4326 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
        this.proj = proj4(epsg32650, epsg4326);
    }

    // 转换坐标点
    transformPoint(coordinates) {
        if (!this.proj) {
            console.error('Proj4 not initialized');
            return coordinates;
        }
        // coordinates是 [x, y] 格式，需要转换为 [lng, lat]
        const [x, y] = coordinates;
        const [lng, lat] = this.proj.forward([x, y]);
        return [lng, lat];
    }

    // 转换GeoJSON坐标
    transformGeometry(geometry) {
        if (!geometry || !geometry.coordinates) {
            return geometry;
        }

        const type = geometry.type;
        const coords = geometry.coordinates;

        switch (type) {
            case 'Point':
                return {
                    ...geometry,
                    coordinates: this.transformPoint(coords)
                };
            case 'LineString':
                return {
                    ...geometry,
                    coordinates: coords.map(coord => this.transformPoint(coord))
                };
            case 'Polygon':
                return {
                    ...geometry,
                    coordinates: coords.map(ring => 
                        ring.map(coord => this.transformPoint(coord))
                    )
                };
            case 'MultiPoint':
                return {
                    ...geometry,
                    coordinates: coords.map(coord => this.transformPoint(coord))
                };
            case 'MultiLineString':
                return {
                    ...geometry,
                    coordinates: coords.map(line => 
                        line.map(coord => this.transformPoint(coord))
                    )
                };
            case 'MultiPolygon':
                return {
                    ...geometry,
                    coordinates: coords.map(polygon => 
                        polygon.map(ring => 
                            ring.map(coord => this.transformPoint(coord))
                        )
                    )
                };
            default:
                return geometry;
        }
    }

    // 转换整个GeoJSON FeatureCollection
    transformGeoJSON(geojson) {
        if (!geojson || !geojson.features) {
            return geojson;
        }

        // 检查是否需要转换（如果CRS是EPSG:32650）
        const crs = geojson.crs;
        const needsTransform = crs && (
            crs.properties?.name?.includes('EPSG::32650') ||
            crs.properties?.name?.includes('EPSG:32650') ||
            crs.properties?.name?.includes('urn:ogc:def:crs:EPSG::32650')
        );

        // 如果已经是WGS84、CRS84或没有CRS信息，直接返回
        if (!needsTransform) {
            return geojson;
        }

        return {
            ...geojson,
            features: geojson.features.map(feature => ({
                ...feature,
                geometry: this.transformGeometry(feature.geometry)
            }))
        };
    }

    // 加载GeoJSON文件
    async loadGeoJSON(filename) {
        if (this.dataCache[filename]) {
            return this.dataCache[filename];
        }

        try {
            const response = await fetch(`data/${filename}`);
            const geojson = await response.json();
            const transformed = this.transformGeoJSON(geojson);
            this.dataCache[filename] = transformed;
            return transformed;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    }

    // 加载景点统计数据
    async loadScenicStatistics() {
        try {
            const response = await fetch('data/scenic-statistics.json');
            const stats = await response.json();
            return stats;
        } catch (error) {
            console.error('Error loading scenic statistics:', error);
            return [];
        }
    }

    // 合并景点数据和统计数据
    async mergeScenicData(geojson, statistics) {
        if (!geojson || !statistics) {
            return geojson;
        }

        const statsMap = new Map();
        statistics.forEach(stat => {
            statsMap.set(stat.景点名称, stat);
        });

        return {
            ...geojson,
            features: geojson.features.map(feature => {
                const name = feature.properties?.Name || feature.properties?.名称;
                const stat = statsMap.get(name);
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        ...(stat || {})
                    }
                };
            })
        };
    }

    // 加载所有数据
    async loadAllData() {
        const [scenicSpots, hotels, metroLines, metroStations, primaryRoads, nanjingBoundary, scenicStats] = await Promise.all([
            this.loadGeoJSON('scenic-spots.geojson'),
            this.loadGeoJSON('hotels.geojson'),
            this.loadGeoJSON('metro-lines.geojson'),
            this.loadGeoJSON('metro-stations.geojson'),
            this.loadGeoJSON('primary-roads.geojson'),
            this.loadGeoJSON('nanjing-boundary.geojson'),
            this.loadScenicStatistics()
        ]);

        const scenicSpotsWithStats = await this.mergeScenicData(scenicSpots, scenicStats);

        return {
            scenicSpots: scenicSpotsWithStats,
            hotels,
            metroLines,
            metroStations,
            primaryRoads,
            nanjingBoundary,
            scenicStats
        };
    }
}

// 导出单例
window.DataLoader = DataLoader;
