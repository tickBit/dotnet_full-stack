import axios from 'axios';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dialog from './Dialog';

const NotesPage = () => {
    
    const [notes, setNotes] = React.useState([]);
    const [showConfirmDelete, setShowConfirmDelete] = React.useState({ok: false, id: undefined});
    const [showError, setShowError] = React.useState(false);
    const [editLine, setEditLine] = React.useState(undefined);
    const [editedText, setEditedText] = React.useState("");
    const [editMode, setEditMode] = React.useState(false);
    const [originalTxt, setOriginalTxt] = React.useState("");
    
    const { token } = useAuth();
    
    const handleSetLine = (id, text) => {
        
        setOriginalTxt(text);
                
        setEditLine(id);
        setEditMode(!editMode);
        
        setEditedText(originalTxt);
        
        if (editMode === false) {
            setEditLine(undefined);
        }
    }
    
    const editChange = (e) => {
        
        console.log(e);
        
        const  value = e.target.value;
        setEditedText(value);

    };
    
    const handleUpdate = async(e, id) => {
        
        if (e.code === "Enter") {
        
            try {
                const resp = await axios.put(`http://localhost:5079/api/info/${id}`,
                    { note: editedText },   // dto
                    {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }});
                
                setEditMode(false);
                setEditLine(undefined);
                
                setNotes(notes.map((n) => (n.id === id) ? resp.data : n));
                
                
            } catch(error) {
                showError(true);
            }
        }
    }
    
    const deleteNote = async(id) => {
        
        setShowConfirmDelete(false);
        
        try {
            const resp = await axios.delete(`http://localhost:5079/api/info/${id}`, {
                headers: {
                Authorization: `Bearer ${token}`
            }
            });
                        
            if (resp.status === 200) setNotes(notes.filter((n) => (n.id !== id)));
                                     else setShowError(true);
        } catch (error) {
            setShowError(true);
        }
    }
    
    // saves note from UI to the backend
    const getNote = async(e) => {
        e.preventDefault();
        
        const note = document.getElementById("new-note").value;
        
        try {
            const resp = await axios.post("http://localhost:5079/api/info", {note: note}, {
                headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }  
            );
            
            if (resp.status === 200) setNotes(prevNotes => [resp.data, ...prevNotes]);
                                    else setShowError(true);
        } catch(error) {
            setShowError(true);
        }
        
    }
    // fetch new notes, when there is any
    useEffect(() => {
        
        const fetchNotes = async () => {
            
            await axios.get(`http://localhost:5079/api/info`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                }).then((response) => {
                    
                    try {
                        setNotes(response.data.reverse());
                    } catch {
                        setNotes([]);
                    }
                    
                }).catch((error) => {
                    console.log(error);
                    setShowError(true);
                })
            }
        
        fetchNotes();
        
    }, [token, setNotes]);
    
    
    return (
        <>
            {showError === true ? <Dialog title="Something went wrong.." ok="Ok" onConfirm={() => setShowError(false)} color="lightred" /> : null}
            {showConfirmDelete.ok === true ? <Dialog title="Are you sure?" ok="Yes" no="Cancel" onCancel={() => setShowConfirmDelete({ok: false, id: undefined})} onConfirm={() => deleteNote(showConfirmDelete.id)} color="lightred" /> : null}
            <div className='page'>
            <div style={{ textAlign: "center" }}>
                <h2>Notes:</h2>
                <form onSubmit={(e) => getNote(e)}>
                    <label htmlFor="new-note">Add new note: </label>
                    <input type="text" name="new-note" id="new-note" className='new-note-class' />
                    <button type="submit" className='buttons' style={{ backgroundColor: "red"}}>Save</button>
                </form>
            </div>
            <br />
            <div style={{ textAlign: "center"}}>
                {notes.length === 0 ? <p>No notes yet.</p> : <> {
                    notes.map((n,i) => (
                    <div id={"a"+i} key={i}>
                    {editLine === i ? <> <input type="text" value={editedText} onKeyUp={(e) => handleUpdate(e, n.id)} onChange={(e) => editChange(e)} className='edit-text' id="edit-text" /> </> : <> {n.note} </> }
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z" onClick={() => handleSetLine(i, n.note)} className='edit' /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5" onClick={() => setShowConfirmDelete({ok: true, id: n.id})} className='delete' /></svg>
                    </div>
                ))}
             </>
            }
            </div>
            </div>
        </>
    );
}

export default NotesPage;
