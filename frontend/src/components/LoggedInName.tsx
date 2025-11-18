function LoggedInName()
{
    function getCurrentUserName() {
        var data = null;
        try {
            data = JSON.parse(localStorage.getItem('user_data') || 'null');
        } catch (e) {
            data = null;
        }
        return data && data.email ? data.email : '';
    }

    function doLogout(event:any) : void
    {
        event.preventDefault();
        localStorage.removeItem('user_data');
        localStorage.removeItem('token_data');
        window.location.href = '/login';
    };
        
    return(
        <div id="loggedInDiv">
            <span id="userName">Logged In As {getCurrentUserName()} </span><br />
            <button aria-label="Log out" type="button" id="logoutButton" className="buttons"
                onClick={doLogout}> Log Out </button>
        </div>
    );
};
export default LoggedInName;