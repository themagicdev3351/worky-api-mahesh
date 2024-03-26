import React, { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Api } from '../../utils/Api';
import { setTokenLocalStorage } from '../../utils/localstorage';
import './signIn.css'

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState()
  const [password, setPassword] = useState()
  const [loading, setLoading] = useState(false)

  const _handleSubmit = useCallback(async () => {
    // callback
    if (email?.length > 2 && password?.length > 2) {
      setLoading(true)
      const { statusCode, data } = await Api.postRequest('/api/user/signin', {
        email,
        password,
      })
      setLoading(false)
      console.log(data, 'data')
      if (statusCode === 400 || statusCode === 500 || statusCode === 403) {
        setLoading(false)
        alert(data)
        return
      }
      const { token } = JSON.parse(data)
      setTokenLocalStorage(token)
      navigate('/');
    } else {
      alert('Please enter email or password')
    }
  }, [email, navigate, password])

  if (loading) return <h1>Loading.....</h1>

  return (
    <div className="signinscreen">
      <div className="container">
        <div className="innerContainer">
          <form>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                // backgroundColor: 'red',
              }}
            >
              <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                <i class="fas fa-arrow-circle-left fa-5x"></i>
              </div>
              <p>Sign In</p>
            </div>

            <label for="email">Email</label>
            <input
              type="email"
              id="lname"
              name="email"
              autoFocus
              placeholder="Your email.."
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <label for="password">Password</label>
            <input
              type="password"
              id="lname"
              name="password"
              placeholder="Your Password.."
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <Link to="/register" className="link">
              <span>Creat a new account ?</span>
            </Link>
            <br />

            <input type="submit" value="Sign in" onClick={_handleSubmit} />
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
