import React from "react";
import "./App.css";
import VisContainer from "./components/VisContainer";
import proteins from "./data/proteins.json";
import peptides from "./data/peptides.json";

function App() {
	let newPeptides = peptides.map((p) => {
		const newP = JSON.parse(JSON.stringify(p));
		newP["seqIndex"] = [-1,-1];
		return newP;
	});
	return (
		<div className="App">
			<VisContainer
				proteins={proteins}
				peptides={newPeptides}
			></VisContainer>
		</div>
	);
}

export default App;
