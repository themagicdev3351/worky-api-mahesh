import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Api } from '../Api'
import { logout } from '../localstorage'

function useLogin() {
  const [loginInfo, setLoginInfo] = useState({
    loading: true,
    isLogin: false,
  })
  const navigate = useNavigate();
  const checkLogin = useCallback(async () => {
    const { statusCode } = await Api.getRequest(`/api/user/me`)
    // console.log({statusCode, data})
    if (statusCode === 400 || statusCode === 500) {
      navigate('/');
      logout()
      return
    }
    setLoginInfo({ loading: false, isLogin: true })
  }, [navigate])

  useEffect(() => {
    checkLogin()
  }, [checkLogin])

  return { loginInfo }
}

export default useLogin
