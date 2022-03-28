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
		/** @var \MatrixAddons\GeoMaps\Models\MarkerModel $marker */
		foreach ($markers as $marker_index => $marker) {

			$marker_item = array(
					'lat' => $marker->get_latitude(),
					'lng' => $marker->get_longitude(),
					'title' => $marker->get_title(),
					'content' => $marker->get_tooltip_content()
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

			$settings = geo_maps_get_map_settings($map_id);

			geo_maps_render_map($settings);


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
				'content' => __('Tooltip Content', 'geo-maps')
		);
	}
}
