<?php

namespace MatrixAddons\GeoMaps\Admin\FieldItems;

use MatrixAddons\GeoMaps\Admin\Fields\HTML;

class Group
{
	private static function header($title = '', $up_icon = false)
	{
		$up_icon_class = $up_icon ? 'dashicons-arrow-up-alt2' : 'dashicons-arrow-down-alt2';

		$min_item = 1;

		$min_item_message = __('You cant remove this item. At least one item needed.', 'geo-maps');

		echo '<i class="matrixaddons-repeater-sort matrixaddons-hide dashicons dashicons-move"></i><i
					class="matrixaddons-repeater-clone matrixaddons-hide dashicons dashicons-media-default"></i><i
					class="matrixaddons-repeater-remove matrixaddons-confirm dashicons dashicons-no-alt"
					data-confirm="Are you sure to delete this item?" data-min-item="' . esc_attr($min_item) . '" data-min-item-message="' . esc_attr($min_item_message) . '"></i></div>';
		echo '<h4 class="matrixaddons-repeater-title"><span
				class="dashicons ' . esc_attr($up_icon_class) . ' matrixaddons-repeater-header-icon"></span><span
				class="matrixaddons-repeater-text"><span class="matrixaddons-repeater-value">';
		echo esc_html($title);
		echo '<span class="matrixaddons-repeater-placeholder"></span></span></span></h4>';

	}

	public static function render($field, $field_id, $value, $group_id = null)
	{
		$repeatable = isset($field['repeatable']) && (boolean)$field['repeatable'];
		if ($repeatable) {
			echo '<div class="matrixaddons-repeater-item matrixaddons-repeater-hidden matrixaddon-repeater-template">';
			echo '<div class="matrixaddons-repeater-helper">';
			self::header();
			echo '<div class="matrixaddons-repeater-content">';

			$repeater_group_id = (!is_null($group_id)) ? $group_id . '[' . $field_id . '][0]' : $field_id . '[0]';

			$child_fields = $field['fields'] ?? array();

			if (count($child_fields) > 0) {

				HTML::render($child_fields, '___' . $repeater_group_id);
			}
			echo '</div>';
			echo '</div>';
			echo '<div class="matrixaddons-repeater-wrapper matrixaddons-data-wrapper ui-accordion ui-widget ui-helper-reset ui-sortable">';


			$value_array = is_array($value) ? $value : array();


			if (!empty($value_array)) {

				$child_field_count = 0;

				foreach ($value_array as $value_item) {

					$title = $value_item['title'] ?? __('Sample Title', 'geo-maps');
					echo '<div class="matrixaddons-repeater-item" data-item-id="' . absint($child_field_count) . '">';
					echo '<div class="matrixaddons-repeater-helper">';
					self::header($title, true);
					echo '<div class="matrixaddons-repeater-content matrixaddons-hide">';

					foreach ($child_fields as $child_field_id => $child_field) {

						$group_value_single = $value_item[$child_field_id] ?? '';

						$repeater_group_id = (!is_null($group_id)) ? $group_id . '[' . $field_id . '][' . $child_field_count . ']' : $field_id . '[' . $child_field_count . ']';

						if (count($child_fields) > 0) {

							HTML::render_item($child_field, $child_field_id, $group_value_single, $repeater_group_id);
						}

					}

					echo '</div>';

					echo '</div>';

					$child_field_count++;

				}

			}

			echo '</div>';
			$button_title = $field['button_title'] ?? '';
			echo '<a href="#" class="button button-primary matrixaddons-repeater-add">' . esc_html($button_title) . '</a>';
		}
	}

	public static function sanitize($field, $raw_value, $field_id)
	{
		$child_fields = $field['fields'] ?? array();

		$valid_data = array();

		$repeatable = isset($field['repeatable']) && (boolean)$field['repeatable'];

		if ($repeatable) {

			$raw_data_array = is_array($raw_value) ? $raw_value : array();

			foreach ($raw_data_array as $rp_raw_data_int_id => $rp_raw_data) {

				foreach ($rp_raw_data as $rp_raw_data_id => $rp_raw_data_value) {

					$single_field = $child_fields[$rp_raw_data_id] ?? null;

					if (!is_null($single_field)) {

						$valid_data[$rp_raw_data_int_id][$rp_raw_data_id] = HTML::sanitize_item($single_field, $rp_raw_data_value, $rp_raw_data_id);
					}
				}
			}
		}

		return $valid_data;
	}
}
