import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Button } from "./ui/Button";
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

function ResetPassword() {
    const navigate = useNavigate();
    const { token } = useParams();
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    async function doResetPassword(event: React.FormEvent) {
        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        event.preventDefault();

        const payload = { password: formData.password};
        try {
            const response = await fetch(buildPath(`api/resetPassword/${token}`), {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const text = await response.text();
            let res: any = {};
            try { res = JSON.parse(text); } catch { res = { error: text }; }

            if (!response.ok) {
                setMessage(res.error || `Server error: ${response.status}`);
                return;
            }

            if (res && res.error) {
                setMessage(res.error);
                return;
            }

            // Expect { accessToken }
            if (!res.accessToken) {
                setMessage('Verification failed: no token received');
                return;
            }

            storeToken(res);
            try {
                const decoded: any = jwtDecode(res.accessToken);
                const user = { email: decoded.email, id: decoded.id };
                localStorage.setItem('user_data', JSON.stringify(user));
            } catch {}
            
            setMessage('Password Reset! Redirecting...');
            navigate('/login');
        } catch (error: any) {
            setMessage(error.toString());
        }
    }

    return (
        <div className="flex flex-col gap-8 w-lg">
            <h1 className="text-5xl font-bold text-(--primary)">reset your password</h1>
            <form onSubmit={doResetPassword} className="flex flex-col gap-3 w-full">
                <input
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    required
                    minLength={6}
                />
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    required
                />
                <Button aria-label="Reset Password" variant="tertiary" size="lg" type="submit">Reset Password</Button>
            </form>
            {message && (
                <span className={`text-center ${
                    message.toLowerCase().includes('verified') ? 'text-green-500' : 'text-red-500'
                }`}>
                    {message}
                </span>
            )}
        </div>
    );
}

export default ResetPassword;
