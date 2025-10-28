import Register from '../components/Register';

interface RegisterPageProps {
    onRegisterSuccess: () => void;
}

const RegisterPage = ({ onRegisterSuccess }: RegisterPageProps) => {
    return (
        <div className='h-screen flex items-center justify-center'>
            <Register onRegisterSuccess={onRegisterSuccess} />
        </div>
    );
};

export default RegisterPage;
