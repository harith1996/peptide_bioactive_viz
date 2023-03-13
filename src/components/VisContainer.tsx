import React, { useEffect, useState } from "react";
import { PeptideStackVis } from "../classes/PeptideStackViz";
import { Protein, Peptide } from "../common/types";

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

	return (
		<div>
			<div id="vis-controls">
				{proteinEntry !== "" ? (
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
				) : (
					""
				)}
				{proteinEntry !== "" ? (
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
				) : (
					""
				)}
				{proteinList.length > 0 ? (
					<div>
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
		</div>
	);
}
