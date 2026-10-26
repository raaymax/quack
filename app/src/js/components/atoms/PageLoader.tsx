import styled, { keyframes } from "styled-components";

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background-color: ${(props) => props.theme.Chatbox.Background};

  img {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    animation: ${bob} 1.4s ease-in-out infinite;
  }

  .track {
    position: relative;
    width: 120px;
    height: 3px;
    overflow: hidden;
    border-radius: 3px;
    background-color: ${(props) => props.theme.Strokes};
  }

  .bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    border-radius: 3px;
    background-color: ${(props) => props.theme.PrimaryButton.Background};
    animation: ${slide} 1.1s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    img, .bar {
      animation: none;
    }
    .bar {
      width: 100%;
      opacity: 0.6;
    }
  }
`;

export const PageLoader = () => (
  <Container className="page-loader" role="status" aria-label="Loading">
    <img src="/avatar.svg" alt="" />
    <div className="track">
      <div className="bar" />
    </div>
  </Container>
);
