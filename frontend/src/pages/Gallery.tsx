import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FaFolder,
    FaUpload,
    FaTrash,
    FaSignOutAlt,
    FaPlusCircle,
    FaCopy,
    FaCut,
    FaClipboard,
    FaHome
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import AdvancedUpload from './AdvancedUpload';
import './Gallery.css';

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
}

interface Image {
    id: string;
    filename: string;
    url: string;
    upload_date: string;
    folder_id: number | null;
}

interface Props {
    onLogout: () => void;
}

const Gallery: React.FC<Props> = ({ onLogout }) => {
    const [images, setImages] = useState<Image[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<Folder[]>([]);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'image' | 'folder'; name: string } | null>(null);
    const [copyOrCutItem, setCopyOrCutItem] = useState<{ id: string; type: 'image' | 'folder' } | null>(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) fetchData();
    }, [selectedFolder]);

    const fetchData = async () => {
        await Promise.all([fetchFolders(), fetchImages()]);
        updateFolderPath();
    };

    const updateFolderPath = () => {
        if (!selectedFolder) {
            setFolderPath([]);
            return;
        }

        const path: Folder[] = [];
        let currentId: string | null = selectedFolder;

        while (currentId) {
            const folder = folders.find(f => f.id === currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parent_id;
            } else {
                currentId = null;
            }
        }
        setFolderPath(path);
    };

    const fetchFolders = async () => {
        try {
            let url = 'http://15.206.73.143:5000/folders';
            if (selectedFolder) url += `?folder_id=${selectedFolder}`;

            const res = await axios.get<Folder[]>(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFolders(res.data);
        } catch (err) {
            console.error('Error fetching folders:', err);
        }
    };

    const fetchImages = async () => {
        try {
            let url = 'http://15.206.73.143:5000/images';
            url += selectedFolder ? `?folder_id=${selectedFolder}` : '?folder_id=null';

            const res = await axios.get<Image[]>(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setImages(res.data);
        } catch (err) {
            console.error('Error fetching images:', err);
        }
    };

    const createFolder = async () => {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        try {
            await axios.post(
                'http://15.206.73.143:5000/folders',
                { name: folderName, parent_id: selectedFolder },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchFolders();
        } catch (err) {
            console.error('Error creating folder:', err);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        if (!window.confirm(`Delete "${selectedItem.name}"?`)) return;

        try {
            const endpoint = selectedItem.type === 'image' ? 'images' : 'folders';
            await axios.delete(`http://15.206.73.143:5000/${endpoint}/${selectedItem.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchFolders();
            fetchImages();
            setSelectedItem(null);
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleCopy = () => {
        if (!selectedItem) return;
        setCopyOrCutItem(selectedItem);
    };

    const handleCut = () => {
        if (!selectedItem) return;
        setCopyOrCutItem(selectedItem);
    };

    const handlePaste = async () => {
        if (!copyOrCutItem) return;

        try {
            const url =
                copyOrCutItem.type === 'image'
                    ? `http://15.206.73.143:5000/images/${copyOrCutItem.id}/move`
                    : `http://15.206.73.143:5000/folders/${copyOrCutItem.id}/move`;

            await axios.put(
                url,
                { parent_id: selectedFolder },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchFolders();
            fetchImages();
            setCopyOrCutItem(null);
        } catch (err) {
            console.error('Error pasting:', err);
        }
    };

    const logoutHandler = () => {
        localStorage.removeItem('token');
        onLogout();
    };

    const floatingButtonStyle: React.CSSProperties = {
        position: 'fixed',
        right: '20px',
        borderRadius: '50%',
        padding: '15px',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        zIndex: 1000
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#1e1e1e', color: '#fff', minHeight: '100vh' }}>
            <div style={{ position: 'fixed', top: 20, right: 20 }}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    style={{ ...floatingButtonStyle, backgroundColor: '#dc3545' }}
                    onClick={logoutHandler}
                >
                    <FaSignOutAlt /> Logout
                </motion.button>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <FaHome
                    style={{ cursor: 'pointer', marginRight: '10px' }}
                    onClick={() => setSelectedFolder(null)}
                />
                {folderPath.map((folder, index) => (
                    <span
                        key={folder.id}
                        style={{ cursor: 'pointer', marginRight: '8px' }}
                        onClick={() => setSelectedFolder(folder.id)}
                    >
                        {folder.name}{index !== folderPath.length - 1 ? ' / ' : ''}
                    </span>
                ))}
            </div>

            <h2>{selectedFolder ? `Folder: ${folderPath.map(f => f.name).join(' / ')}` : 'Dashboard'}</h2>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '15px',
                    marginTop: '20px'
                }}
            >
                {folders.map(folder => (
                    <motion.div
                        key={folder.id}
                        whileHover={{ scale: 1.05 }}
                        onDoubleClick={() => setSelectedFolder(folder.id)}
                        onClick={() => setSelectedItem({ id: folder.id, type: 'folder', name: folder.name })}
                        className={`gallery-card ${selectedItem?.id === folder.id ? 'selected' : ''}`}
                        style={{
                            width: '120px',
                            textAlign: 'center',
                            padding: '10px',
                            backgroundColor: '#292929',
                            borderRadius: '8px',
                            border: selectedItem?.id === folder.id ? '2px solid #007bff' : '1px solid #444',
                            cursor: 'pointer'
                        }}
                    >
                        <FaFolder size={50} color="#f4c542" />
                        <p style={{ color: '#fff', marginTop: '10px' }}>{folder.name}</p>
                    </motion.div>
                ))}

                {images.map(img => (
                    <motion.div
                        key={img.id}
                        whileHover={{ scale: 1.05 }}
                        onDoubleClick={() => setEnlargedImage(img.url)}
                        onClick={() => setSelectedItem({ id: img.id, type: 'image', name: img.filename })}
                        className={`gallery-card ${selectedItem?.id === img.id ? 'selected' : ''}`}
                        style={{
                            width: '120px',
                            textAlign: 'center',
                            padding: '10px',
                            backgroundColor: '#292929',
                            borderRadius: '8px',
                            border: selectedItem?.id === img.id ? '2px solid #007bff' : '1px solid #444',
                            cursor: 'pointer'
                        }}
                    >
                        <img
                            src={img.url}
                            alt={img.filename}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <p style={{ color: '#fff', marginTop: '10px' }}>{img.filename}</p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.button
                whileHover={{ scale: 1.1 }}
                style={{ ...floatingButtonStyle, bottom: '80px', backgroundColor: 'green' }}
                onClick={() => setShowUpload(!showUpload)}
                title="Upload Files"
            >
                <FaUpload />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1 }}
                style={{
                    ...floatingButtonStyle,
                    bottom: '150px',
                    backgroundColor: 'red',
                    opacity: selectedItem ? 1 : 0.5
                }}
                onClick={handleDelete}
                disabled={!selectedItem}
                title="Delete Item"
            >
                <FaTrash />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1 }}
                style={{ ...floatingButtonStyle, bottom: '220px', backgroundColor: 'blue' }}
                onClick={createFolder}
                title="Create Folder"
            >
                <FaPlusCircle />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1 }}
                style={{ ...floatingButtonStyle, bottom: '290px', backgroundColor: 'orange' }}
                onClick={handleCopy}
                title="Copy"
            >
                <FaCopy />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1 }}
                style={{ ...floatingButtonStyle, bottom: '360px', backgroundColor: 'purple' }}
                onClick={handleCut}
                title="Cut"
            >
                <FaCut />
            </motion.button>

            <motion.button
                whileHover={{ scale: copyOrCutItem ? 1.1 : 1 }}
                style={{
                    ...floatingButtonStyle,
                    bottom: '430px',
                    backgroundColor: copyOrCutItem ? 'teal' : 'gray',
                    cursor: copyOrCutItem ? 'pointer' : 'not-allowed'
                }}
                onClick={handlePaste}
                disabled={!copyOrCutItem}
                title="Paste"
            >
                <FaClipboard />
            </motion.button>

            {showUpload && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        bottom: '120px',
                        right: '100px',
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '20px',
                        borderRadius: '10px'
                    }}
                >
                    <AdvancedUpload
                        selectedFolder={selectedFolder}
                        onUploadSuccess={() => {
                            fetchImages();
                            setShowUpload(false);
                        }}
                    />
                </motion.div>
            )}

            {enlargedImage && (
                <div
                    onClick={() => setEnlargedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                >
                    <img src={enlargedImage} alt="enlarged" style={{ maxWidth: '90%', maxHeight: '90%' }} />
                </div>
            )}
        </div>
    );
};

export default Gallery;
