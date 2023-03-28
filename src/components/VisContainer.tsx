import React, { useEffect, useState } from "react";
import { PeptideStackVis } from "../classes/PeptideStackViz";
import { Protein, Peptide } from "../common/types";
import jsPDF from "jspdf";
import { Canvg } from "canvg";
import { RenderingContext2D } from "canvg/dist/types";

interface Datasets {
	proteins: Array<Protein>;
	peptides: Array<Peptide>;
}

export default function VisContainer(props: Datasets) {
	let proteinList = props.proteins.map((p) => p.Entry) as string[];
	const [proteinEntry, setProteinEntry] = useState<string>("");
	const [sigPepLength, setSigPepLength] = useState<number>(15);
	const [maxAxisLength, setMaxAxisLength] = useState<number>(0);
	let v = new PeptideStackVis(
		props.proteins,
		props.peptides,
		"#vis-container",
		sigPepLength,
		maxAxisLength
	);

	useEffect(() => {
		if (
			props.peptides.length &&
			props.proteins.length &&
			proteinEntry !== ""
		) {
			v.clearVis();
			v.renderSplitAxes(proteinEntry);
			v.renderPeptideLines(proteinEntry);
		}
	});

	const handleProteinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setProteinEntry(e.currentTarget.value);
	};

	const handleSigPepLengthChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSigPepLength(parseInt(e.currentTarget.value));
	};

	const handleMaxAxisLengthChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setMaxAxisLength(parseInt(e.currentTarget.value));
	};

	function download(href: string, name: string) {
		var a = document.createElement("a");

		a.download = name;
		a.href = href;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	const saveAsPdf = () => {
		// // var svg = document.querySelector("#vis-container")!.outerHTML;
		// var svgString = new XMLSerializer().serializeToString(
		// 	document.querySelector("#vis-container")!
		// );
		// var canvas = document.createElement("canvas")!;
		// var ctx = canvas.getContext("2d")!;
		// // eslint-disable-next-line no-restricted-globals
		// var DOMURL = self.URL || self.webkitURL || self;
		// var img = new Image();
		// var svg = new Blob([svgString], {
		// 	type: "image/svg+xml;charset=utf-8",
		// });
		// var url = DOMURL.createObjectURL(svg);
		// img.onload = function () {
		// 	ctx.drawImage(img, 0, 0);
		// 	var png = canvas.toDataURL("image/png");
		// 	document.querySelector("#png-container")!.innerHTML =
		// 		'<img src="' + png + '"/>';
		// 	DOMURL.revokeObjectURL(png);
		// };
		// img.src = url;

		var svg = document.querySelector("#vis-container")!;

		var vancas2 : HTMLCanvasElement = document.querySelector('#canvas')!;

		// get svg data
		var xml = new XMLSerializer().serializeToString(svg);

		// make it base64
		var svg64 = btoa(xml);
		var b64Start = 'data:image/svg+xml;base64,';

		// prepend a "header"
		var image64 = b64Start + svg64;

		// set it as the source of the img element
		var img = new Image();
		img.onload = function() {
			// draw the image onto the canvas
			vancas2.getContext('2d')!.drawImage(img, 0, 0);
		}
		img.src = image64;
		document.body.appendChild(img);
		//you can download svg file by right click menu.
	};

	return (
		<div>
			<div id="vis-controls">
				{proteinEntry !== "" ? (
					<div id="active-controls">
						<div>
							<label htmlFor="signal_pep_length">
								Length of signal peptide{" "}
							</label>
							<input
								name="signal_pep_length"
								min="0"
								type="number"
								width={10}
								value={sigPepLength}
								onChange={handleSigPepLengthChange}
							></input>
						</div>
						<div>
							<label htmlFor="max_axis_length">
								Maximum axis length{" "}
							</label>
							<input
								name="signal_pep_length"
								min="0"
								type="number"
								width={10}
								value={maxAxisLength}
								onChange={handleMaxAxisLengthChange}
							></input>
						</div>
						<div>
							<button onClick={saveAsPdf}>Save as PDF</button>
						</div>
					</div>
				) : (
					""
				)}
				{proteinList.length > 0 ? (
					<div id="static-controls">
						<label htmlFor="protein_selector">
							Choose a protein{" "}
						</label>
						<select
							name="protein_selector"
							value={proteinEntry}
							onChange={handleProteinChange}
						>
							{proteinList.map((p, i) => {
								return (
									<option key={i} value={p}>
										{p}
									</option>
								);
							})}
							;
						</select>
					</div>
				) : (
					""
				)}
			</div>
			{proteinEntry !== "" ? (
				<div>
					<div id="protein-header">
						<h2>Protein: {proteinEntry}</h2>
					</div>
					<div id="legend-container">
						<h4>Bioactive Function</h4>
						<div id="legend"></div>
					</div>
				</div>
			) : (
				""
			)}

			<svg id="vis-container"></svg>
			<div id="png-container"></div>
		</div>
	);
}
