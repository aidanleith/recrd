import Login from '../components/Login.tsx';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
    return (
        <div className='h-screen flex items-center justify-center'>
            <Login onLoginSuccess={onLoginSuccess} />
        </div>
    );
};

export default LoginPage;