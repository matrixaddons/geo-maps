<?php

use MatrixAddons\GeoMaps\Repositories\MapRepository;

if (!function_exists('geo_maps_render_map')) {
	function geo_maps_render_map($map_args = array())
	{
		$default_map_args = wp_parse_args($map_args, array(
				'map_id' => '',
				'settings' => array(),
				'style' => array(),
		));

		$inline_style = '';
		foreach ($default_map_args['style'] as $style_code => $style_value) {
			$inline_style .= esc_attr($style_code) . ':' . esc_attr($style_value) . ';';
		}
		$inline_style = rtrim($inline_style, ';');


		?>
		<div class="geo-maps-map-render-element-wrap">
			<div id="<?php echo('' != $map_args['map_id'] ? esc_attr($map_args['map_id']) : ''); ?>"
				 data-settings='<?php echo htmlspecialchars(json_encode($default_map_args['settings']), ENT_QUOTES, 'UTF-8'); ?>'
				 class="geo_maps_map_render_element" style="<?php echo esc_attr($inline_style); ?>"></div>
		</div>
		<?php
	}
}

if (!function_exists('geo_maps_get_map_settings')) {
	function geo_maps_get_map_settings($map_id = null)
	{
		$map_id = is_null($map_id) ? get_the_ID() : absint($map_id);

		$map_repository = new MapRepository($map_id);

		$markers = $map_repository->get_markers();

		$map_markers = array();

		$map_type = $map_repository->get_map_type();

		$center_index = 0;

		$center_marker_index = null;

		$popup_show_on = $map_repository->get_popup_show_on();

		$control_position = $map_repository->get_control_position();

		/** @var \MatrixAddons\GeoMaps\Models\MarkerModel $marker */
		foreach ($markers as $marker_index => $marker) {

			$marker_item = array(
					'lat' => $marker->get_latitude(),
					'lng' => $marker->get_longitude(),
					'title' => $marker->get_title(),
					'content' => $marker->get_tooltip_content(),
			);
			if ($marker->get_icon_url() != '') {
				$marker_item['iconType'] = 'custom';
				$marker_item['customIconUrl'] = $marker->get_icon_url();
				$marker_item['customIconWidth'] = $marker->get_icon_width();
				$marker_item['customIconHeight'] = $marker->get_icon_height();
			}
			$map_markers[] = $marker_item;
			if (is_null($center_marker_index)) {
				$center_marker_index = $marker->is_centered_marker() ? $marker_index : null;

			}
		}
		$center_index = is_null($center_marker_index) ? $center_index : absint($center_marker_index);

		if (count($map_markers) < 1) {
			$map_markers[] = geo_maps_get_default_marker_item();
		}
		$center_index = count($map_markers) > $center_index ? $center_index : 0;
		$settings = [
				'map_marker' => $map_markers,
				'map_zoom' => 8,
				'scroll_wheel_zoom' => $map_repository->is_scroll_wheel_zoom(),
				'map_type' => $map_type,
				'center_index' => $center_index,
				'popup_show_on' => $popup_show_on,
				'control_position' => $control_position,
				'show_control' => $control_position !== 'hide',
				'osm_provider' => $map_repository->get_osm_provider()

		];

		$map_width = '100%';

		$map_height = '500px';

		return array(
				'map_id' => 'geo_maps_container_id_' . $map_id . '_unique_' . uniqid(),
				'settings' => $settings,
				'style' => array(
						'height' => $map_height,
						'width' => $map_width
				)

		);

	}
}


if (!function_exists('geo_maps_call_map')) {

	function geo_maps_call_map($attributes = array())
	{


		$map_id = isset($attributes['map_id']) ? absint($attributes['map_id']) : 0;

		ob_start();

		if (absint($map_id) < 1) {

			echo '<h2>Please select at least one map from setting.</h2>';

		} else {

			$height = isset($attributes['height']) ? geo_maps_parse_css_value($attributes['height']) : '';

			$width = isset($attributes['width']) ? geo_maps_parse_css_value($attributes['width']) : '';

			$map_settings = geo_maps_get_map_settings($map_id);

			$map_height = $height != '' ? $height : $map_settings['style']['height'];

			$map_width = $width != '' ? $width : $map_settings['style']['width'];

			$map_settings['style'] = array(
					'height' => $map_height,
					'width' => $map_width
			);

			geo_maps_render_map($map_settings);


		}
		return ob_get_clean();
	}
}

if (!function_exists('geo_maps_get_all_map_lists')) {
	function geo_maps_get_all_map_lists()
	{
		$all_posts = get_posts(array('posts_per_page' => -1, 'post_type' => 'geo-maps'));
		$all_maps[] = ['label' => __('Select Map', 'geo-maps'), 'value' => 0];
		foreach ($all_posts as $post_id => $post) {
			$all_maps[] = ['label' => $post->post_title, 'value' => $post->ID];
		}
		return $all_maps;

	}
}

if (!function_exists('geo_maps_get_default_marker_item')) {
	function geo_maps_get_default_marker_item()
	{
		return array(
				'lat' => '27.7172',
				'lng' => '85.3240',
				'title' => __('Tooltip Title', 'geo-maps'),
				'content' => __('Tooltip Content', 'geo-maps'),
				'customIconWidth' => 25,
				'customIconHeight' => 41,
				'iconType' => '',
				'customIconUrl' => '',
		);
	}
}
if (!function_exists('geo_maps_get_osm_providers')) {
	function geo_maps_get_osm_providers()
	{
		return array(
				'default' => array(
						'url' => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
						'attribution' => '',
						'title' => __('Default', 'geo-maps')
				),
				'opnv_karte' => array(
						'url' => 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
						'attribution' => 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
						'title' => __('OPNVKarte', 'geo-maps')
				),
				'open_topo_map' => array(
						'url' => 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
						'attribution' => 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
						'title' => __('OpenTopoMap', 'geo-maps')
				),
				'stamen_toner_background' => array(
						'url' => 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.png',
						'attribution' => 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
						'title' => __('Stamen_TonerBackground', 'geo-maps')
				),
				'stamen_watercolor' => array(
						'url' => 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
						'attribution' => 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
						'title' => __('Stamen_Watercolor', 'geo-maps')
				),
				'esri_world_imagery' => array(
						'url' => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
						'attribution' => 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
						'title' => __('Esri_WorldImagery', 'geo-maps')
				),
				'cycl_osm' => array(
						'url' => 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
						'attribution' => '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
						'title' => __('Cycl OSM', 'geo-maps')
				),
		);
	}
}


if (!function_exists('geo_maps_get_google_map_providers')) {
	function geo_maps_get_google_map_providers()
	{
		return array(
				'default' => array(
						'url' => 'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i349018013!3m9!2sen-US!3sUS!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0',
						'attribution' => ''
				)
		);
	}
}

if (!function_exists('geo_maps_parse_css_value')) {

	function geo_maps_parse_css_value($css_value)
	{
		if ($css_value === '') {
			return '';
		}
		$unit = 'px';

		$css_value = strtolower($css_value);

		if (strpos($css_value, "%") !== false) {
			$unit = '%';
			$css_value = str_replace('%', '', $css_value);
		} else if (strpos($css_value, "px") !== false) {
			$unit = 'px';
			$css_value = str_replace('px', '', $css_value);
		}

		$css_value = absint($css_value);

		if ($css_value < 1) {

			return '';
		}

		return $css_value . $unit;

	}
}

