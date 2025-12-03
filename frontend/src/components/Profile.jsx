import axios from "axios";
import Header from "./Header";
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import Dialog from "./Dialog";

const Profile = () => {
    
    const { useremail, token, logout } = useAuth();
    const [showDialog, setShowDialog] = React.useState(false);
    const [showOk, setShowOk] = React.useState(false);
    
    const handleOk = () => {
        setShowOk(false);
    }
    
    const handleDeleteUser = async () => {
            
            try {
                const resp = await axios.delete("http://localhost:5079/api/users/delete", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
                
            if (resp.status === 200) {
                setShowDialog(false);
                logout();
                setShowOk(true);
                
            } else {
                alert("Failed to delete account.");
            }
        } catch (error) {
            alert("Error deleting account.");
        }
    }
    
    return (
        <>
            <Header />
            <div className="profile">
            {showOk === true ? <Dialog title={"Account deleted"} ok="Ok" onConfirm={() => handleOk()} color="lightgreen" /> : null}
            {showDialog === true ? <Dialog title="Are you sure?" ok="Yes" no="Cancel" onCancel={() => setShowDialog(false)} onConfirm={() => handleDeleteUser()} color="lightred" /> : null}
            {useremail === "" ? <><div>Please log in to view your profile.</div>
            </> :
            <>           
            <h2>Profile Page for {useremail}</h2>
            <p>Here you can delete your account.</p>
            <button className="buttons" onClick={() => setShowDialog(true)} style={{backgroundColor: "red"} }>Delete Account</button>
            </>
            }
            </div>
        </>
    );
}

export default Profile;