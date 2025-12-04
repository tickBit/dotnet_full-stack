import axios from 'axios';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';


const NotesPage = () => {

    const [notes, setNotes] = React.useState([]);
    const { token } = useAuth();

    const getNote = async(e) => {
        e.preventDefault();
        
        const note = document.getElementById("new-note").value;
        
        await axios.post("http://localhost:5079/api/info", {note: note}, {
            headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }  
        );
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
                notes.map((n) => (
                    <div key={n.id}>{n.note}
                    </div>
                ))}
             </>
            }
        </>
    );
}

export default NotesPage;
