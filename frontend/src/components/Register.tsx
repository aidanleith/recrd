import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button"

interface RegisterProps {
    onRegisterSuccess: () => void;
}

function Register({ onRegisterSuccess }: RegisterProps) {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
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

    async function doRegister(event: React.FormEvent) {
        event.preventDefault();

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        // Create user object matching database structure
        const newUser = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            following: [],
            followers: [],
            createdAt: new Date().toISOString()
        };

        console.log('Register: sending', newUser);

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                body: JSON.stringify(newUser),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const text = await response.text();
            let res: any = {};
            try { res = JSON.parse(text); } catch { res = { error: text }; }

            console.log('Register response', response.status, res);

            if (!response.ok) {
                setMessage(res.error || `Server error: ${response.status}`);
                return;
            }

            if (res.error) {
                setMessage(res.error);
            } else {
                // Clear form and show success message
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                setMessage('Registration successful!');
                onRegisterSuccess();
                navigate('/login');
            }
        } catch (error: any) {
            console.error('Register fetch error', error);
            setMessage(error.toString());
        }
    }

    return (
        <div className="flex flex-col gap-8 w-lg">
            <h1 className="text-5xl font-bold text-(--primary)">
                recrd
            </h1>
            <form onSubmit={doRegister} className="flex flex-col gap-3 w-full">
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
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-center h-12 font-semibold bg-[#1e1e1e] border border-(--primary) rounded-lg"
                    required
                />
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
                <Button 
                    variant="tertiary"
                    size="lg"
                    type="submit"
                >
                    Create Account
                </Button>
            </form>

            <div className="flex w-full justify-between">
                <h2 className="text-(--darktext) font-bold">already have an account?</h2>
                <button 
                    onClick={() => navigate('/login')}
                    className="text-(--primary) font-bold hover:underline"
                >
                    log in
                </button>
            </div>

            {message && (
                <span className={`text-center ${
                    message.includes('successful') ? 'text-green-500' : 'text-red-500'
                }`}>
                    {message}
                </span>
            )}
        </div>
    );
}

export default Register;