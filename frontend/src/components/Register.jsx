import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import Header from "./Header";
import Dialog from "./Dialog";
import axios from 'axios';

const Register = () => {

    const [showError, setShowError] = React.useState(false);
    const [passwordsOk, setPasswordsOk] = React.useState(true);
    const [emailOk, setEmailOk] = React.useState(true);
    
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const handleResetForm = () => {
    
        document.getElementsByClassName("email")[0].value = "";
        
        let arr = document.getElementsByClassName("password");
        arr[0].value = "";
        arr[1].value = "";
        
        setEmailOk(true);
        setPasswordsOk(true);
    }
    
    const handleRegister = async(e) => {
    
        e.preventDefault();

        // read values from form inputs
        const email = e.target.email.value;
        const password = e.target.password.value;
        const password2 = e.target.password2.value;
        
        // no real email validation
        if (email !== "") {
            setEmailOk(true);
         } else {
           setEmailOk(false);
           return;  
         } 
        
        if (password !== password2) {
            setPasswordsOk(false);
            return;
         } else {
             setPasswordsOk(true);
         }
        
        if (passwordsOk && emailOk) {
            
            try {
                const resp = await axios.post("http://localhost:5079/api/users/register", {
                    email: email,
                    password: password
                }, {
                headers: {
                    "Content-Type": "application/json"
                }})
                
                if (resp.status === 200) {
                    login(email, password);
                    navigate("/");
                }
                
            } catch (error) {
                setShowError(true);
            }
        }
        
    }
     
    return (
        <>
        <Header />
        <div className='register'>
        <h2>Register</h2>
        
        {!passwordsOk ? <Dialog title="Passwords don't match" ok="Ok" color="lightred" onConfirm={() => handleResetForm()} /> : null}
        {!emailOk ? <Dialog title="Provide an email" ok="Ok" color="lightred" onConfirm={() => handleResetForm()} /> : null}
        
        <div className='page'>
        <div className="login-form">
            <form onSubmit={handleRegister}>
            <div className="form-group">
                <label>Email:</label>
                <br/>
                <input type="text" name="email" className="email" />
                <br/>
                <label>Password:</label>
                <br/>
                <input type="password" name="password" className="password" />
                <br/>
                <label>Password again:</label>
                <br/>
                <input type="password" name="password2" className="password" />
                <br/>
                <button type="submit" className="buttons">Register</button>
            </div>
            </form>
            </div>
            </div>
            </div>
        </>
    );
}

export default Register;