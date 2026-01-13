import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';

const Header = () => {

    // navRef is null, before render
    const navRef = useRef(null);
    const { isLoggedIn, logout } = useAuth();
    
    const [open, setOpen] = useState(false);
    
    useEffect(() => {
        
        function handleClickOutside(event) {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // "cleanup"
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
        
    }, [open]);
                          
    return (
        <>
        <nav className="navbar" ref={navRef}>
            <Link to="/">Home</Link>
            {isLoggedIn === false ? <>
                     <Link to="/login">Login</Link>
                     <Link to="/register">Register</Link>
                     </>
            : <>
                <Link onClick={() => setOpen( !open ) }>My account</Link>
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