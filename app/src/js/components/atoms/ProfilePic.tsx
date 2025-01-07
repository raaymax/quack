import { ClassNames, cn } from '../../utils';
import { useUser } from '../../store';
import { getUrl } from '../../services/file';
import styled from 'styled-components';

const Pic = styled.div`
  position: relative;
  .image {
    overflow: hidden;
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 8px;

    img {
      display: block;
      border: 0px;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  &.regular {
    width: 48px;
    height: 48px;
    .image {
      border-radius: 8px;
    }
  }
  &.personal {
    width: 32px;
    height: 32px;
    .image {
      border-radius: 8px;
    }
    .status-ball {
      bottom: -1px;
      right: -1px;
    }

  }
  &.status {
    width: 24px;
    height: 24px;
    .image {
      border-radius: 4px;
    }
    .status-ball {
      width: 4px;
      height: 4px;
    }
  }
  &.tiny {
    width: 16px;
    height: 16px;
    .image {
      border-radius: 50%;
    }
  }
  &.reply {
    width: 16px;
    height: 16px;
    .image {
      border-radius: 4px;
    }
  }

  &.with-status .image{
    border-radius: 0;
    img {
      clip-path: polygon( 16.667% 0%,16.667% 0%,13.963% 0.218%,11.399% 0.85%,9.007% 1.86%,6.824% 3.216%,4.882% 4.882%,3.216% 6.824%,1.86% 9.007%,0.85% 11.399%,0.218% 13.963%,0% 16.667%,0% 83.333%,0% 83.333%,0.218% 86.037%,0.85% 88.601%,1.86% 90.993%,3.216% 93.176%,4.882% 95.118%,6.824% 96.784%,9.007% 98.14%,11.399% 99.15%,13.963% 99.782%,16.667% 100%,77.23% 100%,77.23% 100%,76.823% 99.253%,76.453% 98.483%,76.123% 97.693%,75.832% 96.882%,75.583% 96.053%,75.376% 95.206%,75.214% 94.342%,75.096% 93.464%,75.024% 92.572%,75% 91.667%,75% 91.667%,75.218% 88.963%,75.85% 86.399%,76.86% 84.007%,78.216% 81.824%,79.882% 79.882%,81.824% 78.216%,84.007% 76.86%,86.399% 75.85%,88.963% 75.218%,91.667% 75%,91.667% 75%,92.571% 75.024%,93.464% 75.096%,94.342% 75.214%,95.205% 75.376%,96.052% 75.583%,96.882% 75.832%,97.693% 76.123%,98.483% 76.453%,99.253% 76.823%,100% 77.23%,100% 16.667%,100% 16.667%,99.782% 13.963%,99.15% 11.399%,98.14% 9.007%,96.784% 6.824%,95.118% 4.882%,93.176% 3.216%,90.993% 1.86%,88.601% 0.85%,86.037% 0.218%,83.333% 0%,16.667% 0% );
    }
  }

  .status-ball {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    box-sizing: border-box;
    border-radius: 50%;
    background-color: #4CAF50;
    &.active {
      background-color: #4CAF50;
    }
    &.inactive {
      background-color: #9E9E9E;
    }
    &.away {
      background-color: #FFC107;
    }
  }
`;
type NotificationProps = {
  className?: ClassNames;
  userId: string;
  type: 'regular' | 'status' | 'tiny' | 'reply' | 'personal';
  showStatus?: boolean;
}

export const ProfilePic = ({ type = 'regular', showStatus = false, userId, className = [] }: NotificationProps) => {
  const user = useUser(userId);
  const status = user?.status || 'inactive';

  return (
    <Pic className={cn('avatar', type, {'with-status': showStatus}, className)}>
      <div className="image">
        { user?.avatarFileId
          ? <img src={getUrl(user?.avatarFileId)} alt='avatar' />
          : <img src="/avatar.png" alt='avatar' /> }
      </div>
      {showStatus && <div className={cn('status-ball', status)} />}
    </Pic>
  );
};

