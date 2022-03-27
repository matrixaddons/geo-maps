<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class HTML
{
	public static function render_item($field, $field_id, $value, $group_id = null)
	{
		$type = $field['type'] ?? '';

		$class = 'matrixaddons-field matrixaddons-field-' . esc_attr($type);

		$title = $field['title'] ?? '';
		$desc = $field['desc'] ?? '';

		echo '<div class="' . esc_attr($class) . '" id="' . esc_attr($field_id) . '">';
		echo '<div class="matrixaddons-title">';
		if ($title != '') {
			echo '<h4>' . esc_html($title) . '</h4>';
		}
		if ($desc != '') {
			echo '<small>' . esc_html($desc) . '</small>';
		}
		echo '</div>';
		$class = '';
		switch ($type) {
			case "group":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Group";
				break;
			case "fieldset":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Fieldset";
				break;
			case "content":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Content";
				break;
			case "text":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Text";
				break;
			case "textarea":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Textarea";
				break;
			case "select":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Select";
				break;
			case "checkbox":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Checkbox";
				break;
			case "image":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Image";
				break;
		}
		if (class_exists($class)) {
			$class::render($field, $field_id, $value, $group_id);
		}


		echo '<div class="clear"></div>';

		echo '</div>';
	}

	public static function render($fields, $group_id = null)
	{
		foreach ($fields as $field_id => $field) {

			$value = get_post_meta(get_the_ID(), $field_id, true);

			self::render_item($field, $field_id, $value, $group_id);

		}


	}

	public static function sanitize($settings, $post_data)
	{
		$valid_data = array();

		foreach ($settings as $field_id => $field) {

			$raw_data = $post_data[$field_id] ?? null;

			if (!is_null($raw_data)) {

				$valid_data[$field_id] = self::sanitize_item($field, $raw_data, $field_id);
			}
		}
		return $valid_data;
	}

	public static function sanitize_item($field, $raw_data, $field_id)
	{
		$type = $field['type'] ?? '';

		$class = '';

		switch ($type) {
			case "group":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Group";
				break;
			case "fieldset":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Fieldset";
				break;
			case "text":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Text";
				break;
			case "textarea":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Textarea";
				break;
			case "select":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Select";
				break;
			case "checkbox":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Checkbox";
				break;
			case "image":
				$class = "\MatrixAddons\GeoMaps\Admin\FieldItems\Image";
				break;
		}
		if (class_exists($class)) {
			return $class::sanitize($field, $raw_data, $field_id);
		}


		return null;
	}
}
