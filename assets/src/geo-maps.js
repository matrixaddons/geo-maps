window.geo_maps_ready_call = false;
(function ($) {
	var GeoMapsEditor = {
		init: function () {

			function geo_map_call() {

				if (jQuery(".geo_maps_map_render_element").length) {
					jQuery(".geo_maps_map_render_element").each((index, element) => {
						const Element = jQuery(element);
						jQuery(Element).addClass('geo-maps-init');
						window.geoMapsRenderEngine.renderMap(
							Element.attr("ID"),
							JSON.parse(Element.attr("data-settings"))
						);
					});
					if (jQuery(".geo_maps_map_render_element:not(.geo-maps-init)").length > 0) {
						window.geo_maps_ready_call();
					}
				}
			}

			window.geo_maps_ready_call = () => {

				setTimeout(function () {
					geo_map_call();
				}, 100);
			}


			geo_map_call();


		}
	};

	$(document).ready(function () {
		GeoMapsEditor.init();

	});
}(jQuery));
