<?php

namespace MatrixAddons\GeoMaps;
class MarkerSetting
{

	public static function get_settings()
	{
		return array(
			array(
				'title' => __('Enable booking notification email for customer', 'geo-maps'),
				'desc' => __('This option allows you to enable/disable booking notification email for customer.', 'geo-maps'),
				'type' => 'repeater',
				'new_item_text' => __('Add new marker', 'geo-maps'),
				'fields' => self::repeater_fields()
			)
		);
	}

	private static function repeater_fields()
	{

		return array(
			array(
				'title' => __('Title', 'geo-maps'),
				'id' => 'title',
				'type' => 'text',
				'default' => '',
			)
		);
	}
}
