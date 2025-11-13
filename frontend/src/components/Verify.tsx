import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

function Verify() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        otp: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    async function doVerify(event: React.FormEvent) {
        event.preventDefault();
        const payload = { username: formData.username, otp: formData.otp };
        try {
            const response = await fetch(buildPath('api/verifyOTP'), {
                method: 'POST',
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

            setMessage('Verified! Redirecting...');
            navigate('/home');
        } catch (error: any) {
            setMessage(error.toString());
        }
    }

    return (
        <div className="flex flex-col gap-8 w-lg">
            <h1 className="text-5xl font-bold text-(--primary)">verify your account</h1>
            <form onSubmit={doVerify} className="flex flex-col gap-3 w-full">
                <input
                    type="text"
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    required
                />
                <input
                    type="text"
                    id="otp"
                    name="otp"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    required
                    minLength={6}
                    maxLength={6}
                />
                <Button variant="tertiary" size="lg" type="submit">Verify</Button>
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

export default Verify;
