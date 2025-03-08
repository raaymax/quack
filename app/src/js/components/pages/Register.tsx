import { useCallback, useEffect, useState } from "react";
import { client } from "../../core";
import RegistrationPage from "./RegistrationPage";
import { ErrorPage } from "./ErrorPage";

export const Register = () => {
  const url = new URL(window.location.toString());
  const m = url.hash.match("/invite/(.*)");
  const token = m && m[1];
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    console.log(token);
    if (!token) return setError("Invalid invitation link");
    client.api.auth
      .checkRegistrationToken({ token })
      .then(({ valid }: { valid: boolean }) => {
        if (!valid) {
          setError("Invalid invitation link");
        } else {
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
      console.log(e.target);
      const { name, email, password } = e.target as typeof e.target & {
        name: { value: string };
        email: { value: string };
        password: { value: string };
      };

      if (!token) return;
      try {
        await client.api.auth.register({
          name: name.value,
          email: email.value,
          password: password.value,
          token,
        });

        localStorage.setItem("token", "");
        localStorage.setItem(
          "loginMessage",
          "Registration successful. You can login now.",
        );
        window.location.href = "/";
      } catch (err) {
        if (err instanceof Error) {
          console.log(err);
          setMsg(err.message);
        } else {
          if ((err as any)?.errorCode === "USER_ALREADY_EXISTS") {
            setMsg((err as any).message);
          } else {
            console.log(err);
            setMsg("Unknown error");
          }
        }
      }
    },
    [token],
  );

  if (error) {
    return (
      <ErrorPage
        title="404"
        description={[
          "Link you are trying to open is invalid",
          "It could expire or was copied incorectly",
        ]}
        buttons={["home"]}
      />
    );
  }
  return <RegistrationPage onSubmit={submit} error={msg} />;
};

export default Register;
