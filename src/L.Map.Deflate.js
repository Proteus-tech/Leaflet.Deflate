L.Map.Deflate = L.Map.extend({
    options: {
        minSize: 10
    },

    removedPaths: [],

    isCollapsed: function (path, zoom) {
        var bounds = path.getBounds();

        var ne_px = this.project(bounds.getNorthEast(), zoom);
        var sw_px = this.project(bounds.getSouthWest(), zoom);

        var width = ne_px.x - sw_px.x;
        var height = sw_px.y - ne_px.y;
        return (height < this.options.minSize || width < this.options.minSize);
    },

    getZoomThreshold: function (path) {
        var zoomThreshold = null;
        var zoom = this.getZoom();
        if (this.isCollapsed(path, this.getZoom())) {
            while (!zoomThreshold) {
                zoom += 1;
                if (!this.isCollapsed(path, zoom)) {
                    zoomThreshold = zoom - 1;
                }
            }
        } else {
            while (!zoomThreshold) {
                zoom -= 1;
                if (this.isCollapsed(path, zoom)) {
                    zoomThreshold = zoom;
                }
            }
        }
        return zoomThreshold;
    },

    initialize: function (id, options) {
        L.Map.prototype.initialize.call(this, id, options);
        options = L.setOptions(this, options);

        this.on('layeradd', function(event) {
            var feature = event.layer;
            if (feature.getBounds && !feature.zoomThreshold) {
                var zoomThreshold = this.getZoomThreshold(feature);
                feature.zoomThreshold = zoomThreshold;

                if (this.getZoom() <= zoomThreshold) {
                    this.removeLayer(feature);
                }
            }
        });

        this.on('zoomend', function () {
            var removedTemp = [];
            this.removedPaths = [];

            this.eachLayer(function (feature) {
                if (this.getZoom() <= feature.zoomThreshold) {
                    this.removeLayer(feature);
                    removedTemp.push(feature);
                }
            }, this);

            for (var i = 0; i < this.removedPaths.length; i++) {
                var feature = this.removedPaths[i];
                if (this.getZoom() > feature.zoomThreshold) {
                    this.addLayer(feature);
                    this.removedPaths.splice(i, 1);
                    i = i - 1;
                }
            }

            this.removedPaths = this.removedPaths.concat(removedTemp);
        });
    }
});

L.map.deflate = function (id, options) {
	return new L.Map.Deflate(id, options);
};
