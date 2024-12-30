import { SizeProvider } from "../contexts/size";
import { LogoPic } from "../atoms/Logo";
import { useSelector } from "../../store";
import styled from "styled-components";

const Container = styled.div`
  flex: 0 0 64px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 16px 0;
  background-color: ${(props) => props.theme.Navbar.Background};
  color: ${(props) => props.theme.Text};
  & > *{
    margin: 0 auto;
  }
  .spacer {
    flex: 1;
  }
`;

export const Workspaces = () => {
  const userId = useSelector((state) => state?.me);
  return (
    <Container className="workspaces">
      <SizeProvider value={64}>
        <LogoPic onClick={() => {}}/>
        {/*<ButtonWithIcon icon="bars"/>*/}
        <div className="spacer" />
        {/*{userId && <ProfilePic type='regular' userId={userId}/> }*/}
      </SizeProvider>
    </Container>
  );
}
