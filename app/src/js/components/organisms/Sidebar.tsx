import { NavChannels } from "../molecules/NavChannels";
import { NavUsers } from "../molecules/NavUsers";
import { ClassNames, cn } from "../../utils";
import styled from "styled-components";
import { ThemeButtonS } from "../atoms/ThemeButton";
import { LoggedUser } from "../atoms/LoggedUser";


const Container = styled.div`
  flex: 0 0 356px;
  display: flex;
  background-color: ${(props) => props.theme.Channel.Background};
  flex-direction: column;

  .side-menu-header {
    flex: 0 0 64px;
    height: 64px;
    border-bottom: 1px solid ${(props) => props.theme.Strokes};
    padding: 16px 24px;
    font-size: 24px;
  }

  .slider {
    flex: 1 calc(100% - 50px);
    overflow-y: auto;
  }
  .bottom {
    flex: 0 50px;
  }
  @media (max-width : 710px) {
    width: 100%;
    height: 100vh;

    & .channel {
      height: 40px;
      line-height: 40px;
      vertical-align: middle;
      font-size: 20px;
      & .name {
      height: 40px;
        line-height: 40px;
        vertical-align: middle;
        font-size: 20px;
      }
    }
    & .user{
      height: 40px;
      line-height: 40px;
      vertical-align: middle;
      font-size: 20px;
      & .name {
      height: 40px;
        line-height: 40px;
        vertical-align: middle;
        font-size: 20px;
      }
    }
  }
  &.hidden {
    flex: 0 0px;
    width: 0px;
  }

`;
export const Sidebar = ({style, className}: {style?: {[key: string]: string}, className?: ClassNames}) => {
  return (
    <Container className={cn('side-menu', className)} style={style}>
      <div className='side-menu-header'>
        Workspace
      </div>
      <div className='slider'>
        <NavChannels />
        <NavUsers />
      </div>
      <div className='bottom'>
        <ThemeButtonS />
        <LoggedUser />
      </div>
    </Container>
  );
};
