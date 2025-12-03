import Header from "./Header";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
    
    const { useremail } = useAuth();
    
    return (
        <>
            <Header />
            <div className="profile">
            {useremail === "" ? <><div>Please log in to view your profile.</div>
            </> :
            <>
            
            <h2>Profile Page for {useremail}</h2>
            <p>Here you can delete your account.</p>
            <button className="buttons" style={{backgroundColor: "red"} }>Delete Account</button>
            </>
            }
            </div>
        </>
    );
}

export default Profile;