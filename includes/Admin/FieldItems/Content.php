<?php

namespace MatrixAddons\GeoMaps\Admin\FieldItems;


class Content
{
	public static function render($field, $field_id, $value, $group_id = null)
	{
		echo "<div id='{$group_id}' class='geo-maps-marker-content-wrap'>";
		echo $field['content'] ?? '';
		echo '</div>';
	}
}
