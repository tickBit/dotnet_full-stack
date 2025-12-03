import axios from "axios";
import { Link } from "react-router";
import Header from "./Header";
import { useAuth } from "../contexts/AuthContext";
import React, { useEffect } from "react";

const Login = () => {

    const { useremail, login } = useAuth();    
    
    const [status, setStatus] = React.useState("Waiting");
    const [backgroundColor, setBackgroundColor] = React.useState("lightgrey");

    useEffect(() => {
        
        if (useremail === "") {
            setStatus("Logged out.");
            setBackgroundColor("lightgrey");
        }
    }, [useremail]);
       
    const handleLogin = async (e) => {
        e.preventDefault();

        // read values from form inputs
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        let resp;
        
        try {
            
            resp = await axios.post("http://localhost:5079/api/users/login", {
                    email: email,
                    password: password
                }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
        
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
            setStatus(error.response ? error.response.data.detail : "Error.");
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
                <input type="text" name="email" id="email" />
                <br/>
                <label>Password:</label>
                <br/>
                <input type="password" name="password" id="password" />
                <br/>
                <button type="submit" className="buttons">Login</button>
            </div>
            </form>
            {useremail !== "" && <Link to="/">Go back to home to see what's new</Link>}
            </div>
        </div>
        </>
    )
}

export default Login;