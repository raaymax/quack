import { useCallback, useEffect, useState } from 'react';
import { client } from '../../core';
import PasswordResetPage from './PasswordResetPage';
import { ErrorPage } from './ErrorPage';

export const PasswordReset = () => {
  const url = new URL(window.location.toString());
  const m = url.hash.match("/reset/(.*)");
  const token = m && m[1];
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return setError("Invalid invitation link");
    client.api.auth
      .checkPasswordResetToken({ token })
      .then((data: { valid: boolean, email: string }) => {
        if (!data.valid) {
          setError("Invalid invitation link");
        } else {
          setEmail(data.email);
          setError(null);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [token]);

  const submit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      const { password } = e.target as typeof e.target & {
        password: { value: string };
      };

      if (!token || !email) return;
      try {
        await client.api.auth.resetPassword({
          email,
          token,
          password: password.value,
        });

        localStorage.setItem("token", "");
        localStorage.setItem(
          "loginMessage",
          "PasswordReset successful. You can login now.",
        );
        window.location.href = "/";
      } catch (err) {
        if (err instanceof Error) {
          console.error(err);
          setMsg(err.message);
        }else{
          console.error(err);
          setMsg('Unknown error');
        }
      }
    },
    [token, email],
  );

  if (error) {
    return <ErrorPage 
      title="404" 
      description={[
        "Link you are trying to open is invalid",
        "It could expire or was copied incorectly"
      ]}
      buttons={['home']}
    />;
  }
  return (<PasswordResetPage onSubmit={submit} error={msg} />);
};

export default PasswordReset;
