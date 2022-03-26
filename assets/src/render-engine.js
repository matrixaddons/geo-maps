window.Geo_Maps_Render = null;
window.Geo_Maps_Rendered = {};
(function ($) {
	Geo_Maps_Render = (ID, Settings) => {
		var open_street_map = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
		var google_map =
			"https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i349018013!3m9!2sen-US!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0";
		var cities = L.layerGroup();
		const decodeHtml = (str) => {
			if (str == '') {
				return str;
			}
			var map = {
				"&amp;": "&",
				"&lt;": "<",
				"&gt;": ">",
				"&quot;": '"',
				"&#039;": "'",
			};
			return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, function (m) {
				return map[m];
			});
		};
		Settings.map_marker.forEach(function (item, index) {
			var popupHTML = "";
			if (item.title !== "") {
				popupHTML += "<h6>" + item.title + "</h6>";
			}
			if (item.content !== "") {
				popupHTML += "<p>" + decodeHtml(item.content) + "</p>";
			}
			var is_draggable = typeof item.draggable !== undefined ? item.draggable : 'false';
			var item_marker = null;
			if (item.iconType === "custom") {
				var LeafIcon = L.Icon.extend({
					options: {
						iconSize: [item.customIconWidth, item.customIconHeight],
						popupAnchor: [0, -15],
					},
				});
				var icon = new LeafIcon({iconUrl: item.customIconUrl});
				if (item.title !== "" || item.content !== "") {
					item_marker = L.marker([item.lat, item.lng], {icon: icon, draggable: is_draggable})
						.bindPopup(popupHTML)
						.addTo(cities);
				} else {
					item_marker = L.marker([item.lat, item.lng], {icon: icon, draggable: is_draggable}).addTo(cities);
				}
			} else {
				if (item.title !== "" || item.content !== "") {
					item_marker = L.marker([item.lat, item.lng], {draggable: is_draggable}).bindPopup(popupHTML).addTo(cities);
				} else {
					item_marker = L.marker([item.lat, item.lng], {draggable: is_draggable}).addTo(cities);
				}

			}
			if (typeof item.dragendCallback !== undefined) {
				item_marker.on('dragend', item.dragendCallback);
			}

		});
		var mapType = Settings.map_type === "open_street_map" ? open_street_map : google_map;
		var grayscale = L.tileLayer(mapType, {
			id: "mapbox/light-v9",
		});
		let config = {
			zoom: Settings.map_zoom,
			layers: [grayscale, cities],
			fullscreenControl: true,
			scrollWheelZoom: Settings.scroll_wheel_zoom,
			fullscreenControlOptions: {
				position: "topright",
			}
		};
		if (Settings.map_marker.length) {
			config.center = [
				Settings.map_marker[Settings.center_index].lat,
				Settings.map_marker[Settings.center_index].lng,
			];
		}
		if (typeof window.Geo_Maps_Rendered[ID] != "undefined") {
			window.Geo_Maps_Rendered[ID].off();
			window.Geo_Maps_Rendered[ID].remove();
		}


		window.Geo_Maps_Rendered[ID] = L.map(ID, config);
		var osm = L.TileLayer.boundaryCanvas("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
			boundary: geom(),
			attribution: "Map data &copy; 2012 OpenStreetMap contributors",
			trackAttribution: true
		}).addTo(window.Geo_Maps_Rendered[ID]);
		window.Geo_Maps_Rendered[ID].invalidateSize();
	};

	function geom() {
		return {
			"type": "MultiPolygon", "coordinates": [
				[[[36.375733, 56.475540], [37.661133, 56.699837], [39.089356, 56.402508], [39.572754, 55.627130], [39.155274, 55.051062], [38.089600, 54.817004], [36.672364, 54.886732], [35.727541, 55.377699], [35.815432, 56.072117], [36.375733, 56.475540]],
					[[37.488099, 55.890415], [37.372743, 55.810070], [37.380983, 55.728008], [37.485353, 55.600703], [37.677613, 55.577371], [37.825929, 55.639560], [37.839662, 55.763641], [37.820436, 55.837900], [37.589723, 55.905846], [37.488099, 55.890415]]],

				[[[41.539307, 57.370676], [43.077393, 57.471439], [43.813477, 57.329104], [43.692627, 56.572696], [43.352051, 55.664406], [41.978760, 55.321357], [40.759278, 55.352667], [40.111084, 55.874975], [40.187989, 56.536291], [40.627442, 56.958829], [41.539307, 57.370676]]]
			]
		};
	}


}(jQuery));
