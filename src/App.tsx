import React from "react";
import "./App.css";
import VisContainer from "./components/VisContainer";
import proteins from "./data/proteins.json";
import peptides from "./data/peptides.json";

function App() {
		return (<div className="App">
			<VisContainer
				proteins={proteins}
				peptides={peptides}
			></VisContainer>
		</div>);
}

export default App;
