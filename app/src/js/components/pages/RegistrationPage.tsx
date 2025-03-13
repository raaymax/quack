import styled, { useTheme } from "styled-components";
import { Loader } from "../atoms/Loader";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.Chatbox.Background};
  color: ${({ theme }) => theme.Text};

  .image-container {
    flex: 1;
    .image{
      vertical-align: middle;
      text-align: center;
      margin-top: 50vh;
      transform: translateY(-50%);
      img {
        width: 80%;
        height: auto;
      }
    }
  }


  .form-container {
    flex: 1;
    .form {
      display: flex;
      flex-direction: column;
      margin: auto;
      gap: 12px;
      max-width: 380px;
      margin-top: 50vh;
      transform: translateY(-50%);
      padding: 16px;
      form, .form-group {
        display: flex;
        flex-direction: column;
      }
      form {
        gap: 16px;
      }
    }
  }

  h1 {
    color: ${({ theme }) => theme.Text};
    font-size: 40px;
    font-style: normal;
    font-weight: 600;
    line-height: 48px; /* 120% */
    align-self: stretch;
    padding: 0;
    margin: 0;
  }

  p {
    color: ${({ theme }) => theme.Labels};
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px; /* 150% */
  }

  label {
    color: ${({ theme }) => theme.Text};
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px; /* 150% */
    padding: 0px 16px;
    margin-bottom: 5px;
  }
  input {
    border-radius: 8px;
    color: ${({ theme }) => theme.Text};
    border: 1px solid ${({ theme }) => theme.Strokes};
    background: ${({ theme }) => theme.Input.Background};
    height: 48px;
    padding: 8px 16px;
  }
  input::placeholder {
    color: ${({ theme }) => theme.Labels};
  }

  .submit {
    margin-top: 24px;
    background: var(--brand-color, #FF8C00);
  }

  .err {
    color:  ${({ theme }) => theme.User.Inactive};
    padding: 0 16px;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px; /* 166.667% */
    height: 20px;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    height: 100vh
    max-height: 100vh;
    gap: 24px;
    .image-container {
      flex: 0 200px;
      .image {
        margin-top: 24px;
        transform: translateY(0);
        img {
          width: 60%;
        }
      }
    }
    .form-container {
      flex: 1 50%;
      .form {
        margin-top: 0;
        transform: translateY(0);
      }
    }

  } 
  *:disabled {
    opacity: 0.5;
  }

  .form-group {
    position: relative;
  }

  .loader {
    color: ${({ theme }) => theme.Text};
    position: absolute;
    top: 20px;
    left: 50%;
    .loading-indicator {
      color: ${({ theme }) => theme.Text};
    }
  }

`;

type RegistrationProps = {
  disabled?: boolean;
  onSubmit: (e: React.SyntheticEvent) => void;
  error?: string | null;
};

export const RegistrationPage = (
  { onSubmit, error = null, disabled = false }: RegistrationProps,
) => {
  const theme = useTheme();

  return (
    <Container>
      <div className="image-container">
        <div className="image">
          <img src={theme.registerIlustration} alt="logo" />
        </div>
      </div>
      <div className="form-container">
        <div className="form">
          <h1>Join Quack</h1>
          <p>free and open-source chat application</p>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="text"
                name="email"
                placeholder="user@example.com"
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Visible name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="John Doe"
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="password"
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <input
                className="submit"
                type="submit"
                value="REGISTER"
                disabled={disabled}
              />
              {disabled && (
                <div className="loader">
                  <Loader />
                </div>
              )}
            </div>
          </form>
          <div className="err">
            {error}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default RegistrationPage;
