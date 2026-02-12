import axios from 'axios';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dialog from './Dialog';

const NotesPage = () => {
    
    const [totalCount, setTotalCount] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(4);
    const [currentNotes, setCurrentNotes] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [showConfirmDelete, setShowConfirmDelete] = React.useState({ok: false, id: undefined});
    const [showError, setShowError] = React.useState({err: false, title: "", content: ""});
    const [editLine, setEditLine] = React.useState(undefined);
    const [editedText, setEditedText] = React.useState("");
    const [editMode, setEditMode] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [hasPrev, setHasPrev] = React.useState(false);
    const [hasNext, setHasNext] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState([]);
    const [searchResultsPage, setSearchResultsPage] = React.useState(1);
    const [searchResultsCount, setSearchResultsCount] = React.useState(0);  
    const [hasPrevSearch, setHasPrevSearch] = React.useState(false);
    const [hasNextSearch, setHasNextSearch] = React.useState(false);
    
    const totalPages = Math.ceil(totalCount / pageSize);

    const { token, logout } = useAuth();
    
    const searchFunction = async(e) => {
        e.preventDefault();
        
        setSearchResultsPage(1);
        setSearchResultsCount(0);
        setSearchResults([]);
        
        const value = document.getElementById("search-input").value;
        
        if (value.trim().length === 0) {
            setShowError({err: true, title: "Input error", content: "Search keyword cannot be empty."});
            return;
        }
        
        await axios.get("http://localhost:5079/api/search", {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { keyword: value, page: searchResultsPage, pageSize: 2 }

                }).then((response) => {
                    try {      
                        if (response.status === 401) {
                            logout();
                            return;
                        }
                        
                        setSearchResults(response.data.items);
                        setSearchResultsCount(response.data.totalCount);
                    } catch {
                            setSearchResults([]);
                    }
                }).catch((error) => {
                    console.log(error);
                    setShowError({err: true, title: "Error!", content: "Problem while fetching search results"});
                })
    }
    
    const handleSetLine = (id, text) => {
                        
        setEditLine(id);
        setEditMode(!editMode);
        
        setEditedText(text);
        
        if (editMode === false) {
            setEditLine(undefined);
        }
    }
    
    const editChange = (e) => {
                
        const value = e.target.value;
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
                
                if (resp.status === 401) {
                    logout();
                    return;
                }
                
                setEditMode(false);
                setEditLine(undefined);
                setEditedText("");
                setCurrentNotes(currentNotes.map((n) => (n.id === id) ? resp.data : n));
                
                
            } catch(error) {
                setShowError({err: true, title: "Error!", content: "Update failed"});
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
            
            if (resp.status === 401) {
                logout();
                return;
            }
            
            if (resp.status === 200) {
                setCurrentNotes(currentNotes.filter((n) => (n.id !== id)));
            
                setTotalCount(totalCount - 1);
            }
            else setShowError({err: true, title: "Error!", content: "Deleting failed"});
            
        } catch (error) {
            setShowError({err: true, title: "Error!", content: "Deleting failed"});
        }
    }
    
    // saves note from UI to the backend
    const getNote = async(e) => {
        e.preventDefault();
        
        const note = document.getElementById("new-note").value;
        
        if (note.trim().length === 0 || note.length > 25) {
            setShowError({err: true, title: "Input error", content: "Note cannot be empty or longer than 25 characters."});
            return;
        }
        
        try {
            const resp = await axios.post("http://localhost:5079/api/info", {note: note}, {
                headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }  
            );
            
            if (resp.status === 401) {
                logout();
                return;
            }
            
            if (resp.status === 200) {
                setPage(1);
                setCurrentNotes([resp.data, ...currentNotes.slice(0,3)]);
                setTotalCount(totalCount + 1);
            }
            else setShowError({err: true, title: "Error!", content: "Unable to write to database"});
                                    
            document.getElementById("new-note").value="";
            
        } catch(error) {
            setShowError({err: true, title: "Error!", content: "Unable to write to database"});
        }
        
    }
    // fetch new notes, when there is any
    useEffect(() => {
        
        // pagination for notes
        if (page < totalPages) setHasNext(true); else setHasNext(false);
        if (page > 1) setHasPrev(true); else setHasPrev(false);
            
        if (searchResultsPage < Math.ceil(searchResultsCount / 2)) setHasNextSearch(true); else setHasNextSearch(false);
        if (searchResultsPage > 1) setHasPrevSearch(true); else setHasPrevSearch(false);
        
        const fetchSearchResults = async() => {
            
            const value = document.getElementById("search-input").value;
            
            if (value.trim().length === 0) {
                setShowError({err: true, title: "Input error", content: "Search keyword cannot be empty."});
                return;
            }
            
            await axios.get("http://localhost:5079/api/search", {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { keyword: value, page: searchResultsPage, pageSize: 2 }

                    }).then((response) => {
                        try {      
                            if (response.status === 401) {
                                logout();
                                return;
                            }
                            
                            setSearchResults(response.data.items);
                            setSearchResultsCount(response.data.totalCount);
                        } catch {
                                setSearchResults([]);
                        }
                    }).catch((error) => {
                        console.log(error);
                        setShowError({err: true, title: "Error!", content: "Error while fetching search results"});
                    })
        }
        
        if (searchResults.length > 0) fetchSearchResults();
        
        const fetchNotes = async () => {
            
            setLoading(true);
            
            await axios.get("http://localhost:5079/api/info", {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: page, pageSize: pageSize }

                }).then((response) => {
                    try {
                        
                        if (response.status === 401) {
                            logout();
                            return;
                        }
                        
                        setCurrentNotes(response.data.items);
                        
                        setTotalCount(response.data.totalCount);
                        
                    
                    } catch {
                        setCurrentNotes([]);
                        setTotalCount(0);
                    }
            
                    setLoading(false);        
                }).catch((error) => {
                    console.log(error);
                    setShowError({err: true, title: "Error!", content: "Problem with fetching notes"});
                    setLoading(false);
                })
            }
        
        fetchNotes();
        
    }, [token, currentNotes.items, page, pageSize, totalCount, totalPages, logout, searchResultsPage, searchResultsCount, searchResults.length]);
    
    
    return (
        <>
            {showError.err === true ? <Dialog title={showError.title} content = {showError.content} ok="Ok" onConfirm={() => setShowError({err: false, title: "", content: ""})} color="lightred" /> : null}
            {showConfirmDelete.ok === true ? <Dialog title="Are you sure?" ok="Yes" no="Cancel" onCancel={() => setShowConfirmDelete({ok: false, id: undefined})} onConfirm={() => deleteNote(showConfirmDelete.id)} color="lightred" /> : null}
            <div className='page'>
            
            <div className="search-container">
                <form onSubmit={ (e) => searchFunction(e) } style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" }}>
                    <label htmlFor="search-input" style={{ marginRight: "10px" }}>Search: </label>
                    <input type="text" name="search-input" id="search-input" placeholder="Search notes..." className='search-input-class' />
                    <button type="submit" id="search-input-button" className='buttons' style={{ backgroundColor: "blue", marginLeft: "10px"}} >Search</button>
                </form>
            </div>
    
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {searchResults.length > 0 ? <> <button className='buttons' style={{ backgroundColor: "blue", marginBottom: "10px"}} onClick={() => setSearchResults([])} >Clear search results</button>
                     ({searchResultsCount} results)
                    {searchResults.map((item, i) => (
                        <div key={i} style={{ width: "50%", margin: "0 auto", border: "1px solid black", borderRadius: "5px", padding: "10px", marginBottom: "10px", backgroundColor: "#f0f0f0"}}>    
                            {item.note}
                        </div>
                    ))}
                {hasPrevSearch && <><button className="buttons" onClick={() => setSearchResultsPage(searchResultsPage - 1) }>Previous</button> </> }
                {hasNextSearch && <><button className="buttons" onClick={() => setSearchResultsPage(searchResultsPage + 1) }>More</button> </>}
                </> : null}
                
            </div>
            
            <div style={{ textAlign: "center" }}>
                <h2>Notes:</h2>
                
                <label htmlFor="notes">Notes on page:</label>

                <select name="notes" id="notes" onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }} value={pageSize} className='notes-on-page'>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                </select>
                
                <br />
                
                <form onSubmit={(e) => getNote(e)}>
                    <label htmlFor="new-note">Add new note: </label>
                    <input type="text" name="new-note" id="new-note" className='new-note-class' />
                    <button type="submit" className='buttons' style={{ backgroundColor: "red"}}>Save</button>
                </form>
            </div>
            <br />
            <div className='notes-container'>
            {loading === true ? <> <p style={{ textAlign: "center"}}>Loading...</p></> : <>
                {currentNotes.length === 0 ? <p style={{ textAlign: "center"}}>No notes yet.</p> : <>
                    {
                    currentNotes.map((item,i) => (
                    <div id={"a"+item.id} key={i} style={{ alignItems: "start", border: "1px solid black", borderRadius: "5px", padding: "10px", marginBottom: "10px", backgroundColor: "#f0f0f0"}}>    
                            {editLine === item.id ? <> <input type="text" value={editedText} onKeyUp={(e) => handleUpdate(e, item.id)} onChange={(e) => editChange(e)} className='edit-text' id="edit-text" /> </> : <> {item.note} </> }
                            <div style={{ textAlign: "right" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" onClick={() => { handleSetLine(item.id, item.note); }} className='edit'><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z" /></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" onClick={() => setShowConfirmDelete({ok: true, id: item.id})} className='delete'><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5" /></svg>
                            </div>
                    </div>  
                ))}
                
                 
                { hasPrev ? <button className='buttons' style={{ backgroundColor: "blue", marginTop: "10px", marginLeft: "10px"}} onClick={() => { setPage(page - 1) }}>Show {pageSize} previous</button>  : null }
                { hasNext ? <button className='buttons' style={{ backgroundColor: "blue", marginTop: "10px"}} onClick={() => { setPage(page + 1) }} >Load more</button> : null }
                
            
                </>}</>}
            </div>
            </div>
        </>
    );
}

export default NotesPage;
