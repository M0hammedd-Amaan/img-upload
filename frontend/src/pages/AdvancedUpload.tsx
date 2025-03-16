import React, { useState, ChangeEvent, DragEvent } from 'react';
import axios from 'axios';

interface Props {
    selectedFolder: string | null;
    onUploadSuccess: () => void;
}

const AdvancedUpload: React.FC<Props> = ({ selectedFolder, onUploadSuccess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const token = localStorage.getItem('token');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleUpload = async () => {
        if (!files.length) {
            alert('Please select files first!');
            return;
        }

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        if (selectedFolder) {
            formData.append('folder_id', selectedFolder);
        }

        try {
            await axios.post('http://localhost:5000/upload-multiple', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('✅ Upload successful!');
            setFiles([]);
            onUploadSuccess();
        } catch (error) {
            alert('❌ Upload failed!');
            console.error(error);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== index));
    };

    return (
        <div style={modalStyle}>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={dropZoneStyle}
            >
                <p>Drag & Drop files here</p>
                <input type="file" multiple onChange={handleFileChange} />
            </div>

            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        {file.name}
                        <button onClick={() => removeFile(index)} style={removeButtonStyle}>❌</button>
                    </li>
                ))}
            </ul>

            <button onClick={handleUpload} style={uploadButtonStyle}>
                Upload Files
            </button>
        </div>
    );
};

// ✅ Styles
const dropZoneStyle: React.CSSProperties = {
    border: '2px dashed #ccc',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center',
    marginBottom: '10px',
};

const uploadButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
};

const removeButtonStyle: React.CSSProperties = {
    marginLeft: '10px',
    backgroundColor: '#ff4d4f',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
};

const modalStyle: React.CSSProperties = {
    backgroundColor: '#333',
    color: '#fff',
    padding: '20px',
    borderRadius: '10px',
};

export default AdvancedUpload;
