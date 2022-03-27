<?php

namespace MatrixAddons\GeoMaps\Admin\FieldItems;


class Image
{
	public static function render($field, $field_id, $value, $group_id = null)
	{
		$class = $field['class'] ?? '';

		$after = $field['after'] ?? '';

		$field_name = !(is_null($group_id)) ? $group_id . '[' . $field_id . ']' : $field_id;

		echo '
					<div class="matrixaddons-fieldset">
					<input type="text" name="' . esc_attr($field_name) . '" value="' . esc_attr($value) . '" class="' . esc_attr($class) . '" />
					' . $after . '
					</div>

				';
	}

	public static function sanitize($field, $raw_value, $field_id)
	{

		return sanitize_text_field($raw_value);
	}

}
