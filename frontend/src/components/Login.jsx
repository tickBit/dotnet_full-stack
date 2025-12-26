import axios from "axios";
import { Link } from "react-router";
import Header from "./Header";
import { useAuth } from "../contexts/AuthContext";
import React, { useEffect } from "react";

const Login = () => {

    const { useremail, login } = useAuth();    
    
    const [waiting, setWaiting] = React.useState(false);
    const [status, setStatus] = React.useState("Waiting");
    const [backgroundColor, setBackgroundColor] = React.useState("lightgrey");

    useEffect(() => {
        
        if (waiting) {
            setStatus("Waiting for server...");
            setBackgroundColor("orange");
            return;
        }
        
        if (useremail === "" && !waiting) {
            setStatus("Logged out.");
            setBackgroundColor("lightgrey");
        } else {
            setStatus("Logged in");
            setBackgroundColor("lightgreen");
        }
    }, [waiting, useremail]);
       
    const handleLogin = async (e) => {
        e.preventDefault();

        // read values from form inputs
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        let resp;
        
        // because there seems to be delay sometimes fetching from server,
        // a waiting state is used to inform user
        try {
            setWaiting(true);
            resp = await axios.post("http://localhost:5079/api/users/login", {
                    email: email,
                    password: password
                }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            setWaiting(false);
            
            const data = resp.data;

            if (data && data.token) {
                login(email, data.token);
                
                setStatus("Login successful.");
                setBackgroundColor("lightgreen");
                    
            } else {
                setStatus("Login failed. Check credentials.");
                setBackgroundColor("red");
            }
            
        } catch (error) {
            setStatus(error.response ? error.response.data : "Error.");
            setBackgroundColor("red");
        }
    }
    
    return (
        <>
        <Header />
        <div className="login">
            <h2>Login Page</h2>
            
            <div className="login-status" style={{ backgroundColor: backgroundColor }}>
                <div className="column">
                    <p>Status: </p>
                </div>
                <div className="column">
                    <p>{status}</p>
                </div>
            </div>
            
            <div className="login-form">
            <form onSubmit={handleLogin}>
            <div className="form-group">
                <label>Email:</label>
                <br/>
                <input type="text" name="email" className="email" />
                <br/>
                <label>Password:</label>
                <br/>
                <input type="password" name="password" className="password" />
                <br/>
                <button type="submit" className="buttons">Login</button>
            </div>
            </form>
            {useremail !== "" && <Link to="/">Go back to home page now</Link>}
            </div>
        </div>
        </>
    )
}

export default Login;