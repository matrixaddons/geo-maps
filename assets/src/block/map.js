import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps} from "@wordpress/block-editor";
import {Panel, PanelBody, RangeControl, TextControl, SelectControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import Icon from "../components/Icon";
import EditEditor from "./edit";

const Edit = (props) => {
	const {attributes, setAttributes} = props;
	const blockProps = useBlockProps();
	const afterMapChange = (map_id) => {
		setAttributes({map_id: map_id});

	}
	const afterWidthChange = (width_string) => {
		setAttributes({width: width_string});

	}
	const afterHeightChange = (height_string) => {
		setAttributes({height: height_string});

	}
	console.log("Map ID " + attributes.map_id);
	return (
		<div {...blockProps}>
			<EditEditor attributes={attributes}/>
			<InspectorControls key="setting">
				<div id="geo-maps-controls">
					<Panel>
						<PanelBody title={__('Geo Map Settings', 'geo-maps')} initialOpen={true}>

							<SelectControl
								label={__('Select Map', 'geo-maps')}
								value={attributes.map_id}
								options={geoMapsBlock.all_maps}
								onChange={(map_id) => afterMapChange(map_id)}
							/>
							<TextControl
								label={__('Map Height[px or %]', 'geo-maps')}
								value={attributes.height}
								onChange={(map_height) => afterHeightChange(map_height)}
							/>
							<TextControl
								label={__('Map Width[px or %]', 'geo-maps')}
								value={attributes.width}
								onChange={(map_width) => afterWidthChange(map_width)}
							/>
						</PanelBody>
					</Panel>
				</div>
			</InspectorControls>
		</div>
	);
}

registerBlockType('geo-maps/map', {
	apiVersion: 2,
	title: __('Geo Maps', 'geo-maps'),
	description: __('This block is used to show map', 'geo-maps'),
	icon: Icon,
	keywords: [__("map"), __("google map"), __("openstreet map")],
	edit: Edit,
});
