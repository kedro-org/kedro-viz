import React from 'react';
import classnames from 'classnames';
import IconButton from '../ui/icon-button';
import MoodDissatisfiedIcon from '../icons/mood-dissatisfied';
import MoodVeryDissatisfiedIcon from '../icons/mood-very-dissatisfied';
import MoodNeutralIcon from '../icons/mood-neutral';
import MoodSatisfiedIcon from '../icons/mood-satisfied';
import MoodVerySatisfiedIcon from '../icons/mood-very-satisfied';

import './mood.scss';

const moodConfig = {
  'Very dissatisfied': MoodVeryDissatisfiedIcon,
  Dissatisfied: MoodDissatisfiedIcon,
  Neutral: MoodNeutralIcon,
  Satisfied: MoodSatisfiedIcon,
  'Very satisfied': MoodVerySatisfiedIcon,
};

export const Mood = ({ selectedMood, onClick }) => {
  return (
    <section className="mood-wrapper">
      {Object.entries(moodConfig).map(([moodName, moodIcon]) => (
        <div
          key={moodName}
          className={classnames('mood-icon-wrapper', {
            'mood-icon-wrapper--selected': moodName === selectedMood,
          })}
        >
          <IconButton
            icon={moodIcon}
            className={classnames('mood-icon', {
              'mood-icon--selected': moodName === selectedMood,
            })}
            onClick={() => onClick(moodName)}
          />
          <span
            className={classnames('mood-name', {
              'mood-name--selected': moodName === selectedMood,
            })}
          >
            {moodName}
          </span>
        </div>
      ))}
    </section>
  );
};
