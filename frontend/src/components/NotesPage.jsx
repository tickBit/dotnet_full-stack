import axios from 'axios';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dialog from './Dialog';

const NotesPage = () => {

    const [notes, setNotes] = React.useState([]);
    const [showConfirmDelete, setShowConfirmDelete] = React.useState({ok: false, id: undefined});
    const [editMode, setEditMode] = React.useState(false);
    
    const { token } = useAuth();

    const deleteNote = async(id) => {
        
        setShowConfirmDelete(false);
        
        const resp = await axios.delete(`http://localhost:5079/api/info/${id}`, {
            headers: {
            Authorization: `Bearer ${token}`
        }
        });
        
        if (resp.status === 200) setNotes(notes.filter((n) => (n.id !== id)));
        console.log(resp);
    }
    
    const getNote = async(e) => {
        e.preventDefault();
        
        const note = document.getElementById("new-note").value;
        
        const resp = await axios.post("http://localhost:5079/api/info", {note: note}, {
            headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }  
        );
        
        if (resp.status === 200) setNotes(prevNotes => [...prevNotes, resp.data]);
        
    }
    // fetch new notes, when there is any
    useEffect(() => {
        
        axios.get(`http://localhost:5079/api/info`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                }).then((response) => {
                    console.log(response);
            
                    if (response.data) {
                        setNotes(response.data)
                    } else {
                        setNotes([]);
                    }
                    
                }).catch((error) => {
                    console.log(error);
                })

    }, [token, setNotes]);
    
    
    return (
        <>
            {showConfirmDelete.ok === true ? <Dialog title="Are you sure?" ok="Yes" no="Cancel" onCancel={() => setShowConfirmDelete({ok: false, id: undefined})} onConfirm={() => deleteNote(showConfirmDelete.id)} color="lightred" /> : null}
            <div id='notes'>
            <h2>Notes:</h2>
            <div>
                <form onSubmit={(e) => getNote(e)}>
                    <label htmlFor="new-note">Add new note: </label>
                    <input type="text" name="new-note" id="new-note" className='new-note' />
                    <button type="submit" className='buttons' style={{ backgroundColor: "red"}}>Save</button>
                </form>
            </div>
            <br />
            
                {notes.length === 0 ? <p>No notes yet.</p> : <> {
                    notes.map((n,i) => (
                    <div id={"a"+i} key={i}>
                    {n.note}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z" onClick={() => setEditMode(!editMode)} /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5" onClick={() => setShowConfirmDelete({ok: true, id: n.id})} /></svg>
                    </div>
                ))}
             </>
            }
            </div>
        </>
    );
}

export default NotesPage;
