import { ChangeEvent, useState } from "react";

interface UploadHandler {
	onUpload: (data: File | undefined) => void;
	fileExtension: string;
}

function FileUploadSingle(props: UploadHandler) {
	const [file, setFile] = useState<File>();

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFile(e.target.files[0]);
            props.onUpload(e.target.files[0]);
		}
	};

	return (
		<div>
			<input type="file" accept={props.fileExtension} onChange={handleFileChange} />

			<div>{file && `${file.name} - ${file.type}`}</div>
		</div>
	);
}

export default FileUploadSingle;
