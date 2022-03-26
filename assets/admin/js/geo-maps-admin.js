// @var geoMapsAdminParams
(function ($) {
	var GeoMapsAdmin = {

		init: function () {
			this.settings = (geoMapsAdminParams.options.settings);
			this.bindEvents();
			this.renderPreviewMap();
		},
		bindEvents: function () {
			var _that = this;
			$('body').on('change', '#geo_maps_map_type', function () {
				_that.settings.map_type = _that.getMapType();
				_that.renderPreviewMap();
			})
			$('body').on('click', '.matrixaddons-repeater-add', function (e) {
				e.preventDefault();
				var parent = $(this).closest('.matrixaddons-field-group');
				var id = parent.attr('id');
				var totalLength = parent.find('.matrixaddons-repeater-wrapper').find('.matrixaddons-repeater-item').length
				var item_id = ((totalLength + 1) - 1);
				var replace_to = '___' + id + '[0]';
				var replace_with = id + '[' + item_id + ']';
				var tmpl = parent.find('.matrixaddons-repeater-item.matrixaddons-repeater-hidden').html();
				var replacedTemplate = _that._replaceAll(tmpl, replace_to, replace_with);
				var newTemplate = $('<div class="matrixaddons-repeater-item" data-item-id="' + item_id + '">').append(replacedTemplate);
				parent.find('.matrixaddons-repeater-wrapper').append(newTemplate);
				_that.loadMapItem(item_id);
			})
			$('body').on('click', '.matrixaddons-repeater-title', function (e) {
				if (!$(e.target).hasClass('matrixaddons-repeater-remove')) {
					var el = $(this).closest('.matrixaddons-repeater-item').find('.matrixaddons-repeater-content');
					if (el.hasClass('matrixaddons-hide')) {
						$(this).closest('.matrixaddons-repeater-item').find('.matrixaddons-repeater-header-icon').removeClass('dashicons dashicons-arrow-up-alt2').addClass('dashicons dashicons-arrow-down-alt2');

						el.removeClass('matrixaddons-hide');
						var marker_index = $(this).closest('.matrixaddons-repeater-item').attr('data-item-id');
						_that.loadMapItem(marker_index);
					} else {
						$(this).closest('.matrixaddons-repeater-item').find('.matrixaddons-repeater-header-icon').removeClass('dashicons dashicons-arrow-down-alt2').addClass('dashicons dashicons-arrow-up-alt2');

						el.addClass('matrixaddons-hide');

					}
				}
			})
			$('body').on('keyup', 'input.geo-maps-marker-title', function () {
				var val = $(this).val();
				$(this).closest('.matrixaddons-repeater-item').find('.matrixaddons-repeater-text').text(val);
			});
			$('body').on('click', '.matrixaddons-repeater-remove', function () {
				var min_item = parseInt($(this).attr('data-min-item'));
				var min_item_message = $(this).attr('data-min-item-message');
				var item_length = $(this).closest('.matrixaddons-repeater-wrapper').find('.matrixaddons-repeater-item').length;
				if (item_length <= min_item) {
					alert(min_item_message);
					return;
				}
				var confirm = $(this).attr('data-confirm');
				if (window.confirm((confirm))) {
					var wrap = $(this).closest('.matrixaddons-repeater-wrapper');
					$(this).closest('.matrixaddons-repeater-item').remove();
					_that.reindexRepeaterItems(wrap);
					_that.reCalculateMarkerContent();
				}
			});

			$('body').on('click', '.geo-maps-location-search-button', function (e) {
				e.preventDefault();
				_that.mapLocationHtml($(this));
			});

			var locationKeyUpTimer = null;
			$('body').on('keyup', '.geo-maps-marker-location', function (e) {
				var keyUp = $(this);
				clearTimeout(locationKeyUpTimer);
				locationKeyUpTimer = setTimeout(function () {
					_that.mapLocationHtml(keyUp);
				}, 1000);
			});

			$('body').on('click', '.geo-maps-location-list-item', function () {
				var lat = $(this).attr('data-lat');
				var lng = $(this).attr('data-lng');
				var title = $(this).text();
				var wrap = $(this).closest('.matrixaddons-repeater-item');

				$(this).closest('ul').remove();

				wrap.find('input.geo-maps-marker-title').val(title).trigger('change');
				wrap.find('input.geo-maps-marker-location').val(title);
				wrap.find('input.geo-maps-marker-latitude').val(lat).trigger('change');
				wrap.find('input.geo-maps-marker-longitude').val(lng).trigger('change');
				wrap.find('.geo-maps-marker-content').val(lng).trigger('change');

			});
			$('body').on('change', '.geo-maps-marker-latitude, .geo-maps-marker-longitude, .geo-maps-marker-title, .geo-maps-marker-content', function () {
				var item_id = $(this).closest('.matrixaddons-repeater-item').attr('data-item-id');
				_that.loadMapItem(item_id, true);
			})

			$('body').on('input', '.geo-maps-marker-latitude', function () {
				_that.validateLatLong($(this));
			});
			$('body').on('input', '.geo-maps-marker-longitude', function () {
				_that.validateLatLong($(this));
			});
		},
		validateLatLong: function (el) {
			var validNumber = new RegExp(/^\d*\.?\d*$/);
			if (!validNumber.test($(el).val())) {
				$(el).val(0);
			}

		},
		getMapType: function () {

			var map_type = $('#geo_maps_map_type option:selected').val();

			if (map_type == '' || map_type == null) {
				return 'google_map';
			}
			return map_type;

		},
		reindexRepeaterItems: function (wrap) {
			var _that = this;
			var items = $(wrap).find('.matrixaddons-repeater-item');
			var index_id = 0;
			$.each(items, function () {

				var old_index = $(this).attr('data-item-id');


				if (old_index != index_id) {

					var elements = $(this).find('[name*="[' + old_index + ']"], [id*="[' + old_index + ']"]');


					$.each(elements, function () {
						var element = $(this);

						if ($(this).attr("name")) {
							var name = element.attr('name');
							var new_name = _that._replaceAll(name, old_index, index_id);
							$(this).attr('name', new_name);
						}
						if ($(this).attr("id")) {
							var id = element.attr('id');
							var new_id = _that._replaceAll(id, old_index, index_id);
							$(this).attr('id', new_id);
						}
					})

				}
				$(this).attr('data-item-id', index_id);
				index_id++;
			});
		},
		mapLocationHtml: function (el) {

			var fieldset = $(el).closest('.matrixaddons-fieldset');
			var value = fieldset.find(".geo-maps-marker-location").val();
			if (value === '') {
				fieldset.find('.geo-maps-location-lists').remove();
				return;
			}
			this.callLocationAPI(value, fieldset);


		},
		callLocationAPI: function (value, fieldset) {
			var location_search_url = 'https://nominatim.openstreetmap.org/search?q=' + value + '&format=json';

			fetch(location_search_url).then(function (response) {
				return response.json();
			}).then(function (response_data) {
				if (response_data.length > 0) {
					var el = $('<ul class="geo-maps-location-lists wp-map-block-modal-place-search__results"/>');

					response_data.forEach(function (item, index) {
						var title = item.display_name;
						var lat = item.lat;
						var lng = item.lon;
						var li = $('<li class="geo-maps-location-list-item" data-lng="' + lng + '" data-lat="' + lat + '"/>');
						li.text(title);
						el.append(li);
					});
					fieldset.find('.geo-maps-location-lists').remove();
					fieldset.append(el);
				}
			});
		},
		_replaceAll: function (str, toReplace, replaceWith) {
			return str ? str.split(toReplace).join(replaceWith) : '';
		},
		renderPreviewMap: function () {
			var _that = this;
			_that.settings.map_type = _that.getMapType();
			$(".geo_maps_map_render_element").each((index, element) => {
				const Element = jQuery(element);
				window.Geo_Maps_Render(
					Element.attr("ID"),
					_that.settings,
				);
			});
		},
		loadMapItem: function (marker_index, force_remap = false) {

			var _that = this;

			var item = $('.matrixaddons-repeater-item[data-item-id="' + marker_index + '"]');
			if (item.length < 1) {
				return;
			}
			var element = item.find('.geo_maps_marker_item_position ');

			if ($(element).hasClass('geo-map-added') && !force_remap) {
				return;
			}
			const Element = jQuery(element).closest('.geo-maps-marker-content-wrap');
			$(element).addClass('geo-map-added');
			let mapSetting = Object.assign({}, _that.settings);
			var default_lat = geoMapsAdminParams.default_marker.lat;
			var default_lng = geoMapsAdminParams.default_marker.lng;
			if (item.find('.geo-maps-marker-latitude').val() !== "" && item.find('.geo-maps-marker-longitude').val() !== "") {
				default_lat = item.find('.geo-maps-marker-latitude').val();
				default_lng = item.find('.geo-maps-marker-longitude').val();
			}

			var title = item.find('.geo-maps-marker-title').val()
			var content = item.find('.geo-maps-marker-content').val();
			mapSetting.scroll_wheel_zoom = true;
			mapSetting.map_marker = [{
				title: title,
				content: content,
				draggable: 'true',
				lat: default_lat,
				lng: default_lng,
				dragendCallback: function (event) {
					_that.markerDragendCallback(event);
				}
			}];
			mapSetting.center_index = 0;
			mapSetting.map_type = _that.getMapType();
			window.Geo_Maps_Render(
				Element.attr("ID"),
				mapSetting,
			);


			_that.reCalculateMarkerContent();


		},
		reCalculateMarkerContent: function () {
			var _that = this;
			var items = $('#geo_maps_markers').find('.matrixaddons-repeater-wrapper').find('.matrixaddons-repeater-item');
			var mapMarkers = [];
			if (items.length > 0) {
				$.each(items, function () {
					var item = $(this);
					var markerIndex = item.attr('data-item-id');
					var title = item.find('input.geo-maps-marker-title').val();
					var latitude = item.find('input.geo-maps-marker-latitude').val();
					var longitude = item.find('input.geo-maps-marker-longitude').val();
					var content = item.find('.geo-maps-marker-content').val();
					mapMarkers[markerIndex] = {
						lat: latitude,
						lng: longitude,
						title: title,
						content: content
					};

				});
			}
			_that.settings.map_marker = mapMarkers;

			_that.renderPreviewMap();
		},
		markerDragendCallback: function (event) {
			var marker = event.target;
			var position = marker.getLatLng();
			var wrap = $(event.target.getElement()).closest('.matrixaddons-fieldset-content');
			wrap.find('.geo-maps-marker-latitude').val(position.lat).trigger('change');
			wrap.find('.geo-maps-marker-longitude').val(position.lng).trigger('change');

		}


	};

	$(document).ready(function () {
		GeoMapsAdmin.init();
	});
}(jQuery));
