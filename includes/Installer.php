<?php
namespace MatrixAddons\GeoMaps;

class Installer
{
    public static function init()
    {
        $self = new self();
        $self->set_option();
    }
    public function set_option()
    {
        if (!get_option('geo_maps_version')) {
            add_option('geo_maps_version', GEO_MAPS_VERSION);
        }
        if (!get_option('geo_maps_first_install_time')) {
            add_option('geo_maps_first_install_time', time() + (get_option('gmt_offset') * HOUR_IN_SECONDS));
        }
    }
}
