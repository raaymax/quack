import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  padding: 5px 10px;
  padding-top: 20px;
  font-weight: bold;

  .title {
    flex: 1;
  }

  .action {
    cursor: pointer;
    flex: 0 15px;
    font-size: 19px;
  }
`;

const iconMap: Record<string, string> = {
  plus: "fa-solid fa-plus",
  xmark: "fa-solid fa-xmark",
};

type SectionHeaderProps = {
  title: string;
  onAction?: () => void;
  actionIcon?: string;
};

export const SectionHeader = ({
  title,
  onAction,
  actionIcon = "plus",
}: SectionHeaderProps) => (
  <Container className="header">
    <span className="title">{title}</span>
    {onAction && (
      <i
        className={`action ${iconMap[actionIcon] ?? actionIcon}`}
        onClick={onAction}
      />
    )}
  </Container>
);
