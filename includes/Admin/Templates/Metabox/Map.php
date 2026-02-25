<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}
?>
<div class="postbox">
	<div class="postbox-header"><h2><?php echo esc_html__('Map Preview', 'geo-maps') ?></h2>
	</div>
	<div class="inside">
		<?php
		do_action('geo_maps_metabox_postbox_item');
		?>
	</div>
</div>
