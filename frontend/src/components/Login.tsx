import React, { useState } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { Button } from "./ui/Button"
import { Link } from 'react-router-dom';

type customJwtPayload = { id: string, email: string };


function Login() {
    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = React.useState('');
    const [loginPassword, setPassword] = React.useState('');
    async function doLogin(event: any): Promise<void> {
        event.preventDefault();
        var obj = { username: loginName, password: loginPassword };
        var js = JSON.stringify(obj);
        try {
            const response = await fetch(buildPath('api/login'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });
            var res = JSON.parse(await response.text());

            if (res.error) {
                setMessage(res.error);
                return;
            }

            const { accessToken } = res;
            storeToken(res);
            const decoded = jwtDecode<customJwtPayload>(accessToken);
            try {
                var ud = decoded;
                var userId = ud.id;
                var email = ud.email;
                if (!userId) {
                    setMessage('User/Password combination incorrect');
                } else {
                    var user = { email: email, id: userId };
                    localStorage.setItem('user_data', JSON.stringify(user));
                    setMessage('');
                    window.location.href = '/home';
                }
            }
            catch (e) {
                console.log(e);
                return;
            }
        }
        catch (error: any) {
            alert(error.toString());
            return;
        }
    };
    function handleSetLoginName(e: any): void {
        setLoginName(e.target.value);
    }
    function handleSetPassword(e: any): void {
        setPassword(e.target.value);
    }
    return (
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
                <Link to="/forgot-password">
                    <h2 className="text-(--primary) font-bold hover:underline text-center">
                        forgot your password?
                    </h2>
                </Link>
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