import { Link } from 'react-router';

const Header = () => {
    return (
        
        <div className="navbar">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
        </div>
    );
}

export default Header;