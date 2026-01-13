import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

const Header = () => {

    
    const { isLoggedIn, logout } = useAuth();
    
    const [open, setOpen] = React.useState(false);
    
    // if clicked outside navbar in the app's window, hide menu items
    try {
        window.document.getElementsByClassName("page")[0].addEventListener("click", function(e) {
            if (open) setOpen(false);
        });
    }
    catch(err) {
        // catch error, if the "page" class isn't rendered yet...  
    }
    
    return (
        <>
        <nav className="navbar">
            <Link to="/">Home</Link>
            {isLoggedIn === false ? <>
                     <Link to="/login">Login</Link>
                     <Link to="/register">Register</Link>
                     </>
            : <>
                <Link onClick={() => setOpen( () => setOpen(!open) ) }>My account</Link>
                {open && <>
                <nav className='menu'>
                <ul>
                    <li><Link to="/profile">Profile</Link></li>
                    <li><Link onClick={() => logout()}>Logout</Link></li>
                </ul>
                </nav>
                </>
                }
                </>
            }
        </nav>
        </>
    );
}

export default Header;