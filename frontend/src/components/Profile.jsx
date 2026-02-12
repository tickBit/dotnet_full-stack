import axios from "axios";
import Header from "./Header";
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import Dialog from "./Dialog";

const Profile = () => {
    
    const { useremail, token, logout } = useAuth();
    const [showDialog, setShowDialog] = React.useState(false);
    const [showOk, setShowOk] = React.useState(false);
    const [showError, setShowError] = React.useState({err: false, title: "", content: ""});
    
    const handleOk = () => {
        setShowOk(false);
    }
    
    const handleDeleteUser = async () => {
            
            await axios.delete("http://localhost:5079/api/users/delete", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then((resp => {
                
                if (resp.status === 200) {
                    setShowDialog(false);
                    logout(false);
                    setShowOk(true);
                }
                
            })).catch((error => {
                setShowDialog(false);
                setShowError({err: true, title: "Error!", content: "Error deleting user"});
                console.log(error);
            }));
    }
    
    return (
        <>
            <Header />
            <div className="profile">
            {showError.err === true ? <Dialog title={showError.title} content={showError.content} ok="Ok" onConfirm={() => setShowError({err: false, title: "", content: ""})} color="lightred" /> : null}
            {showOk === true ? <Dialog title="Account deleted" ok="Ok" onConfirm={() => handleOk()} color="lightgreen" /> : null}
            {showDialog === true ? <Dialog title="Are you sure?" ok="Yes" no="Cancel" onCancel={() => setShowDialog(false)} onConfirm={() => handleDeleteUser()} color="lightred" /> : null}
            <div className="page">
            {useremail === "" ? <><div style={{textAlign: "center"}}>Please log in to view your profile.</div>
            </> :
            <>
            <div style={{textAlign: "center"}}>           
            <h2>Profile Page for {useremail}</h2>
            <p>Here you can delete your account.</p>
            <button className="buttons" onClick={() => setShowDialog(true)} style={{backgroundColor: "red"} }>Delete Account</button>
            </div>
            </>
            }
            </div>
            </div>
        </>
    );
}

export default Profile;