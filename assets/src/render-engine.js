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
		window.Geo_Maps_Rendered[ID].invalidateSize();
	};


}(jQuery));
