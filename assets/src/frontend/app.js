/**
 * MatrixMap app chunk: map features shared by every engine.
 */
import './app.scss';
import registry from './registry';
import MapView from './core/MapView';
import * as geo from './core/geo';
import * as hours from './core/hours';
import { popupContent, statusBadge } from './core/popup';
import { h, sprintf } from './core/dom';

const mm = registry();

mm.MapView = MapView;
mm.util = { geo, hours, popupContent, statusBadge, h, sprintf };

mm.mounters.markers = ( el, payload, settings ) => new MapView( el, payload, settings ).init();
