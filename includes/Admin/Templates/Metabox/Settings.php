<div class="postbox">
	<div class="postbox-header"><h2><?php echo esc_html__('Map Settings', 'geo-maps') ?></h2>
	</div>
	<div class="inside">
		<div class="geo-map-metabox">
			<div class="matrixaddons-tabs">
				<div class="matrixaddons-tab-nav">
					<ul>
						<?php


						foreach ($setting_tabs

						as $tab_id => $tab_label) {
						$tab_item_class = $tab_id === $active_tab ? 'matrixaddons-tab-nav-item item-active' : 'matrixaddons-tab-nav-item';
						?>
						<li><a href="#" class="<?php echo esc_attr($tab_item_class) ?>"
							   data-tab="<?php echo esc_attr($tab_id) ?>"
							   id="<?php echo 'matrixaddons_' . esc_attr($tab_id) . '_tab' ?>">
								<?php echo esc_html($tab_label); ?>
							</a>
							<?php } ?>
						</li>


					</ul>
				</div>
				<div class="matrixaddons-tab-content">
					<div class="matrixaddons-tab-sections">
						<?php foreach ($setting_tabs as $tab_id_for_content => $tab_label_for_content) {
							$tab_content_class = $tab_id_for_content === $active_tab ? 'matrixaddons-tab-section' : 'matrixaddons-tab-section matrixaddons-hide';
							$tab_content_class .= ' matrixaddons_' . esc_attr($tab_id_for_content) . '_tab_content';
							?>
							<div class="<?php echo esc_attr($tab_content_class) ?>">
								<?php
								do_action('geo_maps_meta_tab_content_' . $tab_id_for_content);
								?>
							</div>
						<?php } ?>
					</div>
				</div>
				<div class="matrixaddons-nav-background"></div>
				<div class="clear"></div>
				<input type="hidden" name="geo_maps_meta_active_tab" value="<?php echo esc_attr($active_tab) ?>"/>
			</div>
		</div>
	</div>
</div>
