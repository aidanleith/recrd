import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "./ui/Button";
import { buildPath } from './Path';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    async function doForgotPassword(event: React.FormEvent) {
        event.preventDefault();
        setMessage('');

        if (!email.trim()) {
            setMessage('Please enter your email address');
            return;
        }

        const payload = { email: email.trim() };
        
        try {
            const response = await fetch(buildPath('api/forgotPassword'), {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const text = await response.text();
            let res: any = {};
            try {
                res = JSON.parse(text);
            } catch {
                res = { error: text };
            }

            if (res.error) {
                setMessage(res.error);
                return;
            }

            // Success - show confirmation (don't reveal if email exists for security)
            setIsSubmitted(true);
            setMessage('');
        } catch (error: any) {
            setMessage(error.toString());
        }
    }

    return (
        <div className="flex flex-col gap-8 w-lg">
            <h1 className="text-5xl font-bold text-(--primary)">
                forgot your password?
            </h1>
            
            {!isSubmitted ? (
                <>
                    <p className="text-(--darktext)">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <form onSubmit={doForgotPassword} className="flex flex-col gap-3 w-full">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={handleEmailChange}
                            className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                            required
                            autoComplete="email"
                        />
                        <Button
                            variant="tertiary"
                            size="lg"
                            type="submit"
                        >
                            Send Reset Link
                        </Button>
                    </form>
                    {message && (
                        <span className="text-center text-red-500">
                            {message}
                        </span>
                    )}
                    <div className="flex w-full justify-center">
                        <Link to="/login">
                            <h2 className="text-(--primary) font-bold hover:underline">
                                back to login
                            </h2>
                        </Link>
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-4">
                    <p className="text-green-500 text-center">
                        If an account exists with that email, we've sent you a password reset link.
                    </p>
                    <p className="text-(--darktext) text-center text-sm">
                        Please check your email and click the link to reset your password.
                    </p>
                    <div className="flex w-full justify-center">
                        <Link to="/login">
                            <h2 className="text-(--primary) font-bold hover:underline">
                                back to login
                            </h2>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ForgotPassword;

