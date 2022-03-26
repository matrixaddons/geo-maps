<?php

namespace MatrixAddons\GeoMaps\Admin\FieldItems;

class Textarea
{
	public static function render($field, $field_id, $value, $group_id = null)
	{
		$field_name = !(is_null($group_id)) ? $group_id . '[' . $field_id . ']' : $field_id;

		$class = $field['class'] ?? '';

		echo '
					<div class="matrixaddons-fieldset">
					<textarea name="' . esc_attr($field_name) . '" class="' . esc_attr($class) . '">' . esc_html($value) . '</textarea>
					</div>

				';
	}

	public static function sanitize($field, $raw_value, $field_id)
	{
		return sanitize_text_field($raw_value);
	}
}
