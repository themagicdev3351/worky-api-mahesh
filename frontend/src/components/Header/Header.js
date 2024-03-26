import './header.css';
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../utils/localstorage'
const Header = ({ click }) => {
    const navigate = useNavigate();
    // const [user] = useState()
    const _handleLogout = () => {
        // console.log('click') 
        logout()
        navigate('/');
    }

    return (
        <nav className="navbar py-3">
            <div className='container'>
                <div className="navbar__logo">
                    <Link to="/">
                        <h2>E-COMERCE</h2>
                    </Link>
                </div>

                <ul className="navbar__links">
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                    <li>
                        <p onClick={_handleLogout}>Logout</p>
                    </li>
                    {/* {!user.userInfo.isLogin ? (
                        <>
                            <li>
                                <Link to="/signin">Login</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/cart" className="cart__link">
                                    <i className="fas fa-shopping-cart"></i>
                                    <span>
                                        Cart <span className="cartlogo__badge">{getCartCount()}</span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/addcar">add car</Link>
                            </li>
                            <li>
                                <p onClick={_handleLogout}>Logout</p>
                            </li>
                            <li>
                                <Link to="/profile" className="cart__link">
                                    <span className="cartlogo__badge" style={{ margin: '0' }}>{user.userInfo.details.fullName}</span>
                                </Link>
                            </li>
                        </>
                    )} */}
                </ul>

                <div className="hamburger__menu" onClick={click}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </nav>
    )
}

export default Header
