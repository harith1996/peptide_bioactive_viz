import React, { useState } from "react";
import "./App.css";
import VisContainer from "./components/VisContainer";
import FileUploadSingle from "./components/FileUploadSingle";
import { parse } from "papaparse";
import { Peptide, Protein } from "./common/types";

function App() {
	
	const [proteins, setProteins] = useState<Protein[]>([]);
	const [peptides, setPeptides] = useState<Peptide[]>([]);
	const handleProteinData = (data: File | undefined) => {
		data!.text().then(data => {
			setProteins(parse(data, {header:true}).data as Protein[]);
		});
	};
	const handlePeptideData = (data: File | undefined) => {
		data!.text().then(data => {
			let pep = parse(data, {header:true}).data;
			let newPeptides = pep.map((p) => {
				const newP = JSON.parse(JSON.stringify(p));
				newP["seqIndex"] = [-1, -1];
				return newP;
			});
			setPeptides(newPeptides as Peptide[]);
		});
	};
	return (
		<div className="App">
			<div className="loader">
			<div>Upload Protein Sequences (.csv)
				<FileUploadSingle fileExtension=".csv"
					onUpload={handleProteinData}
				></FileUploadSingle>
			</div>
			<div>Upload Peptide dataset (.csv)
				<FileUploadSingle fileExtension=".csv"
					onUpload={handlePeptideData}
				></FileUploadSingle>
			</div>
			</div>
			
			<VisContainer
				proteins={proteins!}
				peptides={peptides!}
			></VisContainer>
		</div>
	);
}

export default App;
