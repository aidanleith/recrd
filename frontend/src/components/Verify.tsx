import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/Button";
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

// Track auto-sent emails at module level to persist across component remounts (React StrictMode)
const autoSentUsernames = new Set<string>();
const sendingInProgress = new Set<string>();

function Verify() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        otp: ''
    });

    // Pre-fill username from URL params and automatically send verification email
    useEffect(() => {
        const usernameFromUrl = searchParams.get('username');
        if (usernameFromUrl && !autoSentUsernames.has(usernameFromUrl) && !sendingInProgress.has(usernameFromUrl)) {
            setFormData(prev => ({
                ...prev,
                username: usernameFromUrl
            }));
            // Automatically send verification email when redirected from login (only once per username)
            const sendVerificationEmailAutomatically = async (username: string) => {
                // Prevent concurrent sends for the same username
                if (sendingInProgress.has(username)) {
                    return;
                }
                sendingInProgress.add(username);
                autoSentUsernames.add(username);
                
                try {
                    console.log('Auto-sending verification email for:', username);
                    const response = await fetch(buildPath('api/resendVerification'), {
                        method: 'POST',
                        body: JSON.stringify({ username: username }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const text = await response.text();
                    let res: any = {};
                    try { res = JSON.parse(text); } catch { res = { error: text }; }

                    if (res && res.error) {
                        // Only show error if it's not about already being verified
                        if (!res.error.includes('already verified')) {
                            setResendMessage(res.error);
                        }
                        // Remove from set on error to allow retry
                        autoSentUsernames.delete(username);
                    } else {
                        setResendMessage('Verification email sent! Check your inbox.');
                    }
                } catch (error: any) {
                    // Silently fail for automatic sends to avoid showing errors on page load
                    console.error('Failed to send verification email:', error);
                    // Remove from set on error to allow retry
                    autoSentUsernames.delete(username);
                } finally {
                    sendingInProgress.delete(username);
                }
            };
            sendVerificationEmailAutomatically(usernameFromUrl);
        }
    }, [searchParams]);

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

    async function handleResend(event: React.MouseEvent) {
        event.preventDefault();
        if (!formData.username) {
            setResendMessage('Please enter your username first');
            return;
        }

        setResendMessage('');
        try {
            const response = await fetch(buildPath('api/resendVerification'), {
                method: 'POST',
                body: JSON.stringify({ username: formData.username }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const text = await response.text();
            let res: any = {};
            try { res = JSON.parse(text); } catch { res = { error: text }; }

            if (res && res.error) {
                setResendMessage(res.error);
            } else {
                setResendMessage('Verification email sent! Check your inbox.');
            }
        } catch (error: any) {
            setResendMessage(error.toString());
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
            <div className="flex flex-col gap-2">
                <Button 
                    variant="secondary" 
                    size="md" 
                    type="button"
                    onClick={handleResend}
                >
                    Resend Verification Email
                </Button>
                {resendMessage && (
                    <span className={`text-center text-sm ${
                        resendMessage.toLowerCase().includes('sent') ? 'text-green-500' : 'text-red-500'
                    }`}>
                        {resendMessage}
                    </span>
                )}
            </div>
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
