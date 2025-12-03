import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    
    const { isLoggedIn, logout } = useAuth();
    
    return (
        
        <div className="navbar">
            <Link to="/">Home</Link>
            {isLoggedIn === false ? <>
                     <Link to="/login">Login</Link>
                     </>
            : <>
                <Link onClick={() => logout()}>Logout</Link>
                </>
            }
            <Link to="/register">Register</Link>
            <Link to="/profile">Profile</Link>
        </div>
    );
}

export default Header;