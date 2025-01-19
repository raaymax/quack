import { useCallback, useRef } from 'react';
import { cn, ClassNames } from '../../utils';
import { useTooltip } from '../contexts/useTooltip';
import { observer } from 'mobx-react-lite';

interface TooltipProps {
  children: React.ReactNode;
  className?: ClassNames;
  text: string | string[];
}

export const Tooltip = observer(({ children, text, className = '' }: TooltipProps) => {
  const {show, hide} = useTooltip(); 
  const source = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    if (!source.current) return;
    const sourceScreenPosition = source.current.getBoundingClientRect();
    const top = sourceScreenPosition.top + sourceScreenPosition.height + 3;
    const left = sourceScreenPosition.left + sourceScreenPosition.width / 2;
    show(
      [left, top],
      [text].flat().map((t, i) => [t, <br key={i} />]).flat().slice(0, -1),
      source.current
    );
  }, [source, text, show]);

  const hideTooltip = useCallback(() => {
    if (!source.current) return;
    hide(source.current);
  }, [source, hide]);

  return (
    <div
      className={cn('tooltip-container', className)}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => showTooltip()}
      onMouseLeave={() => hideTooltip()}
      ref={source}
    >
      {children}
    </div>
  );
});

