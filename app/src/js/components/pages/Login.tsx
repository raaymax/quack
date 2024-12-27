import { lazy, useCallback, useEffect, useState } from 'react';
import { UserProvider } from '../contexts/user';
import { client } from '../../core'
const LoginPage = lazy(() => import("./LoginPage"));

type LoginProps = {
  children: React.ReactNode;
};

export const Login = ({ children }: LoginProps) => {
  const [status, setStatus] = useState('pending');
  const [userId, setUser] = useState<string | null>(null);
  const [msg, setMsg] = useState<any>(null);

  useEffect(() => {
    localStorage.removeItem('loginMessage');
  });


  const validate = useCallback(() => client.api.auth.restoreSession()
    .then(async ({ status: validationStatus, user: validatedUser }) => {
      setStatus(validationStatus);
      if (validationStatus === 'ok') {
        setUser(validatedUser);
      } else {
        setUser(null);
      }
    }).catch((e) => {
      console.error(e);
      setTimeout(validate, 1000);
    }), []);

  const fastAccess = useCallback(() => {
    const myuser = client.api.auth.me();
    if (myuser) {
      setStatus('ok');
      setUser(myuser);
      setTimeout(validate, 100);
    }
  }, [validate]);

  useEffect(() => {
    fastAccess();
    validate();
  }, [validate, fastAccess]);

  useEffect(() => {
    const reload = () => window.location.reload();
    window.addEventListener('hashchange', reload);
    return () => window.removeEventListener('hashchange', reload);
  }, [])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('pending');
    const fd = new FormData(e.target as HTMLFormElement);
    const value = Object.fromEntries(fd.entries()) as { email: string, password: string };
    const ret = await client.api.auth.login(value);
    if (ret.status === 'ok') {
      window.location.reload();
    } else {
      if (ret.errorCode === 'PASSWORD_RESET_REQUIRED') {
        setMsg(<div>{ret.message}. <a href={`/#/reset/${ret.token}`}>reset password</a></div>);
      } else {
        setMsg(<div>{ret.message}</div>);
      }
      setStatus('error');
    }
  };

  return userId ? (
    <UserProvider value={userId}>
      {children}
    </UserProvider>
  ) : <LoginPage onSubmit={onSubmit} error={msg} disabled={status === 'pending'} />;
};
