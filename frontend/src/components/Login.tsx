import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button"
import { Link, useLocation } from 'react-router-dom';

interface LoginProps {
    onLoginSuccess: () => void;
}

function Login({ onLoginSuccess }: LoginProps)
{
    const navigate = useNavigate();
    const [message,setMessage] = useState('');
    const [loginName,setLoginName] = useState('');
    const [loginPassword,setPassword] = useState('');
    
    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();
        var obj = {login:loginName,password:loginPassword};
        var js = JSON.stringify(obj);

        try
        {
            const response = await fetch('http://localhost:5000/api/login',
            {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});
            var res = JSON.parse(await response.text());

            if( res.id <= 0 )
            {
                setMessage('User/Password combination incorrect');
            }
            else
            {
                var user = {firstName:res.firstName,lastName:res.lastName,id:res.id, userLogin:loginName}
                localStorage.setItem('user_data', JSON.stringify(user));
                setMessage('');
                onLoginSuccess();
                navigate('/home');
            }
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
        }
    };

    function handleSetLoginName( e: any ) : void
    {
        setLoginName( e.target.value );
    }

    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }

    return(
        <div className="flex flex-col gap-8 w-lg">
            <h1 className="text-5xl font-bold text-(--primary)">
                recrd
            </h1>
            <div className="flex flex-col gap-3 w-full">
                <input type="text" id="loginName" placeholder="Username" className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    onChange={handleSetLoginName} />
                <input type="password" id="loginPassword" placeholder="Password" className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    onChange={handleSetPassword} />
                <Button 
                    variant="tertiary"
                    size="lg"
                    onClick={doLogin}
                    type="submit"
                    id="loginButton"
                >
                    Login
                </Button>
                <h2>forgot your password?</h2>
                {/* make it a link not an h2 */}
            </div>
            <div className="flex w-full justify-between">
                <h2 className="text-(--darktext) font-bold">don't have an account?</h2>
                <Link
                to="/register"
              >
                <h2 className="text-(--primary) font-bold hover:underline">sign up</h2>
              </Link>
            </div>

            <span id="loginResult">{message}</span>
        </div>
    );
};

export default Login;
