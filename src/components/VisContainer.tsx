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
	let v = new PeptideStackVis(
		props.proteins,
		props.peptides,
		"#viscontainer"
	);

	useEffect(() => {
		v.clearVis();
		v.renderSplitAxes(proteinEntry);
		v.renderPeptideLines(proteinEntry);
	});

	const handleProteinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setProteinEntry(e.currentTarget.value);
	};

	return (
		<div>
			<div>
				<label htmlFor="protein_selector">Choose a protein </label>
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

			<div id="legend"></div>
			<svg id="viscontainer"></svg>
		</div>
	);
}
