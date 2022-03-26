<?php

namespace MatrixAddons\GeoMaps;

class Migration
{
	public static function init()
	{
		$self = new self();
		$self->run_migration();
	}

	public function run_migration()
	{
		if (get_option('geo_maps_version') != GEO_MAPS_VERSION) {
			update_option('geo_maps_version', GEO_MAPS_VERSION);
		}
		if (!get_option('geo_maps_first_install_time')) {
			add_option('geo_maps_first_install_time', time() + (get_option('gmt_offset') * HOUR_IN_SECONDS));
		}
	}
}
