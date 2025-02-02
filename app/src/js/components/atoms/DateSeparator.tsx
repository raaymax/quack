import styled from 'styled-components';
import { formatDateDetailed } from '../../utils';
import { observer } from 'mobx-react-lite';

const StyledDateSeparator = styled.div`
  text-align: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0;
  position: relative;
  padding: 16px;
  width: 100%;
  flex: 0 0 44px;

  .line {
    flex: 1 auto;
    height: 1px;
    background-color: ${props => props.theme.Strokes};
  }
  .label {
    flex: 0 auto;
    padding: 0 8px;
    font-size: 12px;
    line-height: 12px;
    color: ${props => props.theme.Labels};
  }
`;

type DateSeparatorProps = {
  date: string | undefined;
}

export const DateSeparator = observer(({ date }: DateSeparatorProps) => (
  <StyledDateSeparator>
    <div className='line'></div>
    <div className='label'>
      {formatDateDetailed(date)}
    </div>
    <div className='line'></div>
  </StyledDateSeparator>
));
