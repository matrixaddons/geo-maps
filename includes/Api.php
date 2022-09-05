<?php

namespace MatrixAddons\GeoMaps;


class Api
{

	/**
	 * Endpoint route.
	 *
	 * @since 1.0.0
	 */
	const REST_ROUTE = '/maps/(?P<id>[\d]+)';


	const MAIN_ROUTE = 'geo-maps/v1';

	/**
	 * Registers REST API routes.
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public function register_routes()
	{
		register_rest_route(self::MAIN_ROUTE, self::REST_ROUTE, array(
			'methods' => \WP_REST_Server::CREATABLE,
			'callback' => array($this, 'handle_request'),
			'permission_callback' => array($this, 'validate_request')
		));
	}

	public function handle_request(\WP_REST_Request $request)
	{

		$map_id = absint($request['id']);

		$height = geo_maps_parse_css_value($request->get_param('height'));

		$width = geo_maps_parse_css_value($request->get_param('width'));

		if ($map_id < 1) {
			return rest_ensure_response(array('message' => __('Please select at least one map from block setting.', 'geo-maps')));
		}

		if (!current_user_can('edit_posts')) {
			return new \WP_Error('rest_geo_maps_permission_denied', esc_html__('Permission denied.', 'geo-maps'), array('status' => 500));
		}

		if (get_post_type($map_id) != 'geo-maps' || get_post_status($map_id) != 'publish') {
			return new \WP_Error('rest_geo_maps_map_id_invalid', esc_html__('The map doesnt exists.', 'geo-maps'), array('status' => 404));
		}

		$map_settings = geo_maps_get_map_settings($map_id);

		$map_height = $height != '' ? $height : $map_settings['style']['height'];

		$map_width = $width != '' ? $width : $map_settings['style']['width'];

		$map_settings['style'] = array(
			'height' => $map_height,
			'width' => $map_width
		);

		ob_start();

		geo_maps_render_map($map_settings);

		$template = ob_get_clean();

		return rest_ensure_response(array('template' => $template));

	}

	public function validate_request(\WP_REST_Request $request)
	{

		$id = absint($request['id']);

		if ($id < 1) {
			return true;
		}

		if (!current_user_can('edit_posts')) {
			return false;
		}

		if (get_post_type($id) != 'geo-maps' || get_post_status($id) != 'publish') {
			return false;
		}


		return true;
	}

	public static function init()
	{
		$self = new self;

		add_action('rest_api_init', array($self, 'register_routes'));

	}
}
