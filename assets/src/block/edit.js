const {Component} = wp.element;
const {Spinner} = wp.components;
import React, {useState, useEffect} from "react";

const BlockEdit = ({attributes}) => {
	const [isLoading, setIsLoading] = useState(true);
	const [message, setMessage] = useState('');
	const [template, setTemplate] = useState('');

	const {
		map_id
	} = attributes;
	const runApiFetch = (map_id) => {
		setIsLoading(true);
		setMessage('');
		wp.apiFetch({
			path: 'geo-maps/v1/maps/' + map_id,
		}).then(data => {

			if (typeof data.template !== "undefined") {

				setIsLoading(false);
				setTemplate(data.template);

			} else if (typeof data.message !== "undefined") {
				setMessage(data.message);
			} else {

				setMessage('Something went wrong, please contact at wpmatrixaddons@gmail.com');
			}

		}).catch((error) => {
			setMessage('Something went wrong, please contact at wpmatrixaddons@gmail.com');
		});
	}
	useEffect(() => {
		runApiFetch(map_id);
	}, [map_id]);

	useEffect(() => {

		window.geo_maps_ready_call()
	}, [template]);


	if (message !== '') {
		return (<div style={{
			height: "500px",
			width: "100%",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			background: "#f9f9f9",
			border: "1px solid #ddd",
			textAlign: 'center',
			fontSize: '15px'
		}}>
			<h2>{message}</h2>

		</div>)
	} else if (isLoading) {
		return (<div style={{
			height: "500px",
			width: "100%",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			background: "#f9f9f9",
			border: "1px solid #ddd"
		}}>
			<Spinner/>
		</div>)
	} else if (template) {
		return (<>
			<div className="geo-maps-block-wrap" dangerouslySetInnerHTML={{__html: template}}>
			</div>
		</>)
	} else {
		return (<div style={{
			height: "500px",
			width: "100%",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			background: "#f9f9f9",
			border: "1px solid #ddd",
			textAlign: 'center',
			fontSize: '15px'
		}}>
			<h2>{message}</h2>
		</div>)
	}
}

export default BlockEdit;
