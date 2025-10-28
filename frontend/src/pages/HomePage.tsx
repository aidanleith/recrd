import LoggedInName from '../components/LoggedInName';
import CardUI from '../components/CardUI';

const HomePage = () =>
{
    return(
        <div>
            <LoggedInName />
            <CardUI />
        </div>
    );
}

export default HomePage;